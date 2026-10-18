import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app

# In-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


import hashlib

def _hash(pwd: str) -> str:
    return hashlib.sha256(f"storymath_salt_{pwd}".encode()).hexdigest()


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=test_engine)

    # Seed the single teacher account so teacher login tests work against DB
    from app.models.db import TeacherAccountModel
    seed_session = TestingSessionLocal()
    try:
        if not seed_session.query(TeacherAccountModel).filter_by(username="TEACHER").first():
            seed_session.add(TeacherAccountModel(
                username="TEACHER",
                password_hash=_hash("1234567891011"),
            ))
            seed_session.commit()
    finally:
        seed_session.close()

    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db():
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
