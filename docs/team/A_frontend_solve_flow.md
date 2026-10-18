# Person A: Frontend (student solve flow)

Read `docs/PROJECT.md` first. This file is your part.

## Your goal

A student on a low-end phone joins a class, solves one problem through the 5 steps, and gets hints when stuck. It must feel quick, clear and friendly.

## You own

```
frontend/src/components/   StoryCard, FactTapper, ModelBoard, SenseCheck, HintBox
frontend/src/pages/Join/
frontend/src/pages/Solve/
frontend/src/api/          typed client
frontend/src/i18n/
```

(Person D owns `frontend/src/pages/Teacher/`. You two share the Tailwind theme and the API client; agree changes in chat.)

## Stack

React + Vite + TypeScript, Tailwind CSS (mobile-first), dnd-kit for dragging, plain SVG for models, `react-i18next`, Vite PWA plugin.

## Tasks

### Setup (hour 0-2, with everyone)
- [ ] `npm create vite@latest frontend -- --template react-ts`, add Tailwind, dnd-kit, react-i18next
- [ ] Generate TS types from the backend's `openapi.json` with `openapi-typescript` (never hand-write API types)
- [ ] Typed API client in `src/api/` with a `VITE_API_URL` env variable

### Block 1: solve flow on mock data (5-6h)
- [ ] **Join page:** enter class code, receive anonymous student code (`S-4821`), store it in memory/localStorage
- [ ] **StoryCard:** show story and question; each word/number is tappable
- [ ] **FactTapper (step: facts):** tap to mark *given* vs *asked*; send ids in `response`
- [ ] **ModelBoard (step: model):** pick a model (bar, groups, number line), then fill known values
  - Bar model and groups picture first; number line is the first thing to cut
  - Plain SVG shapes; no heavy library
- [ ] **Operation + calculation (steps: operation, calculation):** choose operation, type the answer
- [ ] **SenseCheck:** show `sense_check_prompt` with Bigger / Smaller buttons
- [ ] **HintBox:** show `hint_text` from feedback; levels 1-3 appear one at a time
- [ ] Step progress bar at the top; only render steps listed in `steps_enabled`
- [ ] Build everything against `backend/fixtures/sample_problem.json` until the real API is ready

### Block 2 (5-6h)
- [ ] Transfer screen: "New story, same structure" after a solved problem
- [ ] Respect `steps_enabled` (strong students skip facts and model; the backend decides, you only render)
- [ ] Wrong-step behaviour: show the hint, let the student retry the same step
- [ ] i18n: all UI strings through `t()`; English file complete, empty Hindi/Kannada stubs
- [ ] PWA: manifest + service worker so the app opens offline; queue step submissions and retry when online
- [ ] Large tap targets, readable fonts, works at 360px width

### Integration (3h)
- [ ] Swap the mock fixture for the real `/problems/next`
- [ ] Fix any contract mismatches with B (talk to B, do not patch around them)
- [ ] One Playwright test: join -> solve one problem -> finish

### Polish
- [ ] Friendly empty/error/loading states
- [ ] Rehearse the demo flow on a real phone

## Rules specific to you

- The correct answer is **never** sent to the client. If you need to show correctness, it comes from `StepFeedback.correct`.
- Do not store names, emails or free text from students.
- Do not call the Claude API from the frontend. Ever.
- No `<form>`-based scripts needed; plain buttons and handlers are fine.

## You depend on

| From | What | When |
|---|---|---|
| B | Pydantic models -> `openapi.json`; `/problems/next` mock then real | Hour 2 / integration |
| C | Hint text format (plain strings, levels 1-3) | Block 2 |
| D | Shared Tailwind theme; deployed backend URL | Block 2 |

## Others depend on you

- D reuses your Tailwind theme and API client for the teacher pages.
- The demo (slides 4-9) runs on your solve flow.

## Git

Branches: `a/join-page`, `a/solve-flow`, `a/model-board`, `a/pwa`, etc. Open a PR at least twice a day.

## Definition of done

- [ ] All 5 steps work on a phone with the real API
- [ ] Hints appear in order and never show the answer
- [ ] App opens offline and syncs later
- [ ] One Playwright end-to-end test passes in CI
