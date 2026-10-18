import random
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.db import ClassModel, StudentModel
from app.models.schemas import StudentJoinRequest, StudentJoinResponse

router = APIRouter(prefix="/students", tags=["Students"])


def generate_unique_student_code(db: Session) -> str:
    """Generate anonymous code like S-4821 and ensure uniqueness."""
    for _ in range(50):
        code = f"S-{random.randint(1000, 9999)}"
        exists = db.query(StudentModel).filter(StudentModel.code == code).first()
        if not exists:
            return code
    return f"S-{random.randint(10000, 99999)}"


@router.post("/join", response_model=StudentJoinResponse)
def join_class(payload: StudentJoinRequest, db: Session = Depends(get_db)):
    """
    Student joins via a class code and receives an anonymous student identifier (e.g. S-4821).
    No student personal names or emails are ever collected or stored.
    """
    class_code = payload.class_code.strip().upper()
    if not class_code:
        raise HTTPException(status_code=400, detail="Class code cannot be empty.")

    # Find or create class
    klass = db.query(ClassModel).filter(ClassModel.code == class_code).first()
    if not klass:
        klass = ClassModel(code=class_code, teacher_label=f"Class {class_code}")
        db.add(klass)
        db.commit()
        db.refresh(klass)

    # Generate anonymous student code
    student_code = generate_unique_student_code(db)
    student = StudentModel(class_id=klass.id, code=student_code)
    db.add(student)
    db.commit()
    db.refresh(student)

    return StudentJoinResponse(
        student_code=student.code,
        class_code=klass.code
    )
