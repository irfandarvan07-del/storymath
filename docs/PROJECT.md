# StoryMath: same maths, different story

> Everyone reads this file first. Then read your own file in `docs/team/`.

## 1. One-line summary

A web app for Class 5-7 students who can calculate but cannot tell **which** calculation a word problem needs. The app keeps the maths structure fixed, changes the story, and logs exactly **which step** the student got stuck on.

## 2. The problem (verified numbers)

| Number | What it means | Source |
|---|---|---|
| 30.7% | Class 5 students who can solve a division problem (rural India) | ASER 2024 |
| 19% | Same measure, Karnataka government schools, Class 5 | ASER 2024 |
| 46% | National average maths score, Class 6 | PARAKH Rashtriya Sarvekshan 2024 (NCERT) |
| 53% | Class 6 students who know tables to 10 and can apply the four operations to daily-life problems | PARAKH 2024 |

Notes for the pitch:
- ASER covers **rural** India and tests at floor level.
- There is **no national Class 7 figure**. Say "Classes 5-8" and do not invent one.
- Do not use any stat that is not in this table without checking the original report first.

A wrong answer does not tell the teacher whether the student misread the story, chose the wrong operation, or slipped in the arithmetic. A new story also looks like a new problem to the student.

## 3. The idea

Every word problem has a hidden **structure**. We keep the structure fixed and change the story, so the student learns to recognise the structure instead of memorising one example.

Six structures:
1. Equal groups
2. Equal sharing
3. Difference comparison
4. Unit rate
5. Fraction of a quantity
6. Perimeter / area

## 4. Core loop (about 3 minutes per problem)

1. **Read** a short story problem.
2. **Pick facts:** tap what is *given* and what is *asked*.
3. **Choose a model:** bar model, groups picture or number line.
4. **Calculate:** enter the operation and the answer.
5. **Sense-check:** "Should the answer be bigger or smaller than 84?"
6. **Transfer:** a new story with the same structure.

Strong students may skip steps 2-3 after two correct problems in a row (decided by the backend, see `steps_enabled` in the contract).

## 5. Key design decision (never break this)

**Code does the maths. The AI does the language.**

- Hand-written YAML templates define each structure and its number ranges.
- Python code picks the numbers and computes the correct answer.
- The AI only writes the story and the hints around those numbers.
- Code validates every AI output before a student sees it.
- If validation fails twice, we use the plain template text.
- The **correct answer never leaves the server** until the student has submitted.

## 6. Scope

| Item | In scope |
|---|---|
| Structures | 6 |
| Templates | 2-3 per structure, about 15 total |
| Language | English first (i18n ready for Hindi/Kannada) |
| Users | Student view and teacher view; no accounts; class code + anonymous student code (e.g. `S-4821`) |
| Out of scope | Leaderboards, voice input, photo scanning, parent dashboard, names/emails of students |

## 7. Architecture

```
 Student / Teacher (React PWA)
          |  HTTPS (JSON)
          v
   FastAPI backend
   |-- Maths engine ---- templates (YAML) ---> numbers + correct answer
   |-- Story service --- Claude API ---------> story + hints (JSON)
   |-- Validator ------- pydantic + checks --> accept or retry
   |-- Event logger ---- every step result --> DB
   '-- Analytics ------- aggregates ---------> teacher dashboard
          |
          v
   SQLite (demo) / Postgres (pilot)
```

Request flow for one problem:
1. `POST /problems/next` with the student code.
2. Backend picks a structure from the student's history, then a template.
3. Engine generates numbers and the answer.
4. Story service sends template + numbers + interest to Claude.
5. Validator checks. Fail -> retry (max 2) -> plain template text.
6. Student does the steps; each result goes to `POST /attempts/{id}/step`.
7. Wrong step -> backend returns the next hint level.

