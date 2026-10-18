# StoryMath frontend (Person A: student solve flow)

React + Vite + TypeScript, Tailwind (mobile-first), dnd-kit, plain SVG models, react-i18next, Vite PWA.

## Run

```bash
cp .env.example .env       # VITE_USE_MOCK=true runs with no backend
npm install
npm run dev                # http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm run build` | typecheck + production build (also generates the service worker) |
| `npm run lint` | `tsc --noEmit` |
| `npm run gen:api` | generate `src/api/schema.d.ts` from `../backend/openapi.json` |
| `npm run e2e` | Playwright: join -> solve one problem -> finish (uses the mock) |

First time for e2e: `npx playwright install chromium`.

## Switching from mock to the real API

1. `npm run gen:api`, then replace the interfaces in `src/api/types.ts` with re-exports from `schema.d.ts` (the file explains how).
2. In `.env` set `VITE_USE_MOCK=false` and `VITE_API_URL=<deployed backend>`.
3. Fix any contract mismatches **with Person B**, not in the frontend.

## Layout

```
src/
  api/          http.ts (fetch + errors), client.ts (typed calls), queue.ts (offline queue),
                mock.ts + sample_problem.json (used while VITE_USE_MOCK=true), types.ts
  components/   StoryCard, FactTapper, ModelBoard (+ModelPicture), OperationPicker,
                CalculationInput, SenseCheck, HintBox, StepProgress, AppShell, States
  pages/Join/   class code -> anonymous student code
  pages/Solve/  useSolve (state), StepPanel (one step), TransferScreen
  i18n/         en.json complete; hi.json and kn.json are empty stubs (fall back to English)
  lib/          tokens.ts (story -> tappable tokens), session.ts (localStorage)
e2e/solve.spec.ts
```

## Request/response shapes the client assumes (confirm with B)

- `POST /students/join` body `{ "class_code": "..." }` -> `{ "student_code": "S-4821" }`
- `POST /problems/next` body `{ "student_code": "S-4821" }` -> `Problem`
- `POST /attempts/{id}/step` body `{ step, response }` -> `StepFeedback`
- `POST /attempts/{id}/finish` (no body)

`response` payloads per step:

| step | response |
|---|---|
| facts | `{ given: string[], asked: string[] }` token ids: `s0, s1...` (story words in order), `q0, q1...` (question words) |
| model | `{ model_type, values: { <number key>: number } }` |
| operation | `{ operation: "addition" \| "subtraction" \| "multiplication" \| "division" }` |
| calculation | `{ answer: number }` |
| sense_check | `{ direction: "bigger" \| "smaller" }` |

## Rules this code follows

- The correct answer is never sent to or computed on the client (only `mock.ts` knows answers, for demos).
- Only anonymous codes are stored. No names, emails or free text.
- The Claude API is never called from the frontend.
- Offline: the app shell is cached by the service worker, the current problem is kept in localStorage, and step submissions made offline are queued and replayed when back online.
