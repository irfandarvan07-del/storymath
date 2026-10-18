from fractions import Fraction
import pytest
from app.engine.evaluator import evaluate_formula, FormulaEvaluationError


def test_evaluator_basic_arithmetic():
    variables = {"a": 10, "b": 5, "c": 2}
    
    # Addition & subtraction
    assert evaluate_formula("a + b", variables) == Fraction(15)
    assert evaluate_formula("a - b", variables) == Fraction(5)
    
    # Multiplication & division
    assert evaluate_formula("a * b", variables) == Fraction(50)
    assert evaluate_formula("a / b", variables) == Fraction(2)
    assert evaluate_formula("a / c", variables) == Fraction(5)
    
    # Operator precedence & parentheses
    assert evaluate_formula("(a + b) * c", variables) == Fraction(30)
    assert evaluate_formula("a + b * c", variables) == Fraction(20)


def test_evaluator_fractions_and_decimals():
    variables = {"total": 84, "groups": 12, "rate": 2.5}
    assert evaluate_formula("total / groups", variables) == Fraction(7)
    assert evaluate_formula("rate * 4", variables) == Fraction(10)


def test_evaluator_division_by_zero():
    variables = {"a": 10, "b": 0}
    with pytest.raises(ZeroDivisionError):
        evaluate_formula("a / b", variables)


def test_evaluator_forbidden_operations():
    variables = {"x": 10}
    # Security: No raw eval, function calls, or dangerous attributes allowed
    with pytest.raises(FormulaEvaluationError):
        evaluate_formula("__import__('os').system('dir')", variables)
    with pytest.raises(FormulaEvaluationError):
        evaluate_formula("x ** 2", variables)
    with pytest.raises(FormulaEvaluationError):
        evaluate_formula("unknown_var + 5", variables)