## 8. Tech stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite + TypeScript, Tailwind CSS, dnd-kit, plain SVG models, `react-i18next`, Vite PWA |
| Teacher charts | Tailwind grid for the heatmap, Recharts for bar charts |
| Backend | Python + FastAPI, pydantic, SQLAlchemy |
| Maths engine | Pure Python (`fractions.Fraction`, seeded `random`), no AI |
| Templates | YAML, reviewed by a teacher |
| AI | Claude API, backend only. `claude-haiku-5-5` for stories/hints; `claude-sonnet-5-5` only if quality is weak |
| Database | SQLite for the demo, Postgres (Supabase) for a pilot |
| Testing | `pytest`, one Playwright end-to-end flow |
| Hosting | Vercel (frontend), Render or Fly.io (backend) |
| CI | GitHub Actions: pytest + lint on every PR |

## 9. Shared contract (agree before coding)

Backend owns the pydantic models in `backend/app/models/`. FastAPI generates `openapi.json`; the frontend generates TypeScript types from it with `openapi-typescript`. **Do not hand-write API types on the frontend.**

```jsonc
// POST /problems/next  ->  Problem
{
  "attempt_id": 101,
  "structure": "equal_sharing",
  "model_type": "groups_picture",      // groups_picture | bar_model | number_line
  "story": "12 children share 84 laddoos equally.",
  "question": "How many laddoos does each child get?",
  "numbers": { "total": 84, "groups": 12 },   // answer is NOT included
  "steps_enabled": ["facts", "model", "operation", "calculation", "sense_check"],
  "sense_check_prompt": "Should the answer be bigger or smaller than 84?"
}

// POST /attempts/{id}/step  <-  StepSubmission
{ "step": "operation", "response": { "operation": "division" } }

// response  ->  StepFeedback
{ "correct": false, "hint_level": 1, "hint_text": "Is the total being split or joined?",
  "next_step": "operation", "attempt_solved": false }
```

Step names are fixed: `facts`, `model`, `operation`, `calculation`, `sense_check`.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/students/join` | Class code in, anonymous student code out |
| POST | `/problems/next` | Next problem |
| POST | `/attempts/{id}/step` | Submit a step, get feedback or next hint |
| POST | `/attempts/{id}/finish` | Close attempt |
| GET | `/teacher/class/{code}/map` | Structure-by-step failure map |
| GET | `/teacher/class/{code}/groups` | Students stuck on the same structure |
| POST | `/teacher/overrides` | Teacher corrects a logged diagnosis |

## 10. Data model

```
classes(id, code, teacher_label)
students(id, class_id, code)
structures(id, name, model_type)
templates(id, structure_id, text_pattern, ranges_json, answer_formula)
problems(id, template_id, numbers_json, answer, story_text, created_at)
attempts(id, student_id, problem_id, started_at, finished_at, solved)
step_events(id, attempt_id, step, correct, hint_level, response_json, ts)
```

`step_events` is the core research data: which step fails for which structure.

## 11. Template format

```yaml
id: share_equal_01
structure: equal_sharing
text_pattern: "{total} {item} are shared equally among {groups} {people}. How many does each get?"
numbers:
  groups: {min: 3, max: 12}
  per_group: {min: 4, max: 15}
  total: "groups * per_group"
answer: "total / groups"
model: groups_picture
operation: division
sense_check: "answer < total"
```

Pick `per_group` first and compute `total`, so the answer is always a whole number. The answer must never equal any number shown in the story.

## 12. AI rules

Output JSON only: `story`, `question`, `hint_1`, `hint_2`, `hint_3`.

Validation (all in code):
1. Every number from `numbers` appears in the story exactly once.
2. No extra numbers appear.
3. The story and hints never contain the correct answer.
4. Story length and reading level are within limits.
5. Hint 3 uses different numbers from the problem.
6. Any failure -> retry (max 2) -> plain template text.

Hint ladder: level 1 nudges toward the structure (never the operation); level 2 points to the right model (never the answer); level 3 is a worked parallel example with other numbers.

## 13. Repo layout

```
storymath/
  frontend/src/{components,pages,api,i18n}
  backend/
    app/{main.py, engine, ai, validation, models, routes}
    templates/            # YAML, teacher-reviewed
    fixtures/             # sample_problem.json (mock for frontend)
    tests/
  scripts/                # seed_events.py, generate_story_pool.py
  docs/
    PROJECT.md            # this file
    team/                 # one file per person
    pilot_protocol.md
  .github/workflows/ci.yml
  CODEOWNERS
  .env.example
  README.md
