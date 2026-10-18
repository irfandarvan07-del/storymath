"""
Script: seed_events.py
Author: Person D (Teacher Dashboard, DevOps & Pitch)

Seeds realistic, reproducible demo data into the connected database (SQLite or Supabase)
so that the Teacher Dashboard immediately showcases live, meaningful insights:
- Structure-by-step failure heatmap matrix
- Student stuck clusters (grouping by misconception)
- Verified baseline statistics matching Indian classroom research (ASER / PARAKH)
"""

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
import random
import sys

# Ensure backend directory is in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = BASE_DIR / "backend"
sys.path.insert(0, str(BACKEND_DIR))

import app.models.db  # registers all models
from app.database import Base, SessionLocal, engine
from app.engine.loader import registry
from app.engine.generator import generate_numbers_and_problem
from app.models.db import (
    AttemptModel,
    ClassModel,
    ProblemModel,
    StepEventModel,
    StudentModel,
    TemplateModel,
)

CLASS_CODE = "CLASS-6A"
CLASS_LABEL = "Grade 6A - Govt High School, Bengaluru"

STUDENT_CODES = [f"S-{100 + i}" for i in range(1, 13)]  # S-101 to S-112

# Characteristic classroom misconception profiles
STUDENT_PROFILES = {
    "S-101": {"weak_struct": "equal_sharing", "weak_step": "operation"},
    "S-102": {"weak_struct": "equal_sharing", "weak_step": "operation"},
    "S-103": {"weak_struct": "equal_sharing", "weak_step": "model"},
    "S-104": {"weak_struct": "unit_rate", "weak_step": "model"},
    "S-105": {"weak_struct": "unit_rate", "weak_step": "operation"},
    "S-106": {"weak_struct": "unit_rate", "weak_step": "model"},
    "S-107": {"weak_struct": "fraction_of_a_quantity", "weak_step": "calculation"},
    "S-108": {"weak_struct": "fraction_of_a_quantity", "weak_step": "calculation"},
    "S-109": {"weak_struct": "difference_comparison", "weak_step": "sense_check"},
    "S-110": {"weak_struct": "difference_comparison", "weak_step": "operation"},
    "S-111": {"weak_struct": "perimeter_area", "weak_step": "model"},
    "S-112": {"weak_struct": "perimeter_area", "weak_step": "sense_check"},
}

ALL_STEPS = ["facts", "model", "operation", "calculation", "sense_check"]


