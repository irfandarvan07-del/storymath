# StoryMath: same maths, different story. Master pitch file

Deck (live): https://claude.ai/artifact/GdgUgFH5zLY2wCkeN8buGo
Slot: 3 min pitch + 2 min Q&A. Judges: mixed technical and education.
Built from `PROJECT.md` and the A/B/C/D team files.

---

## 0. Claim guardrails (read before every rehearsal)

**Use only these figures. Do not round, add or invent.**

| Number | Meaning | Source (footnote on slide 2) |
|---|---|---|
| 30.7% | Class 5 students who can solve a division problem (rural India) | ASER 2024 |
| 19% | Same measure, Karnataka government schools, Class 5 | ASER 2024 |
| 46% | National average maths score, Class 6 | PARAKH Rashtriya Sarvekshan 2024, NCERT |
| 53% | Class 6 students who know tables to 10 and apply the four operations to daily-life problems | PARAKH 2024 |

**Always say:** ASER covers rural India and tests at floor level. No national Class 7 figure exists; ASER and PARAKH bracket it at Classes 5, 6 and 8.

**Never say:**
- "First ever", "no one else does this", "revolutionary", "AI-powered" as a headline.
- Anything implying the pilot proves the app caused improvement (no control group).
- That seeded demo data is real pilot data. Label it "demo data".
- Any story-validity or teacher-flag number until C has run the 50-story check. Placeholder: validity pass rate `[__]`, teacher-flag share `[__]`.

---

## 1. Slide-by-slide content (11 slides, max 25 words of body text each)

### 1. Title
- **Title:** StoryMath: same maths, different story
- **Subtitle:** Teaching Class 5-7 students to recognise which maths a story needs.
- **Team:** [Team name]
- **Notes:** We built StoryMath to fix one problem: students can calculate, but cannot tell which calculation a story needs. In three minutes: the evidence, the idea, and how we keep AI safe.

### 2. The problem (stats)
- **Headline:** Students can calculate. They can't tell which calculation the story needs.
- **Cards:** 30.7% / 19% / 46% / 53% (labels as in the table above).
- **Footnote:** Sources: ASER 2024 (30.7%, 19%); PARAKH Rashtriya Sarvekshan 2024, NCERT (46%, 53%). ASER covers rural India and tests at floor level. No national Class 7 figure exists; ASER and PARAKH bracket it at Classes 5, 6 and 8.
- **Notes:** Two national surveys point the same way. Even on basic division and daily-life problems, many students fall short. We read this as a recognition gap, not only a calculation gap. Note the footnote: there is no Class 7 figure, so we bracket it.

### 3. The hidden gap
- **Headline:** A wrong answer doesn't tell you why.
- **Visual:** One wrong answer branches to: misread the story / chose the wrong operation / arithmetic slip.
- **Caption:** Marking it wrong hides the cause. And a new story looks like a brand new problem.
- **Notes:** A red cross tells a teacher nothing about where thinking broke. Those three causes need three different fixes. And a new story looks like a new problem to a child, so practice does not carry over.