```

## 14. Team and ownership

| Person | Role | File |
|---|---|---|
| A | Frontend: solve flow | `docs/team/A_frontend_solve_flow.md` |
| B | Backend + maths engine | `docs/team/B_backend_maths_engine.md` |
| C | AI layer + content | `docs/team/C_ai_content.md` |
| D | Teacher view + DevOps + pitch | `docs/team/D_teacher_devops_pitch.md` |

One owner per folder. If you need to change a folder you do not own, message the owner first.

## 15. Timeline (about 2 days)

| Block | Work |
|---|---|
| Setup (2h, everyone) | Repo, schemas, `sample_problem.json`, CODEOWNERS, CI |
| Block 1 (5-6h) | A: solve flow on mock. B: engine + 6 templates + tests. C: prompts + schema + first validators. D: seed script + heatmap |
| Block 2 (5-6h) | A: models, hints, skip logic. B: remaining templates, DB, endpoints. C: retry, fallback, cache. D: groups view, CI, deploy |
| Integration (3h) | Swap mock for real API; fix contract bugs; pre-generate story pool |
| Polish + pitch (3h) | UI polish, run 50 stories through validators, deck, rehearse demo 3 times |

Cut in this order if short on time: teacher stuck-groups, number-line model, skip-steps, PWA offline. **Never cut the validators or the engine tests.**

## 16. Git rules (all four)

1. Nobody pushes to `main`. Everything goes through a pull request.
2. Branches: `a/...`, `b/...`, `c/...`, `d/...` (e.g. `b/engine-templates`).
3. One teammate approves; CI must pass. Squash merge.
4. Merge at least twice a day. Small commits: `engine: add unit_rate template`.
5. Before pushing: `git pull --rebase origin main`.
6. Schema changes need all four people. Regenerate TS types and tell the group.
7. Never commit `.env` or the Claude API key. Only `.env.example`.

```bash
git checkout main && git pull
git checkout -b b/engine-templates
# work, commit often
git push -u origin b/engine-templates   # open a PR on GitHub
```

## 17. How we measure and what we claim

| Metric | Method |
|---|---|
| Transfer gain | Score on unseen problems of the same structure, before vs after |
| Step-failure accuracy | A teacher watches 20 attempts; compare with the log |
| Story validity | Share of generated stories passing the code check, plus share a teacher flags |
| Hint reliance | How often level-3 hints are needed, and whether that falls |

Pilot: 10-15 students. **No control group**, so we can show improvement, not causation. Say this in the pitch.

## 18. Risks

| Risk | Mitigation |
|---|---|
| AI writes odd or off stories | Approved interest list, validation, plain-text fallback |
| AI leaks the answer in a hint | Validation rule 3; hint 3 uses different numbers |
| 5-step flow feels slow | Skip steps 2-3 after two correct in a row |
| API latency in class and at the demo | Pre-generate and cache validated stories |
| Student privacy | Anonymous codes only; no names, emails or free text stored |
| Weak internet | PWA with cached stories; sync later |

## 19. Definition of done for the hackathon

- [ ] A student can join with a class code and finish one full problem (all 5 steps) on a phone.
- [ ] At least 6 structures and about 15 templates are live and teacher-reviewed.
- [ ] Every shown story has passed the validators (or is the plain fallback).
- [ ] Teacher heatmap shows real or seeded data.
- [ ] The backend `pytest` suite passes in CI.
- [ ] Deployed link works; demo runs from cached stories without live AI.
- [ ] Deck and 3-minute demo rehearsed.
