"""
Auth route tests.
All credential checks go to the in-memory SQLite test DB (same logic as Supabase production).
Teacher account is seeded by conftest.py setup_db fixture.
"""
import uuid
import pytest


def test_teacher_login_success(client):
    res = client.post("/auth/teacher/login", json={
        "username": "TEACHER",
        "password": "1234567891011"
    })
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["role"] == "teacher"
    assert data["username"] == "TEACHER"


def test_teacher_login_failure(client):
    res = client.post("/auth/teacher/login", json={
        "username": "TEACHER",
        "password": "wrongpassword"
    })
    assert res.status_code == 401


def test_teacher_logout(client):
    res = client.post("/auth/teacher/logout", json={"username": "TEACHER"})
    assert res.status_code == 200
    assert res.json()["success"] is True


def test_student_password_too_short(client):
    res = client.post("/auth/student/register", json={
        "school": "Karnataka Model School",
        "class_level": "5",
        "section": "B",
        "roll_number": "14",
        "username": "short_user",
        "password": "P1"
    })
    assert res.status_code in (400, 422)


def test_student_password_no_uppercase(client):
    res = client.post("/auth/student/register", json={
        "school": "Karnataka Model School",
        "class_level": "5",
        "section": "B",
        "roll_number": "14",
        "username": "noupper_user",
        "password": "password123"
    })
    assert res.status_code == 400


def test_student_password_no_number(client):
    res = client.post("/auth/student/register", json={
        "school": "Karnataka Model School",
        "class_level": "5",
        "section": "B",
        "roll_number": "14",
        "username": "nonum_user",
        "password": "Passwordabc"
    })
    assert res.status_code == 400


def test_student_registration_and_login(client):
    username = f"stu_{uuid.uuid4().hex[:6]}"

    # Username should be available
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
    assert reg_res.status_code == 201, reg_res.text
    data = reg_res.json()
    assert data["class_code"] == "CLASS-4C"
    assert data["student_code"].startswith("S-")

    # Username no longer available
    taken = client.get(f"/auth/check-username?username={username}").json()
    assert taken["available"] is False

    # Login with correct credentials
    login_res = client.post("/auth/student/login", json={
        "username": username,
        "password": "SecretPass123"
    })
    assert login_res.status_code == 200, login_res.text
    login_data = login_res.json()
    assert login_data["username"] == username
    assert login_data["class_code"] == "CLASS-4C"

    # Login with wrong password should fail
    bad_res = client.post("/auth/student/login", json={
        "username": username,
        "password": "WrongPassword1"
    })
    assert bad_res.status_code == 401
