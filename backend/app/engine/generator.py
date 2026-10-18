from fractions import Fraction
import random
import re
from typing import Any, Dict, Optional, Set

from app.engine.evaluator import evaluate_formula
from app.engine.loader import TemplateSchema, registry


class GenerationConstraintError(Exception):
    """Raised when number generation constraints cannot be satisfied."""
    pass


def get_shown_variable_names(template: TemplateSchema) -> Set[str]:
    """Extract variable names shown in the story text and question pattern."""
    full_text = template.text_pattern + " " + (template.question_pattern or "") + " " + template.sense_check_prompt
    placeholders = set(re.findall(r"\{([a-zA-Z0-9_]+)\}", full_text))
    # Exclude non-numeric context placeholders and answer placeholder
    placeholders.discard("item")
    placeholders.discard("people")
    placeholders.discard("answer")
    return placeholders


def generate_numbers_and_problem(
    template: TemplateSchema,
    seed: Optional[int] = None
) -> Dict[str, Any]:
    """
    Generate deterministic numbers and render a problem from a template.
    
    Guarantees:
    1. Answer is an integer (whole number).
    2. Answer NEVER equals any number shown in the story.
    3. Only numbers shown in the story are exposed in the 'numbers' payload (answer is never exposed).
    4. Deterministic for the same seed.
    """
    rng = random.Random(seed) if seed is not None else random.Random()
    shown_var_names = get_shown_variable_names(template)
    max_attempts = 300

    for _ in range(max_attempts):
        var_values: Dict[str, Any] = {}
        formulas: Dict[str, str] = {}

        # 1. Generate free variables first
        for var_name, spec in template.numbers.items():
            if isinstance(spec, dict):
                if "choices" in spec:
                    var_values[var_name] = rng.choice(spec["choices"])
                else:
                    min_val = spec.get("min", 1)
                    max_val = spec.get("max", 100)
                    step = spec.get("step", 1)
                    var_values[var_name] = rng.randrange(min_val, max_val + 1, step)
            elif isinstance(spec, (int, float)):
                var_values[var_name] = spec
            elif isinstance(spec, str):
                formulas[var_name] = spec

        # 2. Evaluate dependent variables in dependency order
        resolved_count = 0
        while len(formulas) > 0 and resolved_count < 20:
            resolved_count += 1
            progress = False
            for f_name, formula_str in list(formulas.items()):
                try:
                    result = evaluate_formula(formula_str, var_values)
                    var_values[f_name] = int(result) if result.denominator == 1 else float(result)
                    del formulas[f_name]
                    progress = True
                except Exception:
                    continue
            if not progress and len(formulas) > 0:
                break

        if len(formulas) > 0:
            continue

        # 3. Compute the answer
        try:
            answer_fraction = evaluate_formula(template.answer, var_values)
        except Exception:
            continue

        # Constraint 1: Whole number answer
        if answer_fraction.denominator != 1:
            continue
        
        answer_int = int(answer_fraction)
        if answer_int <= 0:
            continue

        # Constraint 2: Answer MUST NOT equal any number shown in the story
        shown_numbers = {
            k: int(v) if isinstance(v, (int, float)) and float(v).is_integer() else v
            for k, v in var_values.items()
            if k in shown_var_names
        }

        conflict = False
        for k, v in shown_numbers.items():
            if isinstance(v, (int, float)) and int(v) == answer_int:
                conflict = True
                break
        if conflict:
            continue

        # Pick item and person if defined
        chosen_item = rng.choice(template.items) if template.items else "items"
        chosen_person = rng.choice(template.people) if template.people else "friends"

        render_ctx = {
            **var_values,
            "item": chosen_item,
            "people": chosen_person,
            "answer": answer_int
        }

        # Render story text
        story_text = template.text_pattern.format(**render_ctx)

        # Render question
        if template.question_pattern:
            question_text = template.question_pattern.format(**render_ctx)
        else:
            question_text = "Find the answer."

        # Sense check prompt
        sense_check_prompt = template.sense_check_prompt.format(**render_ctx)

        # Render hints with current parameters
        rendered_hints = {}
        for h_level, h_text in template.hints.items():
            rendered_hints[h_level] = h_text.format(**render_ctx)

        return {
            "template_id": template.id,
            "structure": template.structure,
            "model_type": template.model,
            "operation": template.operation,
            "story": story_text,
            "question": question_text,
            "numbers": shown_numbers,  # ONLY numbers shown in the story
            "answer": str(answer_int),  # Kept server-side only
            "sense_check_prompt": sense_check_prompt,
            "sense_check_answer": template.sense_check_answer,
            "hints": rendered_hints,
        }

    raise GenerationConstraintError(
        f"Could not satisfy constraints for template {template.id} after {max_attempts} attempts."
    )


def get_template_numbers(template_id: str, seed: Optional[int] = None) -> Dict[str, Any]:
    """
    Helper function exposed for Person C's generate_story_pool.py.
    Returns template numbers and answer for story generation.
    """
    tmpl = registry.get(template_id)
    if not tmpl:
        raise ValueError(f"Template with id '{template_id}' not found.")
    return generate_numbers_and_problem(tmpl, seed=seed)
