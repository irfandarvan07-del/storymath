import pytest
from app.ai.schema import StoryContext, StoryOutput
from app.ai.prompts import SYSTEM_PROMPT, build_user_prompt
from app.ai.client import clean_llm_json_response, synthesize_fallback_story
from app.ai.cache import StoryCache
from app.ai.generator import generate_story, generate_fallback_from_template
from app.engine.loader import registry
from app.validation.rules import validate_story_output


def test_clean_llm_json_response():
    markdown_wrapped = """```json
{
  "story": "Test story",
  "question": "Test question?",
  "hint_1": "Nudge",
  "hint_2": "Model",
  "hint_3": "Parallel"
}
```"""
    cleaned = clean_llm_json_response(markdown_wrapped)
    assert cleaned.startswith("{")
    assert cleaned.endswith("}")
    assert "```" not in cleaned


def test_build_user_prompt():
    context = StoryContext(
        structure="equal_sharing",
        numbers={"total": 84, "groups": 12},
        answer="7",
        item_vocabulary=["laddoos", "samosas"],
        people_vocabulary=["children", "friends"],
        interest="cricket",
        reading_level="grade-6"
    )
    prompt = build_user_prompt(context)
    assert "equal_sharing" in prompt
    assert "total = 84" in prompt
    assert "cricket" in prompt
    assert "FORBIDDEN" in prompt


@pytest.mark.parametrize("structure, numbers, answer", [
    ("equal_sharing", {"total": 84, "groups": 12}, "7"),
    ("equal_groups", {"groups": 6, "per_group": 8}, "48"),
    ("difference_comparison", {"larger": 60, "smaller": 40}, "20"),
    ("unit_rate", {"total_cost": 100, "units": 4}, "25"),
    ("fraction_of_a_quantity", {"whole": 36, "den": 4, "num": 1}, "9"),
    ("perimeter_area", {"length": 12, "width": 8}, "40"),
])
def test_synthesizer_passes_all_validation_rules(structure, numbers, answer):
    context = StoryContext(
        structure=structure,
        numbers=numbers,
        answer=answer,
        item_vocabulary=["mangoes", "notebooks"],
        people_vocabulary=["students", "gardeners"],
        interest="cricket",
        reading_level="grade-6"
    )
    story_obj = synthesize_fallback_story(context)

    # Must be valid StoryOutput
    assert isinstance(story_obj, StoryOutput)
    is_valid, errors = validate_story_output(story_obj, numbers, answer)
    assert is_valid is True, f"Failed for {structure}: {errors}"


def test_story_cache(tmp_path):
    cache_file = tmp_path / "test_pool.json"
    cache = StoryCache(cache_file=cache_file)
    assert cache.count() == 0

    output = StoryOutput(
        story="Test story with 12 and 84.",
        question="How many?",
        hint_1="Think about shares.",
        hint_2="Draw the boxes.",
        hint_3="When 2 share 10, 10 / 2 = 5 each."
    )
    cache.put("share_01", "cricket", output, {"total": 84, "groups": 12})
    assert cache.count() == 1

    retrieved = cache.get("share_01", "cricket")
    assert retrieved is not None
    assert retrieved.story == output.story

    # Test cache persistence
    cache_reloaded = StoryCache(cache_file=cache_file)
    assert cache_reloaded.count() == 1


def test_generate_story_integration():
    registry.load_all()
    template = registry.get("share_equal_01")
    assert template is not None

    numbers = {"total": 84, "groups": 12}
    answer = "7"

    # Generates story with validation and fallback guarantee
    result = generate_story(
        template=template,
        numbers=numbers,
        interest="cricket",
        answer=answer
    )

    assert isinstance(result, StoryOutput)
    is_valid, errors = validate_story_output(result, numbers, answer)
    assert is_valid is True, f"Errors: {errors}"
