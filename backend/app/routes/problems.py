from datetime import datetime, timezone
import json
from pathlib import Path
import random
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.config import FIXTURES_DIR
from app.database import get_db
from app.engine.generator import generate_numbers_and_problem
from app.engine.loader import registry
from app.models.db import AttemptModel, ProblemModel, StepEventModel, StudentModel, TemplateModel
from app.models.schemas import NextProblemRequest, Problem

router = APIRouter(prefix="/problems", tags=["Problems"])


@router.get("/next/sample", response_model=Problem)
def get_sample_problem():
    """
    Returns the static sample problem fixture so frontend (Person A)
    can test without full database interaction.
    """
    fixture_path = FIXTURES_DIR / "sample_problem.json"
    if not fixture_path.exists():
        raise HTTPException(status_code=404, detail="Sample problem fixture not found.")
    with open(fixture_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return Problem(**data)


def choose_structure_for_student(student: StudentModel, db: Session) -> str:
    """
    Pick a structure based on student history: weakest structure (most failures) first.
    If no failures recorded, picks a random structure among available ones.
    """
    structures = registry.structures()
    if not structures:
        structures = [
            "equal_sharing",
            "equal_groups",
            "difference_comparison",
            "unit_rate",
            "fraction_of_a_quantity",
            "perimeter_area"
        ]

    # Query failures grouped by template -> structure
    failures = (
        db.query(TemplateModel.structure_id, func.count(StepEventModel.id))
        .join(ProblemModel, ProblemModel.template_id == TemplateModel.id)
        .join(AttemptModel, AttemptModel.problem_id == ProblemModel.id)
        .join(StepEventModel, StepEventModel.attempt_id == AttemptModel.id)
        .filter(AttemptModel.student_id == student.id, StepEventModel.correct == False)
        .group_by(TemplateModel.structure_id)
        .all()
    )

    if failures:
        # Sort by failure count descending
        failures.sort(key=lambda x: x[1], reverse=True)
        weakest_structure = failures[0][0]
        if weakest_structure in structures:
            return weakest_structure

    return random.choice(structures)


def should_skip_scaffolding(student: StudentModel, db: Session) -> bool:
    """
    Rule: Skip 'facts' and 'model' after two correct problems in a row.
    Checks the student's last two attempts.
    """
    recent_attempts = (
        db.query(AttemptModel)
        .filter(AttemptModel.student_id == student.id)
        .order_by(AttemptModel.started_at.desc())
        .limit(2)
        .all()
    )

    if len(recent_attempts) < 2:
        return False

    for attempt in recent_attempts:
        if not attempt.solved:
            return False
        # Ensure there were no wrong step events in that attempt
        has_errors = (
            db.query(StepEventModel)
            .filter(StepEventModel.attempt_id == attempt.id, StepEventModel.correct == False)
            .first()
        )
        if has_errors:
            return False

    return True


@router.post("/next", response_model=Problem)
def next_problem(payload: NextProblemRequest, db: Session = Depends(get_db)):
    """
    Generate and serve the next problem for a student.
    - Selects structure (weakest first)
    - Picks template & generates deterministic numbers
    - Stores Problem and Attempt in DB
    - Answer remains strictly server-side
    - Applies skip logic: skips facts & model after 2 consecutive clean solves
    """
    student = db.query(StudentModel).filter(StudentModel.code == payload.student_code.strip()).first()
    if not student:
        raise HTTPException(status_code=404, detail=f"Student code '{payload.student_code}' not found.")

    structure = choose_structure_for_student(student, db)
    templates = registry.get_by_structure(structure)
    if not templates:
        templates = registry.get_all()
        if not templates:
            raise HTTPException(status_code=500, detail="No problem templates available in registry.")

    template = random.choice(templates)
    problem_data = generate_numbers_and_problem(template)

    # Person C: AI story and hint generation with 6-rule validation & fallback
    try:
        from app.ai.generator import generate_story
        story_output = generate_story(
            template=template,
            numbers=problem_data["numbers"],
            interest=payload.interest,
            answer=problem_data["answer"]
        )
        problem_data["story"] = story_output.story
        problem_data["question"] = story_output.question
        if "hints" in problem_data:
            problem_data["hints"]["level_1"] = story_output.hint_1
            problem_data["hints"]["level_2"] = story_output.hint_2
            problem_data["hints"]["level_3"] = story_output.hint_3
    except Exception:
        pass

    # Ensure template is in DB
    db_template = db.query(TemplateModel).filter(TemplateModel.id == template.id).first()
    if not db_template:
        db_template = TemplateModel(
            id=template.id,
            structure_id=template.structure,
            text_pattern=template.text_pattern,
            ranges_json=json.dumps(template.numbers),
            answer_formula=template.answer,
        )
        db.add(db_template)
        db.commit()

    # Save problem in DB (answer stored here, NEVER sent to client)
    db_problem = ProblemModel(
        template_id=template.id,
        numbers_json=json.dumps(problem_data["numbers"]),
        answer=problem_data["answer"],
        story_text=problem_data["story"],
        created_at=datetime.now(timezone.utc)
    )
    db.add(db_problem)
    db.commit()
    db.refresh(db_problem)

    # Determine steps enabled based on prior completed attempts
    if should_skip_scaffolding(student, db):
        steps_enabled = ["operation", "calculation", "sense_check"]
    else:
        steps_enabled = ["facts", "model", "operation", "calculation", "sense_check"]

    # Create new attempt
    attempt = AttemptModel(
        student_id=student.id,
        problem_id=db_problem.id,
        started_at=datetime.now(timezone.utc),
        solved=False
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return Problem(
        attempt_id=attempt.id,
        structure=problem_data["structure"],
        model_type=problem_data["model_type"],
        story=problem_data["story"],
        question=problem_data["question"],
        numbers=problem_data["numbers"],
        steps_enabled=steps_enabled,
        sense_check_prompt=problem_data["sense_check_prompt"]
    )
