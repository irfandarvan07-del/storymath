# StoryMath: Same Maths, Different Story

> **A bilingual, diagnostic mathematics platform for Classes 5–7 that decouples mathematical schemas from surface narratives to pinpoint and remediate learning bottlenecks.**

[![Live Web App](https://img.shields.io/badge/Live_App-storymath--six.vercel.app-blue?style=for-the-badge&logo=vercel)](https://storymath-six.vercel.app/)
[![Frontend](https://img.shields.io/badge/Frontend-React_18_+_TypeScript_+_Vite-61DAFB?style=for-the-badge&logo=react)](frontend/)
[![Backend](https://img.shields.io/badge/Backend-FastAPI_+_Python_3.11-009688?style=for-the-badge&logo=fastapi)](backend/)
[![Database](https://img.shields.io/badge/Database-Supabase_PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](backend/migrations/)
[![AI Engine](https://img.shields.io/badge/AI_Copilot-Google_Gemini-4285F4?style=for-the-badge&logo=google)](backend/app/engine/)

---

## 📌 Executive Summary

* **Project Name**: StoryMath
* **Team**: Edvance (RV College of Engineering, Bengaluru)
* **Team Members**: Stuthi Mathapati (Lead), MD Irfan Darvan, Jahnavi P, Rishab Dhruv
* **Hackathon Qualifier**: Craft N Code Karnataka 2026 (IIIT Bhubaneswar National Hackathon)
* **Deployed App**: [https://storymath-six.vercel.app/](https://storymath-six.vercel.app/)

---

## 🚨 The Problem & Real-World Evidence

When a middle school student gets a word problem wrong, traditional grading merely scores it as **0/1**. It gives the teacher **zero visibility** into *where* the child broke down:
- Did they misread the English or Kannada sentence?
- Did they fail to distinguish what was *given* from what was *asked*?
- Did they choose the wrong arithmetic operation?
- Did they slip on a simple multiplication or division calculation?

Furthermore, when the context of a problem changes (e.g. from sharing apples to distributing books), students perceive it as an entirely new problem because they memorize superficial keywords rather than internalizing the structural mathematics.

### Verified Baseline Statistics
| Number | Indicator | Source |
|---|---|---|
| **19.0%** | Class 5 students in Karnataka government schools who can solve a basic division word problem | **ASER 2024** |
| **30.7%** | National rural average for Class 5 division competency | **ASER 2024** |
| **46.0%** | National average mathematics score for Class 6 | **PARAKH 2024 (NCERT)** |
| **53.0%** | Class 6 students who know tables up to 10 and can apply basic operations to everyday situations | **PARAKH 2024 (NCERT)** |

---

## 💡 The Core Innovation: "Same Maths, Different Story"

Every mathematical word problem has an underlying **mathematical structure (schema)** wrapped in a narrative context. StoryMath **holds the schema invariant while varying the narrative**, teaching children to see the structural mathematics regardless of whether the story is about Channapatna wooden toys, Mysuru Pak sweets, Bengaluru Metro tokens, or ISRO satellite launches.

### Supported Mathematical Schemas
1. **Equal Sharing** ($A \div B = C$ with concrete groupings)
2. **Equal Groups** ($A \times B = C$ repeated addition schemas)
3. **Difference Comparison** ($A - B = \Delta$ additive comparisons)
4. **Unit Rate** (Cost/distance per unit and multi-step scaling)
5. **Fraction of a Quantity** ($\frac{a}{b} \times Q$ part-whole relations)
6. **Perimeter & Area** (Geometric boundary vs spatial coverage)

---

## 🔄 The 5-Step Diagnostic Solve Flow

Students proceed through a 5-step cognitive scaffold designed to catch and log mistakes at the exact stage they occur:

```
[ Step 1: Read Story ] ──> [ Step 2: Given vs Asked ] ──> [ Step 3: Interactive Visual Model ]
                                                                     │
[ Step 5: Transfer Problem ] <── [ Step 4: Mathematical Calculation ] ┘
```

1. **Step 1: Read & Comprehend (Bilingual)**
   - Short, engaging stories set in Karnataka contexts (available in English & ಕನ್ನಡ).
2. **Step 2: Fact Extraction (Given vs Asked)**
   - Interactive chips where students identify what information is provided and what quantity needs to be calculated.
3. **Step 3: Visual Representation (Bar Model / Grid / Number Line)**
   - Students physically construct the problem structure using dynamic visual bars, building conceptual intuition before writing formulas.
4. **Step 4: Formulation & Deterministic Calculation**
   - Choosing the arithmetic operation and calculating the answer, validated server-side by our deterministic Python engine.
5. **Step 5: Invariance & Transfer Problem**
   - The student is immediately presented with an identical mathematical schema in an entirely different context to verify conceptual retention.

---

## 👩‍🏫 Teacher Portal & Gemini AI Pedagogical Copilot

StoryMath includes a specialized analytics dashboard designed for educators:

- **Cohort Failure Heatmap**: Visualizes the percentage of students failing at each specific step (e.g., *72% struggle at Step 2 Fact Extraction, not at Step 4 Arithmetic*).
- **Stuck Student Clusters**: Identifies students with recurrent patterns of schema confusion.
- **Gemini AI Pedagogical Copilot**: Generates ready-to-use, tailored **40-minute remediation lesson plans** containing physical manipulative activities, targeted questions, and blackboard sketches based on real classroom data.
- **Audit Logging**: Every teacher query, cohort export, and login event is logged directly in Supabase for transparency.

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────┐
│             Frontend (Vite + React 18 + TS)            │
│  - 5-Step Interactive Solve Flow                       │
│  - Dynamic Bar Models & Interactive Visual Manipulatives│
│  - Student Verified Registration & Class Code Locking  │
│  - Single Authorized Teacher Analytics Dashboard       │
└───────────────────────────┬────────────────────────────┘
                            │ REST API / JSON
┌───────────────────────────▼────────────────────────────┐
│              Backend (FastAPI + Python 3.11)           │
│  - Deterministic Math Verification Engine (Zero Halluc.)│
│  - Combinatorial YAML Template Generator                │
│  - Secure Password Hashing (SHA256 with Salts)         │
│  - Gemini AI Pedagogical Copilot Integration           │
└───────────────────────────┬────────────────────────────┘
                            │ PostgreSQL (psycopg2) / SQLite
┌───────────────────────────▼────────────────────────────┐
│              Database (Supabase PostgreSQL)            │
│  - teacher_accounts  - student_users  - classes        │
│  - students          - attempts       - step_events    │
│  - teacher_logs                                        │
└────────────────────────────────────────────────────────┘
```

---

## 🤖 Data & AI Architecture

1. **Deterministic Mathematics Engine (Python)**:
   - **No LLM hallucinations in math calculations**: All arithmetic evaluation, formula validation, and numerical checks run deterministically on the server.
2. **Combinatorial Synthetic Problem Templates**:
   - YAML-defined templates with customizable ranges, variables, and bilingual story patterns localized to Karnataka districts.
3. **Google Gemini AI Pedagogical Copilot**:
   - Analyzes aggregated student attempt logs and generates targeted remedial lesson plans and teacher guidance notes.

---

## 🔒 Security & Data Integrity

- **Zero Local Password Storage**: Neither student nor teacher passwords or hashed credentials are ever saved in browser `localStorage` or `sessionStorage`.
- **Server-Side Validation**: All credentials and session profiles are verified against **Supabase PostgreSQL**.
- **Class Code Locking**: Students can only register and log in to classes matching their verified school enrollment (e.g., `CLASS-4C`).
- **Protected Teacher Access**: Authorized single-portal teacher login verified against hashed database credentials.

---

## 🚀 Getting Started (Run Locally)

### Prerequisites
- Node.js (v18+) & npm
- Python (v3.10+) & pip
- (Optional) Supabase account for cloud database, or runs out-of-the-box with local SQLite

---

### 1. Clone Repository

```bash
git clone https://github.com/irfandarvan07-del/storymath.git
cd storymath
```

---

### 2. Backend Setup (FastAPI)

```bash
cd backend

# Create virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables (optional: defaults to local SQLite)
cp .env.example .env

# Run development server
uvicorn app.main:app --reload --port 8000
```
Backend API interactive documentation is available at: `http://localhost:8000/docs`

---

### 3. Frontend Setup (React + Vite)

In a new terminal window:

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Open your browser at: `http://localhost:5173`

---

### 4. Supabase Setup (Production Database)

If using Supabase PostgreSQL:
1. In your **Supabase Dashboard**, open the **SQL Editor**.
2. Run the migration script in [`backend/migrations/create_teacher_accounts.sql`](backend/migrations/create_teacher_accounts.sql):
   ```sql
   CREATE TABLE IF NOT EXISTS teacher_accounts (
       id          SERIAL PRIMARY KEY,
       username    VARCHAR(100) UNIQUE NOT NULL,
       password_hash VARCHAR(255) NOT NULL,
       created_at  TIMESTAMPTZ DEFAULT NOW()
   );

   INSERT INTO teacher_accounts (username, password_hash)
   VALUES (
       'TEACHER',
       '50592e9da4a615980399ebc2448430b383a8741421482b1792571a10c26c62e6'
   )
   ON CONFLICT (username) DO NOTHING;
   ```
3. Set your connection string in `backend/.env`:
   ```env
   DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
   ```

---

## 🛠️ Open Source & AI Disclosures

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Canvas-Confetti
- **Backend**: FastAPI, Uvicorn, SQLAlchemy 2.0, Pydantic v2, PyYAML, Psycopg2-binary
- **AI**: Google Gemini API for pedagogical analysis and remedial lesson plan synthesis
- **AI Assistance**: Development accelerated using Google Antigravity IDE (Gemini 2.5 / Claude 3.7) for code refactoring and scaffolding

---

## 🔮 Limitations & Future Roadmap

1. **Kannada Audio Narration & Speech Input**: Adding text-to-speech and speech recognition for students with verbal math reasoning who struggle with written reading comprehension.
2. **Offline-First PWA Mode**: Enabling local browser caching with background sync for rural schools with intermittent internet access.
3. **DIKSHA / Samagra Shiksha Karnataka Alignment**: Mapping the 6 diagnostic schemas directly to Karnataka State Board textbook chapters and Student Learning Outcomes (SLOs).
4. **SMS / WhatsApp Remediation Sheets**: Delivering 1-page printable remedial activity sheets to teachers on low-bandwidth connections.

---

## 👥 The Team (Edvance - RV College of Engineering)

* **Stuthi Mathapati** — Team Lead & Pedagogical Systems
* **MD Irfan Darvan** — Fullstack Architecture & Database Security
* **Jahnavi P** — Frontend Engineering & Interactive Visual Models
* **Rishab Dhruv** — Mathematical Engine & AI Integration

*Organised by RV College of Engineering and RVITM for Craft N Code Karnataka 2026.*
