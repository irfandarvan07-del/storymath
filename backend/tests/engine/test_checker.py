from fractions import Fraction
from app.engine.checker import normalize_answer, check_step


def test_normalize_answer():
    assert normalize_answer(12) == Fraction(12)
    assert normalize_answer("12") == Fraction(12)
    assert normalize_answer("12.0") == Fraction(12)
    assert normalize_answer("  12   ") == Fraction(12)
    assert normalize_answer("12/1") == Fraction(12)
    assert normalize_answer("3/4") == Fraction(3, 4)
    assert normalize_answer(7.5) == Fraction(15, 2)
    assert normalize_answer("invalid") is None
    assert normalize_answer(None) is None


def test_check_step_operation():
    problem = {"operation": "division"}
    
    # Correct operation
    ok, _ = check_step("operation", {"operation": "division"}, problem)
    assert ok is True
    
    # Case insensitive
    ok, _ = check_step("operation", {"operation": "Division"}, problem)
    assert ok is True
    
    # Incorrect operation
    ok, reason = check_step("operation", {"operation": "multiplication"}, problem)
    assert ok is False
    assert len(reason) > 0


def test_check_step_model():
    problem = {"model_type": "bar_model"}
    
    ok, _ = check_step("model", {"model_type": "bar_model"}, problem)
    assert ok is True
    
    ok, reason = check_step("model", {"model_type": "number_line"}, problem)
    assert ok is False


def test_check_step_calculation():
    problem = {"answer": "7"}
    
    # Exact int
    ok, _ = check_step("calculation", {"answer": 7}, problem)
    assert ok is True
    
    # String
    ok, _ = check_step("calculation", {"answer": "7"}, problem)
    assert ok is True
    
    # Float equivalent
    ok, _ = check_step("calculation", {"answer": "7.0"}, problem)
    assert ok is True
    
    # Expression format "84 / 12 = 7"
    ok, _ = check_step("calculation", {"calculation": "84 / 12 = 7"}, problem)
    assert ok is True
    
    # Wrong calculation
    ok, _ = check_step("calculation", {"answer": "8"}, problem)
    assert ok is False


def test_check_step_sense_check():
    problem = {"sense_check_answer": "smaller"}
    
    ok, _ = check_step("sense_check", {"choice": "smaller"}, problem)
    assert ok is True
    
    ok, _ = check_step("sense_check", {"choice": "bigger"}, problem)
    assert ok is False
