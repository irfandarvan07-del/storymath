import hashlib
import re
from datetime import datetime, timezone
import random
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.db import ClassModel, StudentModel, StudentUserModel, TeacherLogModel

router = APIRouter(prefix="/auth", tags=["auth"])

TEACHER_USERNAME = "TEACHER"
TEACHER_PASSWORD = "1234567891011"


def hash_password(pwd: str) -> str:
    return hashlib.sha256(f"storymath_salt_{pwd}".encode()).hexdigest()


def validate_password_strength(password: str):
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long."
        )
    if not re.search(r"[A-Z]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one uppercase letter."
        )
    if not re.search(r"[a-z]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one lowercase letter."
        )
    if not re.search(r"\d", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one number."
        )


class StudentRegisterRequest(BaseModel):
    school: str = Field(..., min_length=2)
    class_level: str = Field(..., description="e.g. 4, 5, 6, 7")
    section: str = Field(..., description="e.g. A, B, C, D")
    roll_number: str = Field(..., min_length=1)
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=8)


class StudentLoginRequest(BaseModel):
    username: str
    password: str


class TeacherLoginRequest(BaseModel):
    username: str
    password: str


@router.get("/check-username")
def check_username(username: str = Query(..., min_length=3), db: Session = Depends(get_db)):
    clean_user = username.strip().lower()
    existing = db.query(StudentUserModel).filter(StudentUserModel.username == clean_user).first()
    return {"available": existing is None, "username": clean_user}


@router.post("/student/register", status_code=status.HTTP_201_CREATED)
def register_student(req: StudentRegisterRequest, db: Session = Depends(get_db)):
    clean_user = req.username.strip().lower()

    # 1. Check if username taken
    existing = db.query(StudentUserModel).filter(StudentUserModel.username == clean_user).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username '{clean_user}' is already taken. Please choose another username."
        )

    # 2. Check password strength
    validate_password_strength(req.password)

    # 3. Derive class code (e.g. CLASS-4C)
    clean_class = req.class_level.strip().upper().replace("CLASS", "").replace("-", "").strip()
    clean_section = req.section.strip().upper()
    class_code = f"CLASS-{clean_class}{clean_section}"

    # 4. Generate or allocate anonymous student code
    student_code = f"S-{random.randint(1000, 9999)}"

    # 5. Ensure Class exists in classes table
    klass = db.query(ClassModel).filter(ClassModel.code == class_code).first()
    if not klass:
        klass = ClassModel(code=class_code, teacher_label=f"Class {clean_class}{clean_section} - {req.school}")
        db.add(klass)
        db.commit()
        db.refresh(klass)

    # 6. Ensure Student exists in students table
    student = db.query(StudentModel).filter(StudentModel.code == student_code).first()
    if not student:
        student = StudentModel(code=student_code, class_id=klass.id)
        db.add(student)
        db.commit()
        db.refresh(student)

    # 7. Create Student User record in Supabase
    new_user = StudentUserModel(
        username=clean_user,
        password_hash=hash_password(req.password),
        school=req.school.strip(),
        class_level=clean_class,
        section=clean_section,
        roll_number=req.roll_number.strip(),
        class_code=class_code,
        student_code=student_code,
        created_at=datetime.now(timezone.utc)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "success": True,
        "username": clean_user,
        "school": new_user.school,
        "class_code": class_code,
        "student_code": student_code,
        "message": f"Account created! Your assigned class code is {class_code}."
    }


@router.post("/student/login")
def login_student(req: StudentLoginRequest, db: Session = Depends(get_db)):
    clean_user = req.username.strip().lower()
    pwd_hash = hash_password(req.password)

    user = db.query(StudentUserModel).filter(
        StudentUserModel.username == clean_user,
        StudentUserModel.password_hash == pwd_hash
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password. Please verify your credentials or create a new account."
        )

    return {
        "success": True,
        "role": "student",
        "username": user.username,
        "school": user.school,
        "class_level": user.class_level,
        "section": user.section,
        "class_code": user.class_code,
        "student_code": user.student_code
    }


@router.post("/teacher/login")
def login_teacher(req: TeacherLoginRequest, db: Session = Depends(get_db)):
    clean_user = req.username.strip().upper()
    if clean_user != TEACHER_USERNAME or req.password != TEACHER_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Teacher credentials. Only authorized global teacher access is permitted."
        )

    # Log into teacher_logs table in Supabase
    try:
        log_entry = TeacherLogModel(
            action="LOGIN",
            teacher_username=TEACHER_USERNAME,
            ts=datetime.now(timezone.utc),
            details="Global Teacher logged in to diagnostic dashboard"
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        db.rollback()

    return {
        "success": True,
        "role": "teacher",
        "username": TEACHER_USERNAME,
        "message": "Welcome, Teacher! Global cohort heatmap unlocked."
    }


@router.post("/teacher/logout")
def logout_teacher(db: Session = Depends(get_db)):
    try:
        log_entry = TeacherLogModel(
            action="LOGOUT",
            teacher_username=TEACHER_USERNAME,
            ts=datetime.now(timezone.utc),
            details="Global Teacher logged out"
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        db.rollback()

    return {"success": True, "message": "Teacher logged out successfully."}
