import pytest
from app.ai.schema import StoryOutput
from app.validation.rules import (
    validate_every_number_appears_once,
    validate_no_extra_numbers,
    validate_no_answer_leakage,
    validate_length_and_reading_level,
    validate_hint_3_parallel_example,
    validate_story_output,
)


# ==============================================================================
# Rule 1 Tests: Every number appears exactly once
# ==============================================================================

def test_rule_1_valid():
    story = "12 children shared 84 laddoos equally during the Diwali festival. Everyone enjoyed the sweets."
    numbers = {"total": 84, "groups": 12}
    ok, err = validate_every_number_appears_once(story, numbers)
    assert ok is True
    assert err is None


def test_rule_1_missing_number():
    story = "Children shared 84 laddoos equally during Diwali. Everyone enjoyed the sweets."
    numbers = {"total": 84, "groups": 12}
    ok, err = validate_every_number_appears_once(story, numbers)
    assert ok is False
    assert "12" in err
    assert "missing" in err


def test_rule_1_repeated_number():
    story = "12 children had 12 plates and shared 84 laddoos equally. Everyone was happy."
    numbers = {"total": 84, "groups": 12}
    ok, err = validate_every_number_appears_once(story, numbers)
    assert ok is False
    assert "appears 2 times" in err


def test_rule_1_word_boundary_no_false_substring():
    # '12' should not match inside '120'
    story = "There were 120 boxes stored in the warehouse. None was open."
    numbers = {"groups": 12}
    ok, err = validate_every_number_appears_once(story, numbers)
    assert ok is False
    assert "missing" in err


# ==============================================================================
# Rule 2 Tests: No extra numbers appear
# ==============================================================================

def test_rule_2_valid():
    story = "A shop has 6 boxes with 8 pencils in each box. The shopkeeper stacked them neatly."
    question = "How many pencils are there altogether?"
    numbers = {"groups": 6, "per_group": 8}
    ok, err = validate_no_extra_numbers(story, question, numbers)
    assert ok is True
    assert err is None


def test_rule_2_extra_digit_in_story():
    story = "A shop has 6 boxes with 8 pencils and 2 erasers in each box."
    question = "How many pencils are there altogether?"
    numbers = {"groups": 6, "per_group": 8}
    ok, err = validate_no_extra_numbers(story, question, numbers)
    assert ok is False
    assert "Unexpected extra number '2'" in err


def test_rule_2_extra_digit_in_question():
    story = "A shop has 6 boxes with 8 pencils in each box. The shelf was clean."
    question = "How many pencils are there across 3 shelves?"
    numbers = {"groups": 6, "per_group": 8}
    ok, err = validate_no_extra_numbers(story, question, numbers)
    assert ok is False
    assert "Unexpected extra number '3'" in err


def test_rule_2_rogue_number_word():
    story = "A shop has 6 boxes with 8 pencils each. Three monitors inspected the boxes."
    question = "How many pencils are there altogether?"
    numbers = {"groups": 6, "per_group": 8}
    ok, err = validate_no_extra_numbers(story, question, numbers)
    assert ok is False
    assert "three" in err.lower()


# ==============================================================================
# Rule 3 Tests: No answer leakage & Hint 1 operation naming
# ==============================================================================

def test_rule_3_valid():
    story = "12 students share 84 books equally. The library was quiet."
    question = "How many books does each student get?"
    hints = [
        "Are the books being separated into equal shares or joined together?",
        "Draw 12 equal group boxes representing the shares.",
        "When 3 friends share 15 stickers, 15 / 3 = 5 stickers each. Follow the same step."
    ]
    answer = "7"
    ok, err = validate_no_answer_leakage(story, question, hints, answer)
    assert ok is True
    assert err is None


