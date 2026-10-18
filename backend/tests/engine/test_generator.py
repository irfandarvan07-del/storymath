import pytest
from app.engine.loader import registry
from app.engine.generator import generate_numbers_and_problem


@pytest.fixture(scope="module", autouse=True)
def load_templates():
    registry.load_all()


def test_registry_has_all_structures_and_templates():
    templates = registry.get_all()
    assert len(templates) >= 15, f"Expected at least 15 templates, found {len(templates)}"
    
    structures = registry.structures()
    expected_structures = {
        "equal_sharing",
        "equal_groups",
        "difference_comparison",
        "unit_rate",
        "fraction_of_a_quantity",
        "perimeter_area"
    }
    assert expected_structures.issubset(set(structures)), f"Missing structures: {expected_structures - set(structures)}"


def test_determinism_for_same_seed():
    """Verify that identical seeds produce identical problems and numbers."""
    templates = registry.get_all()
    for tmpl in templates:
        p1 = generate_numbers_and_problem(tmpl, seed=42)
        p2 = generate_numbers_and_problem(tmpl, seed=42)
        assert p1["numbers"] == p2["numbers"]
        assert p1["answer"] == p2["answer"]
        assert p1["story"] == p2["story"]


@pytest.mark.parametrize("template_id", [t.id for t in registry.load_all().values()])
def test_1000_seeded_problems_per_template(template_id):
    """
    Core mandate from B_backend_maths_engine.md:
    For every template, generate 1000 seeded problems and assert:
    1. Answer is a valid integer (whole number).
    2. Constraints hold: answer NEVER equals any number shown in the story (given numbers).
    3. Deterministic execution.
    """
    tmpl = registry.get(template_id)
    assert tmpl is not None

    for seed in range(1000):
        problem = generate_numbers_and_problem(tmpl, seed=seed)
        
        answer_str = problem["answer"]
        assert answer_str.isdigit(), f"Answer '{answer_str}' is not a whole number in {template_id}"
        answer_int = int(answer_str)
        assert answer_int > 0, f"Answer must be positive in {template_id}"

        # Constraint rule: answer must never equal any number shown in the story / numbers dict
        for var_name, var_val in problem["numbers"].items():
            if isinstance(var_val, (int, float)):
                assert int(var_val) != answer_int, (
                    f"Answer leak constraint violation in {template_id} (seed {seed}): "
                    f"answer={answer_int} equals given number {var_name}={var_val}"
                )
