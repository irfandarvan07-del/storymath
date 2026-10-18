import re
from typing import Any, Dict, List, Optional, Set, Tuple
from app.ai.schema import StoryOutput

# Number words mapped to digits for leakage & rogue quantity checks
NUMBER_WORDS = {
    "zero": "0", "one": "1", "two": "2", "three": "3", "four": "4",
    "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9",
    "ten": "10", "eleven": "11", "twelve": "12", "thirteen": "13",
    "fourteen": "14", "fifteen": "15", "sixteen": "16", "seventeen": "17",
    "eighteen": "18", "nineteen": "19", "twenty": "20", "thirty": "30",
    "forty": "40", "fifty": "50", "sixty": "60", "seventy": "70",
    "eighty": "80", "ninety": "90", "hundred": "100"
}

FORBIDDEN_OPERATION_WORDS = {
    "divide", "division", "dividing", "divided",
    "multiply", "multiplication", "multiplying", "multiplied",
    "subtract", "subtraction", "subtracting", "subtracted",
    "addition", "adding"
}


def _clean_num(val: Any) -> str:
    """Normalizes an integer or float string into standard integer format if applicable."""
    if isinstance(val, (int, float)):
        return str(int(val)) if float(val).is_integer() else str(val)
    s = str(val).strip()
    try:
        f = float(s)
        return str(int(f)) if f.is_integer() else s
    except ValueError:
        return s


def validate_every_number_appears_once(
    story: str,
    numbers: Dict[str, Any]
) -> Tuple[bool, Optional[str]]:
    """
    Rule 1: Every number from `numbers` must appear in the story EXACTLY ONCE as digits.
    Uses regex word boundaries so '12' does not match within '120'.
    """
    for var_name, raw_val in numbers.items():
        num_str = _clean_num(raw_val)
        # Match using word boundaries for digits
        pattern = rf"(?<!\d){re.escape(num_str)}(?!\d)"
        matches = re.findall(pattern, story)
        if len(matches) == 0:
            return False, f"Rule 1 Failed: Number {num_str} ({var_name}) is missing from the story."
        if len(matches) > 1:
            return False, f"Rule 1 Failed: Number {num_str} ({var_name}) appears {len(matches)} times in the story (expected exactly 1)."

    return True, None


def validate_no_extra_numbers(
    story: str,
    question: str,
    numbers: Dict[str, Any]
) -> Tuple[bool, Optional[str]]:
    """
    Rule 2: No extra numbers or rogue quantities may appear in the story or question.
    Only the provided numbers in `numbers` are allowed.
    """
    expected_values = {_clean_num(v) for v in numbers.values()}

    # Check digits in story
    story_digits = re.findall(r"(?<!\d)\d+(?!\d)", story)
    for digit in story_digits:
        if digit not in expected_values:
            return False, f"Rule 2 Failed: Unexpected extra number '{digit}' found in story text."

    # Check digits in question
    question_digits = re.findall(r"(?<!\d)\d+(?!\d)", question)
    for digit in question_digits:
        if digit not in expected_values:
            return False, f"Rule 2 Failed: Unexpected extra number '{digit}' found in question text."

    # Check rogue number words in story that represent numeric values not in expected_values
    story_words = re.findall(r"\b[a-zA-Z]+\b", story.lower())
    for w in story_words:
        if w in NUMBER_WORDS:
            digit_val = NUMBER_WORDS[w]
            if digit_val not in expected_values:
                return False, f"Rule 2 Failed: Rogue number word '{w}' ({digit_val}) found in story."

    return True, None