### 4. Our idea
- **Headline:** Keep the structure. Change the story.
- **Visual:** Three stories (12 children share 84 laddoos / 84 laddoos packed in boxes of 12 / a cricket team sharing 84 runs' worth of bonus points) all point to one bar model and the operation: division.
- **Caption:** Learn the structure once. Recognise it everywhere.
- **Chips:** equal groups, equal sharing, difference comparison, unit rate, fraction of a quantity, perimeter/area.
- **Notes:** Three different stories, one bar model, one operation. We teach six structures. A student who sees the structure once can recognise it in any story.

### 5. The 5-step loop
- **Flow:** 1 Read, 2 Pick facts (given / asked), 3 Choose model, 4 Calculate, 5 Sense-check, then Transfer: new story, same structure.
- **Callout:** ~3 minutes per problem. Strong students can skip steps 2-3.
- **Notes:** Every problem walks the same five steps, so we see exactly which step a student struggles with. After two correct problems in a row the backend lets strong students skip steps 2 and 3. Then transfer: new story, same structure.

### 6. What's novel
- **Diagnosis by design:** every wrong answer is logged against the exact step (facts, model, operation, calculation, sense-check). No ML guessing.
- **Transfer, not repetition:** same structure, fresh story, so success proves recognition, not memory.
- **Safe AI by construction:** code does the maths, AI only does the language.
- **Notes:** Diagnosis is built into the design, so no model has to guess. Transfer shows recognition rather than memory. Safety comes from architecture.

### 7. How we keep AI safe
- **Headline:** The AI never touches the arithmetic.
- **Flow:** Hand-written structure template -> Python maths engine picks numbers and computes the answer -> Claude writes story and hints (JSON) -> Code validator -> Student.
- **Validator checks:** every number appears once; no extra numbers; answer not leaked; reading level.
- **Side branch:** fail -> retry twice -> plain-text fallback.
- **Notes:** Template and numbers come from code. Claude writes the story and three hints as JSON. The validator rejects leaked answers or stray numbers. Two retries, then plain text. The correct answer also stays on the server until a step is submitted.

### 8. Tech stack
- **Frontend:** React, Vite, TypeScript, Tailwind, SVG models, PWA (offline)
- **Backend:** FastAPI (Python); maths engine using fractions.Fraction, tested with pytest
- **AI:** Claude Haiku 5.5 (stories and hints), schema-validated JSON, server-side only
- **Data:** SQLite for demo; Postgres for pilot; anonymous class and student codes
- **Deploy:** Vercel and Render
- **Footer:** No microservices. No custom ML. One frontend, one backend, one database.
- **Notes:** Deliberately boring. The engine uses exact fractions and every template is tested over 1000 seeded problems. Claude is called only from the server.

### 9. Teacher view
- **Visual:** Heatmap mockup, rows = 6 structures, columns = 5 steps, one hot cell: unit rate x choose model.
- **Caption:** Not 'who failed', but 'what to reteach tomorrow and to whom'.
- **Notes:** One hot cell tells a teacher: unit rate, choosing the model. That is tomorrow's reteach. A second view groups students stuck on the same structure, by anonymous code only. Demo data is labelled as demo data.

### 10. How we'll prove it
- **Metrics:** transfer gain on unseen problems; step-failure accuracy vs a teacher's observation of 20 attempts; story validity rate; hint reliance over time.
- **Pilot:** 10-15 students, before/after problem sets.
- **Statement:** No control group yet, so we can show improvement, not causation.
- **Notes:** Four metrics, small pilot. We are upfront: no control group. We report observed improvement, not proof the app caused it.

### 11. Impact and roadmap
- **Left:** privacy-safe (no names or emails); works on low-end phones and weak networks.
- **Right:** two-step problems and ratios; Hindi and Kannada stories reviewed by teachers; teacher-authored templates; spaced re-checks.
- **Closing line:** Don't teach 1000 problems. Teach 6 structures.
- **Notes:** Anonymous codes only, and a PWA that opens offline. Next: harder problems, Hindi and Kannada reviewed by teachers, teacher-authored templates, spaced re-checks. Close on the line.

---

## 2. Three-minute demo script (slides 4-9)

| Slide | Time | Say / do |
|---|---|---|
| 4 Idea | 35s | "Three stories: 12 children share 84 laddoos, 84 laddoos in boxes of 12, a cricket team sharing bonus points. One bar model, one operation, division. Six structures in total." |
| 5 Loop | 30s | **Live on phone:** join with class code, get anonymous code. "Read, pick facts, choose model, calculate, sense-check. About three minutes a problem; strong students skip steps 2 and 3." |
| 6 Novel | 25s | Submit one deliberate wrong operation. "The hint nudges toward the structure, never the answer. And the event is logged against the operation step." |
| 7 Safety | 45s | "Template, then Python picks numbers and the answer. Claude only writes story and hints as JSON. Validator checks every number and that the answer isn't leaked. Fail twice, plain text. AI never touches the arithmetic." |
| 8 Stack | 20s | "React and FastAPI, Claude Haiku 5.5 server-side only, SQLite for the demo. No microservices, no custom ML." |
| 9 Teacher | 25s | **Switch to teacher dashboard:** point to the hot cell. "That's tomorrow's reteach, and who to pull aside." Say "demo data" out loud. |

**If the whole slot is 3 minutes** (slides 1-11), do not run the live demo as above. Use: slides 1-3 in 35s, slides 4-9 in 100s (one line each, one screenshot of the live flow), slides 10-11 in 35s.

**Demo reliability checklist**
- Run from pre-generated, validated stories. No live AI request on stage.
- Seeded data is deterministic and visibly labelled as demo.
- Tested on a real phone and a laptop; backup screen recording ready.
- Rehearsed at least 3 times.

---

## 3. Six likely judge questions (2-line answers)

**1. What if the AI writes a wrong story?**
Every story passes code checks first: each given number once, no extra numbers, answer not leaked, reading level. If it fails twice, the student gets the plain template text. Teachers review the templates.

**2. Why not let the AI solve it?**
Language models can slip on arithmetic, and a wrong "correct answer" would teach the wrong thing. So the Python engine, using exact fractions and tested over 1000 seeded problems per template, owns every number and answer.

**3. How is this different from existing maths apps?**
We log which step failed (facts, model, operation, calculation or sense-check) and test on fresh stories with the same structure. That shows recognition, not memory. We don't claim to be the only ones doing this.

**4. Is your pilot statistically valid?**
No, and we say so. It is 10-15 students with before/after sets and no control group, so we can show improvement, not causation.

**5. Privacy with minors?**
No names, emails or free text are stored, only anonymous class and student codes. Students pick interests from an approved list, and Claude is only called from the server with no student data.

**6. What happens with no internet?**
The PWA opens offline with cached stories, and step submissions queue and sync when the connection returns. Our demo also runs from pre-generated stories, so it needs no live AI.

**Spare answers**
- *What did you actually build in the hackathon?* [Fill in honestly from the checklist in section 4.]
- *What is your story validity rate?* "[__] of 50 generated stories passed the code check; a teacher flagged [__]." Say this only after C's run.

---

## 4. Pre-pitch checklist (from the team files)

- [ ] C: 50-story validator run done; pass rate and failure reasons recorded.
- [ ] C: one teacher has flagged confusing stories; share recorded.
- [ ] D: heatmap and stuck-groups view show seeded data labelled as demo.
- [ ] D: frontend and backend deployed, CORS verified, tested on phone.
- [ ] B: pytest green in CI; answer never in any pre-submission API response.
- [ ] A: join -> solve -> finish works on the real API; Playwright test green.
- [ ] Deck figures match section 0 exactly.
- [ ] Known limitations list ready; nothing unfinished presented as complete. If cut for time (stuck-groups, number line, skip steps, PWA offline), remove it from slides and answers.
