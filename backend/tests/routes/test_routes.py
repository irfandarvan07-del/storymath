import json
from app.models.db import AttemptModel, ProblemModel


def test_root_and_health(client):
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["app"] == "StoryMath API"
    assert data["templates_count"] >= 15

    health_res = client.get("/health")
    assert health_res.status_code == 200
    assert health_res.json()["status"] == "ok"


def test_students_join(client):
    res = client.post("/students/join", json={"class_code": "CLASS-6B"})
    assert res.status_code == 200
    data = res.json()
    assert data["class_code"] == "CLASS-6B"
    assert data["student_code"].startswith("S-")


def test_sample_problem_fixture(client):
    res = client.get("/problems/next/sample")
    assert res.status_code == 200
    data = res.json()
    assert data["attempt_id"] == 101
    assert data["structure"] == "equal_sharing"
    assert "answer" not in data  # Contract rule: answer never returned!
    assert data["numbers"] == {"total": 84, "groups": 12}
    assert len(data["steps_enabled"]) == 5


def test_next_problem_and_attempt_flow(client, db):
    # 1. Join student
    join_res = client.post("/students/join", json={"class_code": "CLASS-7A"})
    student_code = join_res.json()["student_code"]

    # 2. Request next problem
    prob_res = client.post("/problems/next", json={"student_code": student_code})
    assert prob_res.status_code == 200
    prob_data = prob_res.json()
    
    assert "attempt_id" in prob_data
    attempt_id = prob_data["attempt_id"]
    assert "answer" not in prob_data  # Contract: answer never returned
    assert prob_data["steps_enabled"] == ["facts", "model", "operation", "calculation", "sense_check"]

    # Retrieve correct answer directly from DB (simulating server-side secret)
    attempt = db.query(AttemptModel).filter(AttemptModel.id == attempt_id).first()
    problem = db.query(ProblemModel).filter(ProblemModel.id == attempt.problem_id).first()
    correct_ans = problem.answer

    # 3. Submit Step 1: facts
    step1_res = client.post(f"/attempts/{attempt_id}/step", json={
        "step": "facts",
        "response": {"given": [84, 12], "asked": "How many each"}
    })
    assert step1_res.status_code == 200
    s1 = step1_res.json()
    assert s1["correct"] is True
    assert s1["next_step"] == "model"

    # 4. Submit Step 2: wrong model -> hint level 1
    step2_wrong = client.post(f"/attempts/{attempt_id}/step", json={
        "step": "model",
        "response": {"model_type": "invalid_model_type"}
    })
    assert step2_wrong.status_code == 200
    s2_wrong = step2_wrong.json()
    assert s2_wrong["correct"] is False
    assert s2_wrong["hint_level"] == 1
    assert s2_wrong["hint_text"] is not None
    assert s2_wrong["next_step"] == "model"

    # 5. Submit Step 2: wrong model again -> hint level 2
    step2_wrong2 = client.post(f"/attempts/{attempt_id}/step", json={
        "step": "model",
        "response": {"model_type": "another_wrong_model"}
    })
    assert step2_wrong2.status_code == 200
    assert step2_wrong2.json()["hint_level"] == 2

    # 6. Submit Step 2: correct model
    step2_res = client.post(f"/attempts/{attempt_id}/step", json={
        "step": "model",
        "response": {"model_type": prob_data["model_type"]}
    })
    assert step2_res.status_code == 200
    s2 = step2_res.json()
    assert s2["correct"] is True
    assert s2["next_step"] == "operation"

    # 7. Submit Step 4: calculation with the true answer
    step4_res = client.post(f"/attempts/{attempt_id}/step", json={
        "step": "calculation",
        "response": {"answer": int(correct_ans)}
    })
    assert step4_res.status_code == 200
    s4 = step4_res.json()
    assert s4["correct"] is True


def test_scaffolding_skip_logic(client, db):
    """
    Skip facts and model after two consecutive clean problem solves.
    """
    # 1. Join student
    join_res = client.post("/students/join", json={"class_code": "CLASS-ADV"})
    student_code = join_res.json()["student_code"]

    # Helper to simulate clean solve of a problem
    def solve_clean():
        p_res = client.post("/problems/next", json={"student_code": student_code})
        p = p_res.json()
        att_id = p["attempt_id"]

        attempt = db.query(AttemptModel).filter(AttemptModel.id == att_id).first()
        prob = db.query(ProblemModel).filter(ProblemModel.id == attempt.problem_id).first()

        for step in p["steps_enabled"]:
            if step == "facts":
                resp = {"given": [1], "asked": "test"}
            elif step == "model":
                resp = {"model_type": p["model_type"]}
            elif step == "operation":
                # Get operation from DB problem template
                from app.engine.loader import registry
                tmpl = registry.get(prob.template_id)
                resp = {"operation": tmpl.operation}
            elif step == "calculation":
                resp = {"answer": int(prob.answer)}
            elif step == "sense_check":
                from app.engine.loader import registry
                tmpl = registry.get(prob.template_id)
                resp = {"choice": tmpl.sense_check_answer}
            
            fb = client.post(f"/attempts/{att_id}/step", json={"step": step, "response": resp}).json()
            assert fb["correct"] is True
        return p

    # Clean solve 1
    p1 = solve_clean()
    assert len(p1["steps_enabled"]) == 5

    # Clean solve 2
    p2 = solve_clean()
    assert len(p2["steps_enabled"]) == 5

    # Problem 3 should now skip scaffolding (facts & model)!
    p3_res = client.post("/problems/next", json={"student_code": student_code})
    p3 = p3_res.json()
    assert p3["steps_enabled"] == ["operation", "calculation", "sense_check"]


def test_teacher_heatmap_and_groups(client):
    class_code = "CLASS-HEATMAP"
    join_res = client.post("/students/join", json={"class_code": class_code})
    student_code = join_res.json()["student_code"]

    # Generate a problem and log a wrong operation
    p_res = client.post("/problems/next", json={"student_code": student_code})
    att_id = p_res.json()["attempt_id"]

    # Submit deliberate wrong operation
    client.post(f"/attempts/{att_id}/step", json={
        "step": "operation",
        "response": {"operation": "wrong_op"}
    })

    # Check heatmap map endpoint
    map_res = client.get(f"/teacher/class/{class_code}/map")
    assert map_res.status_code == 200
    map_data = map_res.json()
    assert map_data["class_code"] == class_code
    assert len(map_data["structures"]) == 6
    assert len(map_data["steps"]) == 5

    # Check stuck groups endpoint
    groups_res = client.get(f"/teacher/class/{class_code}/groups")
    assert groups_res.status_code == 200
    groups_data = groups_res.json()
    assert groups_data["class_code"] == class_code
    assert len(groups_data["groups"]) >= 1
    assert student_code in groups_data["groups"][0]["students"]
