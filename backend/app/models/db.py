from datetime import datetime
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from app.database import Base


class ClassModel(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    teacher_label = Column(String(100), nullable=True)

    students = relationship("StudentModel", back_populates="klass", cascade="all, delete-orphan")


class StudentModel(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)

    klass = relationship("ClassModel", back_populates="students")
    attempts = relationship("AttemptModel", back_populates="student", cascade="all, delete-orphan")


class StructureModel(Base):
    __tablename__ = "structures"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    model_type = Column(String(50), nullable=False)


class TemplateModel(Base):
    __tablename__ = "templates"

    id = Column(String(100), primary_key=True, index=True)
    structure_id = Column(String(100), nullable=False)
    text_pattern = Column(Text, nullable=False)
    ranges_json = Column(Text, nullable=False)
    answer_formula = Column(String(255), nullable=False)

    problems = relationship("ProblemModel", back_populates="template")


class ProblemModel(Base):
    __tablename__ = "problems"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    template_id = Column(String(100), ForeignKey("templates.id"), nullable=False)
    numbers_json = Column(Text, nullable=False)
    answer = Column(String(100), nullable=False)  # Stored server-side only
    story_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    template = relationship("TemplateModel", back_populates="problems")
    attempts = relationship("AttemptModel", back_populates="problem")


class AttemptModel(Base):
    __tablename__ = "attempts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    problem_id = Column(Integer, ForeignKey("problems.id"), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    finished_at = Column(DateTime, nullable=True)
    solved = Column(Boolean, default=False, nullable=False)

    student = relationship("StudentModel", back_populates="attempts")
    problem = relationship("ProblemModel", back_populates="attempts")
    step_events = relationship("StepEventModel", back_populates="attempt", cascade="all, delete-orphan")


class StepEventModel(Base):
    __tablename__ = "step_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    attempt_id = Column(Integer, ForeignKey("attempts.id"), nullable=False)
    step = Column(String(50), nullable=False)
    correct = Column(Boolean, nullable=False)
    hint_level = Column(Integer, default=0, nullable=False)
    response_json = Column(Text, nullable=False)
    ts = Column(DateTime, default=datetime.utcnow, nullable=False)

    attempt = relationship("AttemptModel", back_populates="step_events")


class StudentUserModel(Base):
    __tablename__ = "student_users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    school = Column(String(255), nullable=False)
    class_level = Column(String(50), nullable=False)
    section = Column(String(50), nullable=False)
    roll_number = Column(String(50), nullable=False)
    class_code = Column(String(50), nullable=False)
    student_code = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class TeacherLogModel(Base):
    __tablename__ = "teacher_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    action = Column(String(50), nullable=False)
    teacher_username = Column(String(100), nullable=False)
    ts = Column(DateTime, default=datetime.utcnow, nullable=False)
    details = Column(Text, nullable=True)


class TeacherAccountModel(Base):
    """Stores the hashed credentials for authorized teacher accounts in Supabase."""
    __tablename__ = "teacher_accounts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
