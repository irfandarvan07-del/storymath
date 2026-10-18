from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class StoryOutput(BaseModel):
    """
    Structured output schema for the AI story and hint generator.
    Strictly validated in code before being presented to students.
    """
    story: str = Field(
        ...,
        description="2-3 sentence word problem narrative containing each problem number exactly once as digits."
    )
    question: str = Field(
        ...,
        description="Clear, direct question asking for the unknown quantity."
    )
    hint_1: str = Field(
        ...,
        description="Level 1 hint: A nudge question about the mathematical structure. Must NEVER name the operation."
    )
    hint_2: str = Field(
        ...,
        description="Level 2 hint: Points to the visual model. Must NEVER give the answer."
    )
    hint_3: str = Field(
        ...,
        description="Level 3 hint: A worked parallel example using DIFFERENT numbers."
    )


class StoryContext(BaseModel):
    """Contextual parameters passed into story generation."""
    structure: str = Field(..., description="Maths structure e.g. equal_sharing, unit_rate")
    numbers: Dict[str, Any] = Field(..., description="Dictionary of variable names and numerical values")
    answer: str = Field(..., description="Correct numerical answer calculated deterministically by engine")
    item_vocabulary: List[str] = Field(default_factory=list, description="Candidate context item nouns")
    people_vocabulary: List[str] = Field(default_factory=list, description="Candidate context people nouns")
    interest: Optional[str] = Field(None, description="Approved student interest (e.g. cricket, festivals)")
    reading_level: str = Field("grade-6", description="Target reading level for Class 5-7")
