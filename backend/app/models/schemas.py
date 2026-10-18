from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field

# Fixed step names defined in PROJECT.md section 9
StepName = Literal["facts", "model", "operation", "calculation", "sense_check"]
ModelType = Literal["groups_picture", "bar_model", "number_line"]
OperationType = Literal["addition", "subtraction", "multiplication", "division"]


# 1. Join
class StudentJoinRequest(BaseModel):
    class_code: str = Field(..., json_schema_extra={"example": "CLASS-6A"}, description="Code provided by the teacher")


class StudentJoinResponse(BaseModel):
    student_code: str = Field(..., json_schema_extra={"example": "S-4821"}, description="Anonymous student identifier")
    class_code: str


# 2. Next Problem
class NextProblemRequest(BaseModel):
    student_code: str = Field(..., json_schema_extra={"example": "S-4821"})
    interest: Optional[str] = Field(None, json_schema_extra={"example": "cricket"})


class Problem(BaseModel):
    attempt_id: int
    structure: str
    model_type: str = Field(..., description="groups_picture | bar_model | number_line")
    story: str
    question: str
    numbers: Dict[str, Any] = Field(..., description="Numbers given in the problem; answer is NEVER included")
    steps_enabled: List[str] = Field(
        default=["facts", "model", "operation", "calculation", "sense_check"],
        description="Active steps for this problem; facts & model skipped after 2 consecutive correct attempts"
    )
    sense_check_prompt: str


# 3. Step Submission & Feedback
class StepSubmission(BaseModel):
    step: str = Field(..., description="facts | model | operation | calculation | sense_check")
    response: Dict[str, Any] = Field(..., description="Submitted step payload (e.g. {'operation': 'division'})")


class StepFeedback(BaseModel):
    correct: bool
    hint_level: int = Field(0, description="0 if correct, 1-3 if wrong")
    hint_text: Optional[str] = None
    next_step: Optional[str] = None
    attempt_solved: bool = False


# 4. Finish Attempt
class FinishAttemptRequest(BaseModel):
    attempt_id: Optional[int] = None


class FinishAttemptResponse(BaseModel):
    status: str
    attempt_id: int
    solved: bool


# 5. Teacher Map & Groups
class TeacherMapResponse(BaseModel):
    class_code: str
    structures: List[str]
    steps: List[str]
    matrix: Dict[str, Dict[str, int]]  # structure -> step -> failure_count


class TeacherStuckGroup(BaseModel):
    structure: str
    failure_count: int
    students: List[str]


class TeacherGroupsResponse(BaseModel):
    class_code: str
    groups: List[TeacherStuckGroup]


# 6. Teacher Diagnosis Overrides
class TeacherOverrideRequest(BaseModel):
    event_id: int
    corrected_step: Optional[str] = None
    teacher_note: Optional[str] = None


class TeacherOverrideResponse(BaseModel):
    status: str
    event_id: int
    message: str
