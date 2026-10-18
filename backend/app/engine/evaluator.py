import ast
import operator
from fractions import Fraction
from typing import Any, Dict, Union

# Safe binary operators mapping
SAFE_BINARY_OPS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
}

# Safe unary operators mapping
SAFE_UNARY_OPS = {
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}


class FormulaEvaluationError(Exception):
    """Raised when formula evaluation fails due to syntax or forbidden operations."""
    pass


def evaluate_formula(
    formula: str,
    variables: Dict[str, Union[int, float, Fraction, str]]
) -> Fraction:
    """
    Safely evaluate an arithmetic formula using an AST walker and exact fractions.
    
    Allowed:
    - Variable names passed in `variables`
    - Numbers (integers, decimals)
    - Binary operations: +, -, *, /
    - Unary operations: +, -
    - Parentheses
    
    Raw eval() is strictly forbidden.
    """
    try:
        tree = ast.parse(formula.strip(), mode="eval")
    except SyntaxError as e:
        raise FormulaEvaluationError(f"Invalid formula syntax in '{formula}': {e}")

    def _eval(node: ast.AST) -> Fraction:
        if isinstance(node, ast.Expression):
            return _eval(node.body)

        elif isinstance(node, ast.Constant):
            if isinstance(node.value, (int, float)):
                return Fraction(node.value)
            raise FormulaEvaluationError(f"Unsupported constant '{node.value}' of type {type(node.value)}")

        elif isinstance(node, ast.Name):
            var_name = node.id
            if var_name in variables:
                val = variables[var_name]
                if isinstance(val, Fraction):
                    return val
                elif isinstance(val, (int, float)):
                    return Fraction(val)
                elif isinstance(val, str):
                    try:
                        return Fraction(val)
                    except ValueError:
                        raise FormulaEvaluationError(f"Cannot parse variable '{var_name}' string value '{val}' as Fraction")
                raise FormulaEvaluationError(f"Unsupported variable type for '{var_name}': {type(val)}")
            raise FormulaEvaluationError(f"Undefined variable in formula: '{var_name}'")

        elif isinstance(node, ast.BinOp):
            left_val = _eval(node.left)
            right_val = _eval(node.right)
            op_type = type(node.op)

            if op_type in SAFE_BINARY_OPS:
                if op_type == ast.Div and right_val == 0:
                    raise ZeroDivisionError(f"Division by zero in formula '{formula}'")
                op_func = SAFE_BINARY_OPS[op_type]
                return op_func(left_val, right_val)

            raise FormulaEvaluationError(f"Forbidden binary operator: {op_type.__name__}")

        elif isinstance(node, ast.UnaryOp):
            operand_val = _eval(node.operand)
            op_type = type(node.op)

            if op_type in SAFE_UNARY_OPS:
                op_func = SAFE_UNARY_OPS[op_type]
                return op_func(operand_val)

            raise FormulaEvaluationError(f"Forbidden unary operator: {op_type.__name__}")

        else:
            raise FormulaEvaluationError(f"Forbidden AST element: {type(node).__name__}")

    return _eval(tree)
