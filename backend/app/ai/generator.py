import logging
from typing import Any, Dict, Optional

from app.ai.cache import story_cache
from app.ai.client import call_claude_api
from app.ai.schema import StoryContext, StoryOutput
from app.engine.loader import TemplateSchema
from app.validation.rules import validate_story_output

logger = logging.getLogger(__name__)


def generate_fallback_from_template(
    template: TemplateSchema,
    numbers: Dict[str, Any],
    answer: str
) -> StoryOutput:
    """
    Renders the template's handwritten text pattern as the guaranteed safe fallback.
    Used if all AI generation attempts fail validation.
    """
    item = template.items[0] if template.items else "items"
    person = template.people[0] if template.people else "students"

    render_ctx = {
        **numbers,
        "item": item,
        "people": person,
        "answer": answer
    }

    try:
        story_text = template.text_pattern.format(**render_ctx)
    except Exception:
        story_text = template.text_pattern

    try:
        question_text = (template.question_pattern or "Find the answer.").format(**render_ctx)
    except Exception:
        question_text = template.question_pattern or "Find the answer."

    h1 = template.hints.get("level_1", "Think about what is happening to the quantities in this problem.")
    h2 = template.hints.get("level_2", f"Draw a {template.model.replace('_', ' ')} to show the known values.")
    h3 = template.hints.get(
        "level_3",
        "Consider a similar problem: when 4 groups have 5 items each, 4 * 5 = 20. Try the same step."
    )

    return StoryOutput(
        story=story_text,
        question=question_text,
        hint_1=h1,
        hint_2=h2,
        hint_3=h3
    )


def generate_story(
    template: TemplateSchema,
    numbers: Dict[str, Any],
    interest: Optional[str] = None,
    answer: Optional[str] = None,
    max_retries: int = 2
) -> StoryOutput:
    """
    Generates a natural Indian maths story for the given template and numbers.
    
    Workflow:
    1. Check pre-generated and cached story pool.
    2. Call AI story generation (Claude API or deterministic synthesizer).
    3. Validate against all 6 strict mathematical and safety rules.
    4. If validation fails, retry up to max_retries (default: 2).
    5. If all retries fail, fall back to the plain-text template.
    
    Guarantees:
    - AI NEVER changes or computes the numbers.
    - Output is strictly validated before reaching any student.
    - Zero crashes; guaranteed fallback.
    """
    ans_str = str(answer) if answer is not None else str(numbers.get("answer", ""))

    # 1. Check cache first
    cached = story_cache.get(template.id, interest)
    if cached:
        is_valid, _ = validate_story_output(cached, numbers, ans_str)
        if is_valid:
            logger.info(f"Serving pre-validated cached story for template {template.id} [{interest}]")
            return cached

    # Context setup
    context = StoryContext(
        structure=template.structure,
        numbers=numbers,
        answer=ans_str,
        item_vocabulary=template.items or [],
        people_vocabulary=template.people or [],
        interest=interest,
        reading_level="grade-6"
    )

    # 2. Generation & Retry Loop (max 2 retries)
    for attempt_no in range(max_retries + 1):
        candidate = call_claude_api(context)
        is_valid, errors = validate_story_output(candidate, numbers, ans_str)

        if is_valid:
            logger.info(f"Story validated successfully on attempt {attempt_no + 1}")
            # Cache successfully validated story
            story_cache.put(template.id, interest, candidate, numbers)
            return candidate
        else:
            logger.warning(
                f"Story validation failed on attempt {attempt_no + 1}: {errors}. "
                f"{'Retrying...' if attempt_no < max_retries else 'Falling back to template plain text.'}"
            )

    # 3. Fallback to plain template text
    logger.info(f"Using template plain-text fallback for {template.id}")
    return generate_fallback_from_template(template, numbers, ans_str)
