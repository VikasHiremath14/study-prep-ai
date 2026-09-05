# Study-Prep AI — Agentic Adaptive Study System

An intelligent multi-agent study preparation system that profiles student retention, calibrates personalized study schedules, ingests academic content into RAG vector storage, resolves student doubts, generates anti-Web Search active-recall quizzes, detects weak topics, and keeps students motivated with a persona-driven companion agent.

---

## 🤖 System Agents Architecture

| Agent | Responsibility | Core Mechanism |
| :--- | :--- | :--- |
| **1. Retention Profiler** | Measures focus endurance & break intervals | Multi-signal behavioral scoring (series completion, reel-scroll test, sustained-focus mini-task, distraction recovery, study habits) |
| **2. Timetable Correction Agent** | Calibrates realistic, non-delusional schedules | Deterministic rules engine enforcing wake buffers, break intervals, and grade-level caps |
| **3. Content Ingestion & Embeddings** | Parses and vectors course material | Document chunking, pgvector embeddings, and retention-adjusted daily page targeting |
| **4. In-App Reader & RAG Engine** | Distraction-free study interface & grounded QA | Reader UI with page-scoped similarity search and grade-calibrated explanations |
| **5. Anti-Web Search Quiz Generator** | Active recall verification | Passage-specific question synthesis weighting annotated & high-doubt sections |
| **6. Weak-Topic Recommender** | Target reinforcement suggestions | Multi-factor weakness scoring combining quiz errors, doubt frequency, and note density |
| **7. Character Companion Agent** | Motivation, nudge delivery & backlog handling | Persona-styled original nudges, break activity suggestions, missed-session recovery |
| **8. Orchestrator Agent** | Unified daily & monthly study roadmap | Dynamic session prioritization: backlog recovery → daily target → weak-topic reinforcement |

---

## 📁 Phase Directory Structure
All frontend components and backend agents are organized by phase. See [`PHASES_STRUCTURE.md`](file:///Users/vikash/Desktop/AGENTIC%20AI%20PROJECT/PHASES_STRUCTURE.md) for full architectural mappings:
- **Phase 0:** `frontend/src/components/phase_0_auth_setup/` (Auth, Profile setup, Shell)
- **Phase 1:** `frontend/src/components/phase_1_retention_profiler/` (SART & retention battery) & `backend/agents/retention_profiler.py`
- **Phase 2:** `frontend/src/components/phase_2_circadian_scheduler/` (Circadian Timetable) & `backend/agents/timetable_corrector.py`
- **Phase 3:** `frontend/src/components/phase_3_content_ingestion/` (Content Ingestion) & `backend/agents/content_ingestion.py`
- **Phase 4:** `frontend/src/components/phase_4_active_reader/` (Active Reader, Lens, References) & `backend/agents/qa_tutor.py`
- **Phase 5 & 6:** `frontend/src/components/phase_5_6_anti_web_search_mastery/` (Anti-Web Search & Feynman) & `backend/agents/quiz_generator.py`

---

## 🛠️ Tech Stack

- **Backend:** FastAPI (Python 3.9+), SQLAlchemy 2.0, Alembic, Pydantic v2
- **Vector Database:** PostgreSQL with `pgvector`
- **LLM / Embeddings:** Unified provider abstraction supporting Google Gemini Flash & Claude Haiku
- **Frontend:** React + Vite, Modern CSS Design System (Glassmorphic, Dark-first, Responsive)
- **Testing & CI:** Pytest, GitHub Actions

---

## 🚀 Getting Started

### 1. Environment Setup
Copy `.env.example` to `.env` and fill in your keys:
```bash
cp .env.example .env
```

### 2. Backend Setup
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Running Tests
```bash
cd backend
pytest tests -v
```
>>>>>>> 49b6ed0 (feat: Initial commit - Phase 0 skeleton and Phase 1 Retention Profiler Agent)