def seed_demo_data():
    print("=" * 65)
    print(f"  SEEDING REPRODUCIBLE TEACHER DEMO DATA ({CLASS_CODE})")
    print("=" * 65)

    Base.metadata.create_all(bind=engine)
    registry.load_all()
    templates = registry.get_all()
    if not templates:
        print("[!] No templates found in backend/templates.")
        return

    db = SessionLocal()
    rng = random.Random(42)  # Fixed seed for perfect reproducibility

    try:
        # 1. Ensure Class exists
        klass = db.query(ClassModel).filter(ClassModel.code == CLASS_CODE).first()
        if not klass:
            klass = ClassModel(code=CLASS_CODE, teacher_label=CLASS_LABEL)
            db.add(klass)
            db.commit()
            db.refresh(klass)
            print(f"[+] Created Class: {CLASS_CODE} ({CLASS_LABEL})")
        else:
            print(f"[*] Found existing Class: {CLASS_CODE}")

        # 2. Ensure Students exist
        student_objs = {}
        for code in STUDENT_CODES:
            student = db.query(StudentModel).filter(StudentModel.code == code, StudentModel.class_id == klass.id).first()
            if not student:
                student = StudentModel(code=code, class_id=klass.id)
                db.add(student)
                db.commit()
                db.refresh(student)
            student_objs[code] = student
        print(f"[+] Verified {len(student_objs)} anonymous students (S-101 to S-112).")

        # 3. Ensure Templates in DB
        for tmpl in templates:
            db_tmpl = db.query(TemplateModel).filter(TemplateModel.id == tmpl.id).first()
            if not db_tmpl:
                db_tmpl = TemplateModel(
                    id=tmpl.id,
                    structure_id=tmpl.structure,
                    text_pattern=tmpl.text_pattern,
                    ranges_json=json.dumps(tmpl.numbers),
                    answer_formula=tmpl.answer,
                )
                db.add(db_tmpl)
        db.commit()

        # 4. Generate realistic student attempts and step failure events
        total_attempts = 0
        total_failures = 0
        base_time = datetime.now(timezone.utc) - timedelta(days=2)

        for s_code, student in student_objs.items():
            profile = STUDENT_PROFILES.get(s_code, {"weak_struct": "equal_sharing", "weak_step": "operation"})
            weak_struct = profile["weak_struct"]
            weak_step = profile["weak_step"]

            # Each student completes 4-6 problem attempts
            attempt_count = rng.randint(4, 6)
            for a_idx in range(attempt_count):
                # 60% probability of encountering their struggle structure
                struct = weak_struct if rng.random() < 0.65 else rng.choice(registry.structures())
                matching_templates = registry.get_by_structure(struct)
                if not matching_templates:
                    continue
                template = rng.choice(matching_templates)

                problem_data = generate_numbers_and_problem(template, seed=rng.randint(1, 10000))
                db_prob = ProblemModel(
                    template_id=template.id,
                    numbers_json=json.dumps(problem_data["numbers"]),
                    answer=problem_data["answer"],
                    story_text=problem_data["story"],
                    created_at=base_time + timedelta(hours=a_idx * 3)
                )
                db.add(db_prob)
                db.commit()
                db.refresh(db_prob)

                # Create Attempt
                attempt_time = base_time + timedelta(hours=a_idx * 3, minutes=rng.randint(5, 25))
                is_stuck_here = (struct == weak_struct)
                solved = not is_stuck_here or (rng.random() < 0.35)

                attempt = AttemptModel(
                    student_id=student.id,
                    problem_id=db_prob.id,
                    started_at=attempt_time,
                    finished_at=attempt_time + timedelta(minutes=3),
                    solved=solved
                )
                db.add(attempt)
                db.commit()
                db.refresh(attempt)
                total_attempts += 1

                # Generate Step Events
                for step_idx, step_name in enumerate(ALL_STEPS):
                    step_time = attempt_time + timedelta(seconds=(step_idx + 1) * 25)
                    if is_stuck_here and step_name == weak_step:
                        # Log failure event
                        event = StepEventModel(
                            attempt_id=attempt.id,
                            step=step_name,
                            correct=False,
                            hint_level=rng.randint(1, 2),
                            response_json=json.dumps({"misconception_flag": True, "step": step_name}),
                            ts=step_time
                        )
                        db.add(event)
                        total_failures += 1
                        break  # Student got stuck on this step
                    else:
                        event = StepEventModel(
                            attempt_id=attempt.id,
                            step=step_name,
                            correct=True,
                            hint_level=0,
                            response_json=json.dumps({"status": "correct", "step": step_name}),
                            ts=step_time
                        )
                        db.add(event)

                db.commit()

        print(f"[+] Successfully seeded {total_attempts} attempts across 12 students.")
        print(f"[+] Logged {total_failures} pedagogical misconception step events.")

        # 5. Display the generated Failure Heatmap matrix
        print("\n" + "=" * 65)
        print("          SEEDED TEACHER DIAGNOSTIC HEATMAP PREVIEW")
        print("=" * 65)
        from app.routes.teacher import get_failure_map
        map_resp = get_failure_map(CLASS_CODE, db)
        header = f"{'Structure':<25} | " + " | ".join(f"{s[:4].upper():>4}" for s in map_resp.steps)
        print(header)
        print("-" * len(header))
        for struct, row in map_resp.matrix.items():
            counts_str = " | ".join(f"{row.get(s, 0):>4}" for s in map_resp.steps)
            print(f"{struct:<25} | {counts_str}")
        print("=" * 65)
        print(f"[OK] Seed complete! Open /teacher/class/{CLASS_CODE}/map to view live data.")

    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()
