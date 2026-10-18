from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.engine.loader import registry
from app.models.db import AttemptModel, ClassModel, ProblemModel, StepEventModel, StudentModel, TemplateModel
from app.models.schemas import (
    TeacherGroupsResponse,
    TeacherMapResponse,
    TeacherOverrideRequest,
    TeacherOverrideResponse,
    TeacherStuckGroup,
)

router = APIRouter(prefix="/teacher", tags=["Teacher"])

ALL_STRUCTURES = [
    "equal_sharing",
    "equal_groups",
    "difference_comparison",
    "unit_rate",
    "fraction_of_a_quantity",
    "perimeter_area",
]
ALL_STEPS = ["facts", "model", "operation", "calculation", "sense_check"]


@router.get("/class/{code}/map", response_model=TeacherMapResponse)
def get_failure_map(code: str, db: Session = Depends(get_db)):
    """
    Structure-by-step failure map for a given class.
    Rows = 6 structures, Columns = 5 steps.
    Helps the teacher see immediately: 'What to reteach tomorrow and to whom'.
    """
    class_code = code.strip().upper()
    klass = db.query(ClassModel).filter(ClassModel.code == class_code).first()
    if not klass:
        # Return empty matrix for new/empty class
        empty_matrix = {struct: {step: 0 for step in ALL_STEPS} for struct in ALL_STRUCTURES}
        return TeacherMapResponse(
            class_code=class_code,
            structures=ALL_STRUCTURES,
            steps=ALL_STEPS,
            matrix=empty_matrix
        )

    # Initialize full matrix
    matrix = {struct: {step: 0 for step in ALL_STEPS} for struct in ALL_STRUCTURES}

    # Query all incorrect step events for students of this class
    query = (
        db.query(TemplateModel.structure_id, StepEventModel.step)
        .join(ProblemModel, ProblemModel.template_id == TemplateModel.id)
        .join(AttemptModel, AttemptModel.problem_id == ProblemModel.id)
        .join(StepEventModel, StepEventModel.attempt_id == AttemptModel.id)
        .join(StudentModel, StudentModel.id == AttemptModel.student_id)
        .filter(StudentModel.class_id == klass.id, StepEventModel.correct == False)
        .all()
    )

    for structure_id, step in query:
        if structure_id in matrix and step in matrix[structure_id]:
            matrix[structure_id][step] += 1

    return TeacherMapResponse(
        class_code=class_code,
        structures=ALL_STRUCTURES,
        steps=ALL_STEPS,
        matrix=matrix
    )


@router.get("/class/{code}/groups", response_model=TeacherGroupsResponse)
def get_stuck_groups(code: str, db: Session = Depends(get_db)):
    """
    Group students stuck on the same structure (by anonymous code only).
    """
    class_code = code.strip().upper()
    klass = db.query(ClassModel).filter(ClassModel.code == class_code).first()
    if not klass:
        return TeacherGroupsResponse(class_code=class_code, groups=[])

    # For each student, tally failures per structure
    query = (
        db.query(StudentModel.code, TemplateModel.structure_id)
        .join(AttemptModel, AttemptModel.student_id == StudentModel.id)
        .join(ProblemModel, ProblemModel.id == AttemptModel.problem_id)
        .join(TemplateModel, TemplateModel.id == ProblemModel.template_id)
        .join(StepEventModel, StepEventModel.attempt_id == AttemptModel.id)
        .filter(StudentModel.class_id == klass.id, StepEventModel.correct == False)
        .all()
    )

    # student_code -> structure -> count
    student_struct_counts = defaultdict(lambda: defaultdict(int))
    for s_code, structure in query:
        student_struct_counts[s_code][structure] += 1

    # Group students by their most failed structure
    groups_dict = defaultdict(list)
    structure_failure_totals = defaultdict(int)

    for s_code, struct_counts in student_struct_counts.items():
        if not struct_counts:
            continue
        # Find primary struggle
        primary_struct = max(struct_counts.items(), key=lambda x: x[1])[0]
        groups_dict[primary_struct].append(s_code)
        structure_failure_totals[primary_struct] += struct_counts[primary_struct]

    results = []
    for structure in ALL_STRUCTURES:
        students = groups_dict.get(structure, [])
        if students:
            results.append(
                TeacherStuckGroup(
                    structure=structure,
                    failure_count=structure_failure_totals[structure],
                    students=students
                )
            )

    return TeacherGroupsResponse(
        class_code=class_code,
        groups=results
    )


@router.post("/overrides", response_model=TeacherOverrideResponse)
def override_diagnosis(payload: TeacherOverrideRequest, db: Session = Depends(get_db)):
    """
    Allow teacher to correct a logged diagnosis on a step event.
    """
    event = db.query(StepEventModel).filter(StepEventModel.id == payload.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail=f"Step event {payload.event_id} not found.")

    if payload.corrected_step:
        event.step = payload.corrected_step.strip()
    db.commit()

    return TeacherOverrideResponse(
        status="success",
        event_id=event.id,
        message="Teacher diagnosis override recorded successfully."
    )
