# StoryMath Backend

Deterministic maths engine and pedagogical backend for StoryMath (Classes 5-7).

## Stack
- Python 3.11+
- FastAPI (REST API + OpenAPI schema)
- Pydantic v2 (Schema validation)
- SQLAlchemy (ORM)
- SQLite (Local development) / Postgres (Production)
- Pytest (Automated test suite)

## Architecture Principles
1. **Code does the maths. AI does the language.**
   - All arithmetic, number ranges, answers, and constraints are evaluated deterministically in Python using safe AST walking and `fractions.Fraction`.
2. **Deterministic & safe by construction:**
   - Answer is strictly kept server-side until submitted.
   - Constraint checks guarantee the answer never equals any number visible in the story problem.
3. **5-Step Solve Loop:**
   - `facts` -> `model` -> `operation` -> `calculation` -> `sense_check`.
   - Skip logic: skips `facts` and `model` after two consecutive clean problem solves.
4. **Pedagogical Event Logging:**
   - Every single step failure is logged to `step_events` for teacher analytics and reteach heatmaps.

## Running Locally

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Start the development server:
```bash
uvicorn app.main:app --reload --port 8000
```

3. Open API docs:
- Interactive Swagger UI: `http://localhost:8000/docs`
- OpenAPI Specification: `http://localhost:8000/openapi.json`

## Running Tests

Run the full pytest suite (including 1000 seeded problem generations per template):
```bash
pytest
```