def test_rule_3_answer_leaked_in_story():
    story = "12 students share 84 books and 7 tables. Everyone gets their share."
    question = "How many books does each student get?"
    hints = ["Think of equal parts.", "Draw the boxes.", "Try 15 / 3 = 5."]
    answer = "7"
    ok, err = validate_no_answer_leakage(story, question, hints, answer)
    assert ok is False
    assert "leaked in the story" in err


def test_rule_3_answer_leaked_in_hint_2():
    story = "12 students share 84 books equally. The desks were clean."
    question = "How many books does each student get?"
    hints = [
        "Think of equal parts.",
        "Draw 12 boxes with 7 books in each box.",  # Leaks answer 7!
        "Try 15 / 3 = 5."
    ]
    answer = "7"
    ok, err = validate_no_answer_leakage(story, question, hints, answer)
    assert ok is False
    assert "leaked in Hint 2" in err


def test_rule_3_hint_1_names_operation():
    story = "12 students share 84 books equally. The room was bright."
    question = "How many books does each student get?"
    hints = [
        "You must divide the total by the groups.",  # Forbids naming 'divide'
        "Draw 12 boxes.",
        "Try 15 / 3 = 5."
    ]
    answer = "7"
    ok, err = validate_no_answer_leakage(story, question, hints, answer)
    assert ok is False
    assert "Hint 1 names the operation" in err


# ==============================================================================
# Rule 4 Tests: Story length and reading level
# ==============================================================================

def test_rule_4_valid():
    story = "Aarav visited the exhibition and purchased 5 science badges. Each badge was carefully pinned to his jacket."
    ok, err = validate_length_and_reading_level(story)
    assert ok is True
    assert err is None


def test_rule_4_too_few_sentences():
    story = "Aarav bought 5 science badges from the counter."
    ok, err = validate_length_and_reading_level(story)
    assert ok is False
    assert "sentence count" in err


def test_rule_4_too_short_words():
    story = "He ran 5 laps. It was fast."
    ok, err = validate_length_and_reading_level(story)
    assert ok is False
    assert "word count" in err


# ==============================================================================
# Rule 5 Tests: Hint 3 parallel worked example
# ==============================================================================

def test_rule_5_valid():
    hint_3 = "For example, if 4 friends share 20 mangoes, 20 / 4 = 5 each. Apply the same division."
    numbers = {"total": 84, "groups": 12}
    answer = "7"
    ok, err = validate_hint_3_parallel_example(hint_3, numbers, answer)
    assert ok is True
    assert err is None


def test_rule_5_reuses_problem_number():
    hint_3 = "For example, when 12 friends share 60 mangoes, 60 / 12 = 5 each."
    numbers = {"total": 84, "groups": 12}
    answer = "7"
    ok, err = validate_hint_3_parallel_example(hint_3, numbers, answer)
    assert ok is False
    assert "reuses problem numbers" in err


def test_rule_5_leaks_answer():
    hint_3 = "For example, 21 shared by 3 gives 7 items each."
    numbers = {"total": 84, "groups": 12}
    answer = "7"
    ok, err = validate_hint_3_parallel_example(hint_3, numbers, answer)
    assert ok is False
    assert "reuses problem numbers or answer" in err


# ==============================================================================
# Rule 6 Tests: Overall StoryOutput validation
# ==============================================================================

def test_rule_6_overall_valid():
    output = StoryOutput(
        story="A coach received 84 cricket practice balls to distribute across 12 training nets. Every training net received the exact same share for fielding practice.",
        question="How many practice balls were allocated to each of the 12 nets?",
        hint_1="Are the items being split into separate equal shares, or are they being joined together into one pile?",
        hint_2="Draw a bar model or group boxes showing the total quantity partitioned into equal parts.",
        hint_3="For instance, if 3 children share 15 pencils equally, each gets 15 / 3 = 5 pencils. Use the same division method for your problem."
    )
    numbers = {"total": 84, "groups": 12}
    answer = "7"

    is_valid, errors = validate_story_output(output, numbers, answer)
    assert is_valid is True
    assert len(errors) == 0
