# StoryMath Pilot Study Protocol

**Target Group:** 10–15 Class 5–7 Students  
**Context:** Government and Aided Schools, Karnataka  
**Lead Roles:** Person C (AI & Content) & Person D (Teacher & DevOps)  

---

## 1. Objective

To measure whether decoupling **word-problem language from mathematical structure** enables middle-school students to:
1. Correctly recognize the mathematical operation across different story contexts (transfer gain).
2. Pinpoint the exact step at which word-problem comprehension breaks down (facts, model, operation, calculation, sense-check).
3. Reduce reliance on multi-tiered hints over repeated exposure.

---

## 2. Participant Cohort

| Parameter | Specification |
|---|---|
| Sample Size | 12 to 15 students |
| Grade Level | Class 5, 6, and 7 |
| Arithmetic Prerequisite | Can perform basic 2-digit multiplication and division on pure numeric worksheets |
| Known Challenge | Fails or hesitates on textbook word problems |
| Privacy Protocol | **Anonymous Student Identifiers only** (e.g., `S-4821`). No names, birthdates, Aadhaar numbers, or contact details are collected or stored. |

---

## 3. Study Design (Before-and-After Trial)

```
[Day 1: Pre-Test]  --->  [Day 2: StoryMath Intervention]  --->  [Day 3: Post-Test Transfer]
6 Textbook Problems           30-minute interactive session           6 Parallel Unseen Problems
(Same 6 Structures)            (5-step loop + Transfer stories)        (Same 6 Structures)
```

### Phase 1: Pre-Test Baseline (20 minutes)
Administer 6 standard word problems covering the 6 core structures without scaffolding:
1. **Equal Sharing:** "72 apples are distributed equally into 8 baskets. How many in each?"
2. **Equal Groups:** "A box has 6 rows of biscuits with 14 biscuits in each row. How many total?"
3. **Difference Comparison:** "Kavya has 45 stickers. Tanvi has 18 fewer stickers than Kavya. How many does Tanvi have?"
4. **Unit Rate:** "One movie ticket costs Rs. 35. How much will 4 tickets cost?"
5. **Fraction of a Quantity:** "A bag contains 24 marbles. 1/3 of them are blue. How many are blue?"
6. **Perimeter / Area:** "A rectangular vegetable patch is 15 m long and 8 m wide. Find the perimeter."

Record baseline accuracy and the student's initial chosen operation.

---

### Phase 2: StoryMath Intervention Session (30 minutes)
1. Student enters class code and receives anonymous code `S-XXXX`.
2. Student solves problems guided by the 5-step loop:
   - **Step 1 (Read):** Read the story in a chosen interest theme (cricket, festivals, sports).
   - **Step 2 (Facts):** Tap the given quantities and the asked target.
   - **Step 3 (Model):** Select the visual representation (groups picture, bar model, number line).
   - **Step 4 (Calculate):** Choose operation and enter answer.
   - **Step 5 (Sense-Check):** Verify relative magnitude ("Should answer be bigger or smaller than X?").
3. Immediate Transfer Problem: App generates a new story with identical mathematical structure to reinforce generalization.
4. Automatic Scaffolding Skip: When a student solves 2 consecutive problems cleanly, Steps 2 and 3 are automatically bypassed.

---

### Phase 3: Post-Test Parallel Problem Set (20 minutes)
Administer 6 parallel problems with completely unseen stories but identical underlying structures.
Measure the change in:
- Correct operation selection.
- Overall problem completion accuracy.
- Time to solve per problem.

---

## 4. Teacher Step-Failure Observation Sheet

While students practice, the teacher observes and independently marks where difficulty occurs. This is later cross-referenced with the backend's automated `step_events` table to measure diagnostic accuracy.

```
Observer Name: _______________________    Class Code: ________________
Date: ________________________________    Student Code: ______________

[Structure Under Observation: _______________________________________]

Step 1: Reading & Comprehension
[ ] Reads fluently without assistance
[ ] Stumbles on vocabulary
[ ] Confused by context/theme

Step 2: Fact Identification
[ ] Correctly tags given numbers and asked goal
[ ] Tags numbers but misses the question goal
[ ] Confuses given number with unknown answer

Step 3: Model Selection
[ ] Selects correct visual model immediately
[ ] Tries multiple models before finding correct one
[ ] Unable to match problem structure to model

Step 4: Operation & Arithmetic
[ ] Chooses correct operation immediately
[ ] Chooses WRONG operation (e.g. multiplied instead of divided)
[ ] Correct operation chosen, but calculation slip occurred

Step 5: Sense-Checking
[ ] Correctly explains why answer must be bigger/smaller
[ ] Guesses without mathematical justification

Observed Primary Misconception:
[ ] Story Misread    [ ] Operation Selection    [ ] Arithmetic Slip    [ ] Model Confusion
```

---

## 5. Metrics & Analysis Plan

1. **Transfer Gain:**  
   $$\text{Transfer Gain} = \frac{\text{Post-Test Score} - \text{Pre-Test Score}}{\text{Max Possible Score}} \times 100$$
2. **Step-Failure Diagnostic Accuracy:**  
   Percentage agreement between Teacher Observation Sheets and the backend `step_events` automated logs.
3. **AI Story Validity Rate:**  
   Proportion of AI-generated stories passing 100% of the 6 validation rules on first attempt.
4. **Hint Ladder Gradient:**  
   Track whether students' need for Level 3 hints (worked parallel example) decreases as they complete more transfers.

---

## 6. Ethical Safeguards
- Zero personal information stored on servers.
- Plain template text is always available if network fails.
- All numbers and answers are calculated deterministically in code; AI never influences mathematical truth.
