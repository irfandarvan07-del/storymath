import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_teacher_login_success():
    res = client.post("/auth/teacher/login", json={
        "username": "TEACHER",
        "password": "1234567891011"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "teacher"
    assert data["username"] == "TEACHER"


def test_teacher_login_failure():
    res = client.post("/auth/teacher/login", json={
        "username": "TEACHER",
        "password": "wrongpassword"
    })
    assert res.status_code == 401


def test_teacher_logout():
    res = client.post("/auth/teacher/logout")
    assert res.status_code == 200
    assert res.json()["success"] is True


def test_student_password_validation():
    # Less than 8 chars
    res = client.post("/auth/student/register", json={
        "school": "Karnataka Model School",
        "class_level": "5",
        "section": "B",
        "roll_number": "14",
        "username": "short_user",
        "password": "P1"
    })
    assert res.status_code == 422 or res.status_code == 400

    # No uppercase
    res = client.post("/auth/student/register", json={
        "school": "Karnataka Model School",
        "class_level": "5",
        "section": "B",
        "roll_number": "14",
        "username": "noupper_user",
        "password": "password123"
    })
    assert res.status_code == 400

    # No number
    res = client.post("/auth/student/register", json={
        "school": "Karnataka Model School",
        "class_level": "5",
        "section": "B",
        "roll_number": "14",
        "username": "nonum_user",
        "password": "Passwordabc"
    })
    assert res.status_code == 400


def test_student_registration_and_login():
    import uuid
    uniq = str(uuid.uuid4())[:6]
    username = f"stu_{uniq}"

    # Check availability
    avail = client.get(f"/auth/check-username?username={username}").json()
    assert avail["available"] is True

    # Register
    reg_res = client.post("/auth/student/register", json={
        "school": "Govt High School, Dharwad",
        "class_level": "4",
        "section": "C",
        "roll_number": "22",
        "username": username,
        "password": "SecretPass123"
    })
    assert reg_res.status_code == 201
    data = reg_res.json()
    assert data["class_code"] == "CLASS-4C"
    assert data["student_code"].startswith("S-")

    # Login
    login_res = client.post("/auth/student/login", json={
        "username": username,
        "password": "SecretPass123"
    })
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert login_data["username"] == username
    assert login_data["class_code"] == "CLASS-4C"
