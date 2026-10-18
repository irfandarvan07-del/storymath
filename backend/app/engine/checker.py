from fractions import Fraction
import re
from typing import Any, Dict, Optional, Tuple


def normalize_answer(val: Any) -> Optional[Fraction]:
    """
    Normalizes numeric answers from int, float, string ('12', '12.0', '12/1', ' 3 / 4 ') to a Fraction.
    """
    if val is None:
        return None

    if isinstance(val, (int, Fraction)):
        return Fraction(val)

    if isinstance(val, float):
        # Convert via string to avoid float precision issues like 12.000000000000002
        return Fraction(str(val))

    s = str(val).strip()
    if not s:
        return None

    # Check for fraction notation 'a/b'
    if "/" in s:
        parts = s.split("/")
        if len(parts) == 2:
            try:
                num = int(parts[0].strip())
                den = int(parts[1].strip())
                if den != 0:
                    return Fraction(num, den)
            except ValueError:
                pass

    # Extract leading numbers if any extra spaces or units
    match = re.search(r"^-?\d+(?:\.\d+)?", s)
    if match:
        try:
            return Fraction(match.group(0))
        except ValueError:
            pass

    try:
        return Fraction(s)
    except ValueError:
        return None


def check_step(
    step: str,
    response: Dict[str, Any],
    problem_details: Dict[str, Any]
) -> Tuple[bool, str]:
    """
    Verify the student's response for a given step.
    
    Returns:
        (is_correct, failure_reason)
    """
    step = step.lower().strip()

    if step == "facts":
        # Response can contain 'given' (list of numbers/labels) and 'asked' (string)
        # As long as the student identifies numbers and the target question, we validate
        if "given" in response or "asked" in response:
            return True, ""
        return False, "Please identify what is given and what is asked in the story."

    elif step == "model":
        selected_model = response.get("model_type") or response.get("model")
        expected_model = problem_details.get("model_type")
        if not selected_model:
            return False, "No visual model was selected."
        if str(selected_model).strip().lower() == str(expected_model).strip().lower():
            return True, ""
        return False, f"Model '{selected_model}' does not represent this problem structure."

    elif step == "operation":
        selected_op = response.get("operation") or response.get("op")
        expected_op = problem_details.get("operation")
        if not selected_op:
            return False, "No mathematical operation was selected."
        if str(selected_op).strip().lower() == str(expected_op).strip().lower():
            return True, ""
        return False, "Incorrect operation chosen for this problem structure."

    elif step == "calculation":
        # Extract student answer
        student_ans_raw = response.get("answer")
        if student_ans_raw is None and "calculation" in response:
            # Check if calculation is like "84 / 12 = 7"
            calc_str = str(response["calculation"])
            if "=" in calc_str:
                student_ans_raw = calc_str.split("=")[-1].strip()

        if student_ans_raw is None:
            return False, "No numerical answer was provided."

        correct_ans_raw = problem_details.get("answer")
        student_frac = normalize_answer(student_ans_raw)
        correct_frac = normalize_answer(correct_ans_raw)

        if student_frac is not None and correct_frac is not None:
            if student_frac == correct_frac:
                return True, ""
            return False, "The calculated numerical answer is incorrect."

        # Fallback to string comparison if fraction conversion fails
        if str(student_ans_raw).strip() == str(correct_ans_raw).strip():
            return True, ""
        return False, "The calculated answer is incorrect."

    elif step == "sense_check":
        student_choice = response.get("choice") or response.get("answer")
        expected_choice = problem_details.get("sense_check_answer")
        if not student_choice:
            return False, "Please choose whether the answer should be bigger or smaller."
        if str(student_choice).strip().lower() == str(expected_choice).strip().lower():
            return True, ""
        return False, f"Sense check incorrect: the answer should be {expected_choice}."

    return False, f"Unknown step '{step}'"
