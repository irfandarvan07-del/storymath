# Person D: Teacher dashboard, DevOps, and pitch

Read `docs/PROJECT.md` first. This file is your part.

## Your goal

Make the project useful to teachers and reliable to demonstrate:
teachers should be able to see where students struggle, the app should
build and deploy consistently, and the team should have a clear,
evidence-based pitch and demo.

## You own

``` text
frontend/src/pages/Teacher/     teacher dashboard pages and components
scripts/seed_events.py          seeded demo events
.github/workflows/ci.yml        automated checks
docs/pilot_protocol.md          pilot procedure (coordinate with C)
docs/pitch/                     pitch deck assets, if the team uses this folder
deployment configuration        frontend/backend deployment settings
```

Coordinate with A on the shared Tailwind theme and API client.
Coordinate with B before changing database-dependent scripts or teacher
endpoints. Coordinate with C on teacher review and pilot logistics.

## Stack

React + TypeScript, Tailwind CSS, Recharts where useful, Python scripts,
GitHub Actions, and the hosting choices in `PROJECT.md` (Vercel for the
frontend; Render or Fly.io for the backend; SQLite for the demo).

## Tasks

### Setup (hour 0--2, with everyone)

-   [ ] Read `docs/PROJECT.md` and agree on the shared API contract.
-   [ ] Confirm the repository structure and branch/PR rules.
-   [ ] Coordinate with B on the database tables and the shape of
    `step_events`.
-   [ ] Coordinate with A on the shared Tailwind theme and API client.
-   [ ] Add a minimal GitHub Actions workflow that runs backend tests
    and lint checks; expand it as the project grows.
-   [ ] Confirm the demo can run locally using the sample fixture and
    seeded data.

### Block 1: teacher dashboard and CI (5--6h)

-   [ ] Create `frontend/src/pages/Teacher/`.
-   [ ] Build a teacher class view using the existing shared theme and
    API client.
-   [ ] Build a **structure-by-step failure heatmap** showing where
    students struggle across the six maths structures and the five
    steps: `facts`, `model`, `operation`, `calculation`, `sense_check`.
-   [ ] Build a **stuck-groups view** showing students who struggle with
    the same structure. Use anonymous student codes only.
-   [ ] Add clear loading, empty, and error states.
-   [ ] Use Recharts for simple bar charts only where they make the data
    easier to understand; avoid spending time on decorative charts.
-   [ ] Create `scripts/seed_events.py` to insert reproducible demo
    events using B's schema. Coordinate with B before relying on table
    fields.
-   [ ] Configure GitHub Actions to run `pytest` and lint checks on each
    pull request. Add frontend checks if the relevant scripts are
    available.

### Block 2: data, deployment, and reliability (5--6h)

-   [ ] Connect the teacher dashboard to the documented teacher
    endpoints:
    -   `GET /teacher/class/{code}/map`
    -   `GET /teacher/class/{code}/groups`
-   [ ] If those endpoints are not ready, use a clearly labelled mock
    response temporarily; replace it during integration.
-   [ ] Make the seeded demo data reproducible so the dashboard never
    depends on real student data.
-   [ ] Configure frontend deployment on Vercel and backend deployment
    on Render or Fly.io, as appropriate for the team.
-   [ ] Set the frontend API URL through environment configuration such
    as `VITE_API_URL`.
-   [ ] Set backend secrets in the hosting provider's environment
    settings. Never commit `.env`, API keys, or credentials.
-   [ ] Verify CORS and the deployed frontend-to-backend connection with
    B.
-   [ ] Write concise setup and deployment instructions in `README.md`
    or coordinate the updates with the person maintaining it.

### Integration (about 3h)

-   [ ] Test the complete journey with A and B: join a class, solve a
    problem, submit steps, finish the attempt, and see the resulting
    event in the teacher dashboard.
-   [ ] Verify that the heatmap and stuck-groups view use actual API
    data when the backend is connected.
-   [ ] Confirm seeded data is visibly distinguishable from real pilot
    data.
-   [ ] Run the backend test suite and frontend checks from a clean
    checkout.
-   [ ] Test the deployed app on a phone and a laptop.
-   [ ] Keep a short list of known limitations for the demo; do not
    present unfinished functionality as complete.