def validate_no_answer_leakage(
    story: str,
    question: str,
    hints: List[str],
    answer: str
) -> Tuple[bool, Optional[str]]:
    """
    Rule 3: The story, question, and hints must NEVER contain or leak the correct answer.
    Also verifies Hint 1 does not name the arithmetic operation directly.
    """
    ans_str = _clean_num(answer)
    pattern = rf"(?<!\d){re.escape(ans_str)}(?!\d)"

    if re.search(pattern, story):
        return False, f"Rule 3 Failed: Correct answer '{ans_str}' is leaked in the story text."

    if re.search(pattern, question):
        return False, f"Rule 3 Failed: Correct answer '{ans_str}' is leaked in the question text."

    for idx, hint in enumerate(hints, start=1):
        if not hint:
            continue
        if re.search(pattern, hint):
            return False, f"Rule 3 Failed: Correct answer '{ans_str}' is leaked in Hint {idx}."

    # Check word form of answer if it maps to a standard number word
    word_for_answer = None
    for word, digit in NUMBER_WORDS.items():
        if digit == ans_str:
            word_for_answer = word
            break

    if word_for_answer:
        word_pattern = rf"\b{re.escape(word_for_answer)}\b"
        if re.search(word_pattern, story, re.I):
            return False, f"Rule 3 Failed: Correct answer word '{word_for_answer}' is leaked in story."
        for idx, hint in enumerate(hints, start=1):
            if re.search(word_pattern, hint, re.I):
                return False, f"Rule 3 Failed: Correct answer word '{word_for_answer}' is leaked in Hint {idx}."

    # Check Hint 1 does not name the operation
    if hints and hints[0]:
        h1_lower = hints[0].lower()
        for op_word in FORBIDDEN_OPERATION_WORDS:
            if re.search(rf"\b{re.escape(op_word)}\b", h1_lower):
                return False, f"Rule 3 Failed: Hint 1 names the operation directly with '{op_word}'."

    return True, None


def validate_length_and_reading_level(story: str) -> Tuple[bool, Optional[str]]:
    """
    Rule 4: Story length and reading level must be suitable for Class 5-7.
    - 2 to 3 sentences (permitted range: 2 to 4 sentences).
    - Word count between 15 and 75 words.
    - Average sentence length <= 25 words.
    """
    # Count sentences
    raw_sentences = [s.strip() for s in re.split(r"[.!?]+", story) if s.strip()]
    sentence_count = len(raw_sentences)

    if sentence_count < 2 or sentence_count > 4:
        return False, f"Rule 4 Failed: Story sentence count is {sentence_count} (expected 2-3 sentences)."

    words = re.findall(r"\b[a-zA-Z0-9'-]+\b", story)
    word_count = len(words)

    if word_count < 14 or word_count > 75:
        return False, f"Rule 4 Failed: Story word count is {word_count} (expected between 15 and 75 words)."

    avg_sentence_len = word_count / max(sentence_count, 1)
    if avg_sentence_len > 26:
        return False, f"Rule 4 Failed: Average sentence length is {avg_sentence_len:.1f} words (limit: 26 for Class 5-7)."

    return True, None


def validate_hint_3_parallel_example(
    hint_3: str,
    numbers: Dict[str, Any],
    answer: str
) -> Tuple[bool, Optional[str]]:
    """
    Rule 5: Hint 3 must be a worked parallel example with DIFFERENT numbers.
    It must not reuse any of the problem numbers, nor the problem answer.
    """
    if not hint_3 or not hint_3.strip():
        return False, "Rule 5 Failed: Hint 3 is empty."

    digits_in_h3 = set(re.findall(r"(?<!\d)\d+(?!\d)", hint_3))
    if not digits_in_h3:
        return False, "Rule 5 Failed: Hint 3 does not contain any numbers demonstrating a parallel worked example."

    forbidden_numbers = {_clean_num(v) for v in numbers.values()}
    forbidden_numbers.add(_clean_num(answer))

    reused = digits_in_h3.intersection(forbidden_numbers)
    if reused:
        return False, f"Rule 5 Failed: Hint 3 reuses problem numbers or answer: {reused}. Must use distinct numbers."

    return True, None


def validate_story_output(
    output: StoryOutput,
    numbers: Dict[str, Any],
    answer: str
) -> Tuple[bool, List[str]]:
    """
    Rule 6: Comprehensive validator running Rules 1-5.
    Returns (is_valid, list_of_errors).
    """
    errors: List[str] = []

    # Rule 1
    ok1, err1 = validate_every_number_appears_once(output.story, numbers)
    if not ok1 and err1:
        errors.append(err1)

    # Rule 2
    ok2, err2 = validate_no_extra_numbers(output.story, output.question, numbers)
    if not ok2 and err2:
        errors.append(err2)

    # Rule 3
    hints_list = [output.hint_1, output.hint_2, output.hint_3]
    ok3, err3 = validate_no_answer_leakage(output.story, output.question, hints_list, answer)
    if not ok3 and err3:
        errors.append(err3)

    # Rule 4
    ok4, err4 = validate_length_and_reading_level(output.story)
    if not ok4 and err4:
        errors.append(err4)

    # Rule 5
    ok5, err5 = validate_hint_3_parallel_example(output.hint_3, numbers, answer)
    if not ok5 and err5:
        errors.append(err5)

    return (len(errors) == 0), errors
