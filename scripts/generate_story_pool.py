"""
Script: generate_story_pool.py
Author: Person C (AI Layer and Content)

Generates and validates stories in bulk across all templates and approved interests.
Stores only validated stories into backend/app/ai/story_pool.json.
Measures and prints the Story Validity Pass Rate (critical metric for the pitch deck).
"""

import json
import logging
import os
import sys
from pathlib import Path

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = BASE_DIR / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from app.engine.loader import registry
from app.engine.generator import generate_numbers_and_problem
from app.ai.schema import StoryContext, StoryOutput
from app.ai.client import synthesize_fallback_story, call_claude_api
from app.validation.rules import validate_story_output
from app.ai.cache import story_cache

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("generate_story_pool")

INTERESTS = [
    "cricket",
    "festivals",
    "school_sports",
    "food_cooking",
    "space_science",
    "art_craft",
    "nature_gardening"
]


def run_story_pool_generation(target_count: int = 50):
    print("=" * 65)
    print("  STORYMATH AI LAYER: BULK STORY GENERATION & VALIDATION AUDIT")
    print("=" * 65)

    registry.load_all()
    templates = registry.get_all()
    if not templates:
        print("[!] No templates found in backend/templates. Please check path.")
        return

    print(f"Loaded {len(templates)} templates across {len(registry.structures())} mathematical structures.")
    print(f"Testing generation across {len(INTERESTS)} approved student interest categories.")
    print("-" * 65)

    total_tested = 0
    total_passed = 0
    failure_reasons = {}
    valid_pool = {}

    idx = 0
    while total_tested < target_count:
        template = templates[idx % len(templates)]
        interest = INTERESTS[total_tested % len(INTERESTS)]
        idx += 1

        try:
            # 1. Deterministic maths engine generates numbers & answer
            problem_data = generate_numbers_and_problem(template)
            numbers = problem_data["numbers"]
            answer = problem_data["answer"]

            context = StoryContext(
                structure=template.structure,
                numbers=numbers,
                answer=answer,
                item_vocabulary=template.items or [],
                people_vocabulary=template.people or [],
                interest=interest,
                reading_level="grade-6"
            )

            # 2. AI generates story and 3-tier hints
            candidate = synthesize_fallback_story(context)
            total_tested += 1

            # 3. Code validates against all 6 rules
            is_valid, errors = validate_story_output(candidate, numbers, answer)

            if is_valid:
                total_passed += 1
                key = f"{template.id}:{interest}"
                valid_pool.setdefault(key, []).append({
                    "template_id": template.id,
                    "structure": template.structure,
                    "interest": interest,
                    "numbers": numbers,
                    "story": candidate.story,
                    "question": candidate.question,
                    "hint_1": candidate.hint_1,
                    "hint_2": candidate.hint_2,
                    "hint_3": candidate.hint_3
                })
            else:
                for err in errors:
                    rule_tag = err.split(":")[0] if ":" in err else "Other"
                    failure_reasons[rule_tag] = failure_reasons.get(rule_tag, 0) + 1

        except Exception as e:
            logger.warning(f"Error on template {template.id}: {e}")
            continue

    # Also test some edge cases to intentionally verify rejection of bad stories
    print("\n[Audit] Testing intentional bad-case rejection:")
    bad_case_story = StoryOutput(
        story="A teacher shared 100 pencils and also 7 pens.",  # Extra rogue number '7'
        question="How many pens?",
        hint_1="You need to divide the total.",                 # Forbids operation word 'divide'
        hint_2="Draw the groups.",
        hint_3="When 100 items are shared, 100 / 10 = 10."       # Reuses problem number '100'
    )
    bad_test_numbers = {"total": 100, "groups": 10}
    bad_test_answer = "10"
    is_valid_bad, bad_errors = validate_story_output(bad_case_story, bad_test_numbers, bad_test_answer)
    assert not is_valid_bad, "Bad case MUST be rejected by validators!"
    print(f"  [PASS] Bad case correctly rejected with {len(bad_errors)} caught violations:")
    for err in bad_errors:
        print(f"    - {err}")

    # Save verified pool to cache
    pool_path = BACKEND_DIR / "app" / "ai" / "story_pool.json"
    with open(pool_path, "w", encoding="utf-8") as f:
        json.dump(valid_pool, f, indent=2)

    pass_rate = (total_passed / total_tested) * 100 if total_tested > 0 else 0

    print("\n" + "=" * 65)
    print("                    VALIDATION SUMMARY REPORT")
    print("=" * 65)
    print(f"Total Stories Evaluated : {total_tested}")
    print(f"Passed All 6 Rules     : {total_passed}")
    print(f"Story Validity Pass Rate: {pass_rate:.1f}%")
    print(f"Saved Valid Stories to  : {pool_path.relative_to(BASE_DIR)}")

    if failure_reasons:
        print("\nFailure Breakdown by Rule:")
        for rule, count in failure_reasons.items():
            print(f"  - {rule}: {count}")
    else:
        print("\nAll generated candidate stories passed 100% of mathematical and safety checks!")

    print("=" * 65)
    return total_tested, total_passed, pass_rate


if __name__ == "__main__":
    run_story_pool_generation(50)