### Pilot protocol and pitch polish

-   [ ] Coordinate with C to write `docs/pilot_protocol.md` for a pilot
    of 10--15 students.
-   [ ] Include before/after problem sets, an observation sheet for step
    failures, and a process for teacher feedback.
-   [ ] Use the metrics defined in `PROJECT.md`: transfer gain,
    step-failure accuracy, story validity, and hint reliance.
-   [ ] Do not claim causation from the small pilot: the project has no
    control group. Report observed improvement, not proof that the app
    caused it.
-   [ ] Prepare a concise pitch deck covering the problem, solution,
    product flow, architecture, safeguards, pilot plan, metrics,
    limitations, and next steps.
-   [ ] Use only the verified figures in `PROJECT.md` unless another
    statistic has been checked against its original report.
-   [ ] Rehearse the three-minute demo at least three times.

## Dashboard requirements

The teacher view should answer these questions quickly:

1.  Which maths structures cause the most difficulty?
2.  At which step are students getting stuck?
3.  Are multiple students struggling with the same structure?
4.  What should the teacher review or explain next?

Keep the interface readable and practical. Do not show student names,
emails, or free-text personal details. Use anonymous student codes.

## Rules specific to you

-   A owns the student pages; you own `frontend/src/pages/Teacher/`.
    Coordinate changes to shared styles and API utilities.
-   B owns the backend models, maths engine, routes, and database
    contract. Do not silently change their schemas or tables.
-   C owns the AI and validation folders and coordinates story review.
    Work with C on pilot logistics.
-   Do not use real student personal data in seeded events or the demo.
-   Do not commit `.env`, API keys, or other secrets.
-   Label seeded/demo data clearly; never imply that seeded records are
    real pilot results.
-   The project has no control group, so do not claim that observed
    improvement proves causation.
-   Keep the demo reliable: pre-generated validated stories and
    deterministic seed data should work without requiring a live AI
    request during the presentation.

## You depend on

  -----------------------------------------------------------------------
  From                    What                    When
  ----------------------- ----------------------- -----------------------
  A                       Shared Tailwind theme,  Setup / Block 2
                          API client, student     
                          flow                    

  B                       Database schema,        Setup / Block 1
                          `step_events`, teacher  
                          endpoint contracts      

  C                       Teacher-reviewed        Block 2 / Polish
                          templates, story        
                          validity results, pilot 
                          coordination            
  -----------------------------------------------------------------------

## Others depend on you

  -----------------------------------------------------------------------
  Who                     Needs                   When
  ----------------------- ----------------------- -----------------------
  A                       Shared theme and        Block 2
                          deployed backend URL    

  B                       Seed script compatible  Block 1--2
                          with database models    
                          and useful test data    

  C                       Teacher feedback        Block 2 / Polish
                          coordination and pilot  
                          protocol support        

  All                     Reliable CI,            Integration / Polish
                          deployment, dashboard,  
                          pitch, and rehearsed    
                          demo                    
  -----------------------------------------------------------------------

## Git

Use branches beginning with `d/`, for example:

-   `d/teacher-dashboard`
-   `d/seed-events`
-   `d/ci-deploy`
-   `d/pitch-pilot`

Open pull requests instead of pushing directly to `main`. Keep commits
small, run checks before opening a PR, and coordinate before changing
shared files or API contracts.

## Definition of done

-   [ ] Teacher dashboard displays a structure-by-step failure heatmap.
-   [ ] Teacher dashboard displays groups struggling with the same
    structure.
-   [ ] Dashboard uses real teacher endpoint data after integration, or
    clearly labelled mock data while endpoints are unfinished.
-   [ ] `scripts/seed_events.py` creates reproducible demo events
    compatible with B's schema.
-   [ ] GitHub Actions runs backend tests and lint checks on pull
    requests.
-   [ ] Frontend and backend are deployed and communicate successfully,
    or the team has documented the specific deployment blocker.
-   [ ] `docs/pilot_protocol.md` is written with C.
-   [ ] Pitch metrics and claims match the evidence; no causal claim is
    made from a pilot without a control group.
-   [ ] The full demo has been rehearsed at least three times.
