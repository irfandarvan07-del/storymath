# Person B: Backend and maths engine

Read `docs/PROJECT.md` first. This file is your part.

## Your goal

A deterministic, tested maths engine plus a FastAPI backend that serves problems, logs every step, and returns hints. You are the foundation: A and C both build on your schemas.

## You own

```
backend/app/main.py
backend/app/engine/       template loader, number generator, answer checker
backend/app/models/       pydantic + SQLAlchemy models (the shared contract)
backend/app/routes/
backend/templates/        YAML templates
backend/fixtures/         sample_problem.json
backend/tests/engine/
backend/tests/routes/
```

(C owns `backend/app/ai/` and `backend/app/validation/`. You call them; you do not edit them.)

## Stack

Python 3.11+, FastAPI, pydantic, SQLAlchemy, SQLite (demo) / Postgres (pilot), `fractions.Fraction`, seeded `random`, `pytest`.

## Tasks

### Setup (hour 0-2, with everyone)
- [ ] Write the pydantic models: `Problem`, `StepSubmission`, `StepFeedback` (shapes are in `PROJECT.md` section 9)
- [ ] Commit `backend/fixtures/sample_problem.json`
- [ ] FastAPI app with `/problems/next` returning the fixture, so A can start immediately
- [ ] Confirm `/openapi.json` works so A can generate TS types

### Block 1: engine (5-6h)
- [ ] **Template loader:** read YAML from `backend/templates/`, validate with pydantic
- [ ] **Formula evaluator:** evaluate `total: "groups * per_group"` and `answer: "total / groups"` safely
  - Do **not** use raw `eval()`. Use a small AST walker that allows only numbers, names from the template, `+ - * /` and parentheses
  - Use `Fraction`, never floats
- [ ] **Number generator:** seeded `random`; pick the free variables first (e.g. `per_group`), compute the rest
- [ ] **Constraints:** answer must be a whole number (where the template says so), and **must not equal any number shown in the story** (C's leak check depends on this)
- [ ] **Answer checker:** compare the student's answer exactly (normalise `"12"`, `"12.0"`)
- [ ] Write the first 6 templates, one per structure (equal groups, equal sharing, difference comparison, unit rate, fraction of a quantity, perimeter/area)
- [ ] **pytest:** for every template, generate 1000 seeded problems and assert: answer correct, whole number, constraint rules hold, deterministic for the same seed

### Block 2: API and database (5-6h)
- [ ] Remaining templates (about 15 total, 2-3 per structure); get C to arrange teacher review
- [ ] Database models for the tables in `PROJECT.md` section 10
- [ ] `POST /students/join`: class code -> anonymous student code
- [ ] `POST /problems/next`:
  1. Choose a structure from the student's history (weakest first; simple rule is fine)
  2. Choose a template, generate numbers
  3. Call C's story service (use plain template text if it is not ready)
  4. Save the `problem`, create the `attempt`, return a `Problem` **without the answer**
  5. Set `steps_enabled`; skip `facts` and `model` after two correct problems in a row
- [ ] `POST /attempts/{id}/step`: check the step, write a row to `step_events` (step, correct, hint_level, response_json), return `StepFeedback`
- [ ] Hint ladder: wrong step -> next hint level (1, 2, 3); hint text comes from C's output
- [ ] `POST /attempts/{id}/finish`
- [ ] CORS for the frontend origin; read config from environment variables

### Integration (3h)
- [ ] Replace the fixture with the real flow end to end
- [ ] Fix contract bugs reported by A; update the schemas and tell everyone
- [ ] Expose a function C's `generate_story_pool.py` can call to get numbers for each template

## Rules specific to you

- The correct answer stays server-side until a step is submitted.
- No names, emails or free text from students in the DB.
- Any schema change -> regenerate `openapi.json`, tell A and D in chat.
- Never commit `.env`.

## You depend on

| From | What | When |
|---|---|---|
| C | `generate_story(template, numbers, interest) -> Story` returning validated JSON or fallback | Block 2 |
| D | CI config, deploy settings, `scripts/seed_events.py` using your tables | Block 1-2 |

## Others depend on you

| Who | Needs | When |
|---|---|---|
| A | Schemas, `openapi.json`, mock then real `/problems/next` | Hour 2 |
| C | Numbers + the engine's answer for validation tests | Block 1 |
| D | DB tables and the teacher endpoints' data | Block 1 |

## Git

Branches: `b/schemas`, `b/engine-templates`, `b/api-attempts`, `b/db`. Open the **schemas PR first** and merge it fast.

## Definition of done

- [ ] 15 templates, each tested over 1000 seeded problems
- [ ] All endpoints in `PROJECT.md` section 9 return the documented shapes
- [ ] Every step result is logged in `step_events`
- [ ] The answer is never in any API response before submission
- [ ] `pytest` is green in CI
