# Person C: AI layer and content

Read `docs/PROJECT.md` first. This file is your part.

## Your goal

Turn engine numbers into short, safe, culturally natural stories and hints, and make sure **nothing bad ever reaches a student**. Your validators are what let us say "the AI never touches the arithmetic."

## You own

```
backend/app/ai/           prompts, Claude client, output schema
backend/app/validation/   story and hint checks
backend/tests/validation/
scripts/generate_story_pool.py
backend/app/ai/interests.yaml     approved interest list
```

You also run **teacher review** of templates and the pilot logistics with D.

## Stack

Python, Claude API (backend only), pydantic for output schema, `pytest`. Models: `claude-haiku-5-5` for stories and hints; `claude-sonnet-5-5` only if Haiku quality is not good enough.

## Tasks

### Setup (hour 0-2, with everyone)
- [ ] Agree with B on the function signature: `generate_story(template, numbers, interest) -> Story`
- [ ] Add `ANTHROPIC_API_KEY` to your local `.env` (never commit it)

### Block 1: prompts and first validators (5-6h)
- [ ] **Output schema (pydantic):** `story`, `question`, `hint_1`, `hint_2`, `hint_3`
- [ ] **System prompt:** write short maths stories for Class 5-7 students in India; use the given numbers **exactly, as digits**; never compute or mention the answer; output JSON only, no markdown fences
- [ ] **Input to the model:** structure, numbers, item/people vocabulary, interest from the approved list, reading level
- [ ] **Claude client:** server-side call, strip any ```` ```json ```` fences, parse with pydantic, handle timeouts and API errors
- [ ] **Approved interest list** (`interests.yaml`): cricket, festivals, school, food, etc. Keep it small and safe. Students pick from the list; no free text
- [ ] **Validators (all in code, one function each, each unit-tested):**
  1. Every number from `numbers` appears in the story **exactly once**
  2. **No extra numbers** appear (to avoid a hidden second answer)
  3. The story and all hints **do not contain the correct answer**
  4. Story length and reading level within limits
  5. Hint 3 uses **numbers different** from the problem
  6. Any failure -> retry (max 2) -> plain template text

Implementation tips:
- Match numbers with regex word boundaries (`(?<!\d)84(?!\d)`), so `12` does not match inside `120`
- Tell the model to write numbers as digits; also reject number words that equal a given number if you want to be strict
- Hint 1 must not name the operation; hint 2 must not give the answer; hint 3 is a worked parallel example with other numbers
- B guarantees the answer never equals a given number; if you find a case where it does, tell B

### Block 2 (5-6h)
- [ ] Retry loop (max 2) then fallback to the template's plain text
- [ ] **Story cache:** pre-generate and store a pool of validated stories per template and interest; `generate_story` serves from the pool first and only calls Claude if the pool is empty
- [ ] `scripts/generate_story_pool.py`: generates and validates stories in bulk, stores only the ones that pass, prints the pass rate
- [ ] Bad-case tests: stories that leak the answer, repeat a number, add a number, or use hint-3 numbers that match the problem. All must be **rejected**
- [ ] Arrange a **teacher review** of B's templates (wording, number ranges, culture fit); log fixes

### Integration (3h)
- [ ] Wire `generate_story` into B's `/problems/next`
- [ ] Pre-generate the demo story pool so the demo needs no live API call

### Polish
- [ ] **Run 50 stories through the validators** and record the pass rate and failure reasons; this is a pitch number ("story validity")
- [ ] Ask one teacher to flag stories that are confusing or wrong; record that share too
- [ ] With D: write `docs/pilot_protocol.md` (10-15 students, before/after problem sets, step-failure observation sheet)

## Rules specific to you

- The AI **never** generates numbers or answers. The engine does.
- No student names, personal details or free text go into prompts.
- If validation fails, fall back to the plain template; do not try to "fix" the story with code.
- Never commit the API key. Rotate it if it ever reaches Git.

## You depend on

| From | What | When |
|---|---|---|
| B | Templates, number generator, correct answers for tests | Block 1 |
| A | Hint display format (plain text, levels 1-3) | Block 2 |

## Others depend on you

| Who | Needs | When |
|---|---|---|
| B | `generate_story(...)` that always returns something safe | Block 2 |
| A | Hint strings in `StepFeedback.hint_text` | Block 2 |
| D | Story validity numbers and pilot protocol for the deck | Polish |

## Git

Branches: `c/story-schema`, `c/validators`, `c/story-cache`, `c/pilot-protocol`. Keep tests in the same PR as the validator.

## Definition of done

- [ ] All 6 validation rules implemented and tested with good and bad cases
- [ ] Retry plus plain-text fallback works
- [ ] A cached pool of validated stories exists for every template
- [ ] Validity pass rate (50 stories) and teacher-flag rate recorded
- [ ] Teacher has reviewed the templates
- [ ] `docs/pilot_protocol.md` written
