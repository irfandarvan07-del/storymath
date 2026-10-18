from datetime import datetime, timezone
import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.engine.checker import check_step
from app.engine.loader import registry
from app.models.db import AttemptModel, ProblemModel, StepEventModel
from app.models.schemas import FinishAttemptRequest, FinishAttemptResponse, StepFeedback, StepSubmission

router = APIRouter(prefix="/attempts", tags=["Attempts"])

ALL_STEPS = ["facts", "model", "operation", "calculation", "sense_check"]
SKIPPED_STEPS = ["operation", "calculation", "sense_check"]


@router.post("/{attempt_id}/step", response_model=StepFeedback)
def submit_step(
    attempt_id: int,
    payload: StepSubmission,
    db: Session = Depends(get_db)
):
    """
    Submit an attempt step, check answer, log step_events, and return feedback / next hint.
    """
    attempt = db.query(AttemptModel).filter(AttemptModel.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail=f"Attempt {attempt_id} not found.")

    problem = db.query(ProblemModel).filter(ProblemModel.id == attempt.problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail=f"Associated problem for attempt {attempt_id} not found.")

    template = registry.get(problem.template_id)
    if not template:
        raise HTTPException(status_code=500, detail=f"Template {problem.template_id} not loaded in registry.")

    step_name = payload.step.lower().strip()
    if step_name not in ALL_STEPS:
        raise HTTPException(status_code=400, detail=f"Invalid step name '{payload.step}'.")

    # Determine previous failed events for this step to advance hint level
    prev_failures = (
        db.query(StepEventModel)
        .filter(
            StepEventModel.attempt_id == attempt.id,
            StepEventModel.step == step_name,
            StepEventModel.correct == False
        )
        .count()
    )

    # Reconstruct problem details for checking
    numbers_dict = json.loads(problem.numbers_json) if problem.numbers_json else {}
    problem_details = {
        "answer": problem.answer,
        "model_type": template.model,
        "operation": template.operation,
        "sense_check_answer": template.sense_check_answer,
        "numbers": numbers_dict,
    }

    is_correct, failure_reason = check_step(step_name, payload.response, problem_details)

    # Determine active step progression
    # Check if this attempt had facts/model submitted earlier
    had_facts = (
        db.query(StepEventModel)
        .filter(StepEventModel.attempt_id == attempt.id, StepEventModel.step == "facts")
        .first()
    )
    active_steps = ALL_STEPS if (had_facts or step_name in ["facts", "model"]) else SKIPPED_STEPS

    if not is_correct:
        hint_level = min(prev_failures + 1, 3)
        hint_text = template.hints.get(f"level_{hint_level}") or failure_reason
        next_step = step_name
        attempt_solved = False
    else:
        hint_level = 0
        hint_text = None
        try:
            curr_idx = active_steps.index(step_name)
            if curr_idx + 1 < len(active_steps):
                next_step = active_steps[curr_idx + 1]
                attempt_solved = False
            else:
                next_step = None
                attempt_solved = True
                attempt.solved = True
                attempt.finished_at = datetime.now(timezone.utc)
        except ValueError:
            next_step = None
            attempt_solved = True

    # Record event in step_events
    event = StepEventModel(
        attempt_id=attempt.id,
        step=step_name,
        correct=is_correct,
        hint_level=hint_level,
        response_json=json.dumps(payload.response),
        ts=datetime.now(timezone.utc)
    )
    db.add(event)
    db.commit()

    return StepFeedback(
        correct=is_correct,
        hint_level=hint_level,
        hint_text=hint_text,
        next_step=next_step,
        attempt_solved=attempt_solved
    )


@router.post("/{attempt_id}/finish", response_model=FinishAttemptResponse)
def finish_attempt(
    attempt_id: int,
    payload: Optional[FinishAttemptRequest] = None,
    db: Session = Depends(get_db)
):
    """
    Explicitly finish and close an attempt.
    """
    target_id = payload.attempt_id if payload and payload.attempt_id else attempt_id
    attempt = db.query(AttemptModel).filter(AttemptModel.id == target_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail=f"Attempt {target_id} not found.")

    if not attempt.finished_at:
        attempt.finished_at = datetime.now(timezone.utc)
    db.commit()

    return FinishAttemptResponse(
        status="finished",
        attempt_id=attempt.id,
        solved=attempt.solved
    )
