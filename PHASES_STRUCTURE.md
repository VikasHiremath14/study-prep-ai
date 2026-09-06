# StudyPrep.AI — Multi-Phase System Architecture

This document outlines the organized phase-by-phase directory structure of both frontend and backend modules for **Phases 0 through 6**.

---

## 📁 Phase Directory Structure

```
AGENTIC AI PROJECT/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── phase_0_auth_setup/                   # Phase 0: Auth & Workspace Setup
│       │   │   ├── AuthPage.jsx                      # Email & Password authentication
│       │   │   ├── ProfileSetupPage.jsx              # Student name & education level intake
│       │   │   ├── CognitiveLoader.jsx               # Periodic table science transition overlay
│       │   │   ├── BackendStatus.jsx                 # Live health & DB connection badge
│       │   │   ├── DevShortcutsBar.jsx               # Rapid jump bar across phases
│       │   │   ├── AgentMatrix.jsx                   # Multi-agent visual overview
│       │   │   └── index.js
│       │   │
│       │   ├── phase_1_retention_profiler/           # Phase 1: Neurocognitive Retention Profiler
│       │   │   ├── OnboardingWizard.jsx              # Multi-step retention assessment orchestrator
│       │   │   ├── StepStudentInfo.jsx               # Wake time & sleep schedule intake
│       │   │   ├── StepSART.jsx                      # Sustained Attention to Response Task (Go/No-Go)
│       │   │   ├── StepDigitSpan.jsx                 # Working memory capacity test
│       │   │   ├── StepDelayedRecall.jsx             # Delayed recall memory test
│       │   │   ├── StepReelSimulation.jsx            # Short-form video attention-span battery
│       │   │   ├── StepYouTubeAttention.jsx          # Lecture attention & focus retention test
│       │   │   ├── StepFocusAndDistraction.jsx       # Distraction recovery calibration
│       │   │   ├── StepSeriesHabit.jsx               # Habit consistency assessment
│       │   │   ├── StepSelfReport.jsx                # Self-reported cognitive stamina
│       │   │   ├── ProfileResults.jsx                # Final calibrated retention score breakdown
│       │   │   └── index.js
│       │   │
│       │   ├── phase_2_circadian_scheduler/          # Phase 2: Circadian Timetable & Delusion Scanner
│       │   │   ├── TimetableCorrector.jsx            # Subject requirements intake & circadian generator
│       │   │   └── index.js
│       │   │
│       │   ├── phase_3_content_ingestion/            # Phase 3: Content Ingestion & Daily Target Planner
│       │   │   ├── DocumentIngestionPage.jsx         # PDF/DOCX ingestion & retention-adjusted target planner
│       │   │   └── index.js
│       │   │
│       │   ├── phase_4_active_reader/                # Phase 4: Distraction-Free Active Reader
│       │   │   ├── DocumentReaderPage.jsx            # PDF page reader & live local clock slot sync
│       │   │   ├── LineLevelPopover.jsx              # Context-grounded line-level AI tutor
│       │   │   ├── DiagramLensModal.jsx              # Multimodal diagram, chart, & formula explainer
│       │   │   ├── PageReferencesDrawer.jsx          # Live curated YouTube lessons & web references
│       │   │   ├── ReaderNotesSidebar.jsx            # Notes, bookmarks & student doubt logs
│       │   │   ├── AntiWebSearchQuizModal.jsx        # Shared with Phase 5 & 6 Active Recall
│       │   │   └── index.js
│       │   │
│       │   └── phase_5_6_anti_web_search_mastery/    # Phase 5 & 6: Anti-Web Search Recall & Target Mastery
│       │       ├── AntiWebSearchQuizModal.jsx        # Scenario invariant MCQs + Feynman Explainer Studio
│       │       ├── AntiGoogleQuizModal.jsx           # Compatibility re-export
│       │       └── index.js
│       │
│       ├── App.jsx
│       ├── index.css
│       └── main.jsx
│
├── backend/
│   ├── agents/                                       # Multi-Agent Intelligent Core
│   │   ├── base.py                                   # Base agent contract
│   │   ├── retention_profiler.py                     # [Phase 1] Neurocognitive behavioral scorer
│   │   ├── timetable_corrector.py                    # [Phase 2] Circadian schedule rules engine
│   │   ├── content_ingestion.py                      # [Phase 3] Document chunker & target planner
│   │   ├── qa_tutor.py                               # [Phase 4] Line-level grounded explanation tutor
│   │   ├── multimodal_lens.py                        # [Phase 4] Diagram & formula vision analyzer
│   │   ├── references_curator.py                     # [Phase 4] YouTube & academic web curator
│   │   └── quiz_generator.py                         # [Phase 5 & 6] Anti-Web Search & Feynman evaluator
│   │
│   ├── api/                                          # FastAPI Route Handlers
│   │   ├── health.py                                 # System health check
│   │   ├── retention.py                              # [Phase 1] /api/retention/evaluate-profile
│   │   ├── scheduler.py                              # [Phase 2] /api/scheduler/generate-schedule
│   │   ├── documents.py                              # [Phase 3] /api/documents/upload & ingest
│   │   ├── reader.py                                 # [Phase 4] /api/reader/line-explain & lens
│   │   ├── quiz.py                                   # [Phase 5 & 6] /api/quiz/generate, submit & feynman
│   │   └── router.py                                 # Master API aggregator
│   │
│   ├── db/                                           # SQLAlchemy Models & Migrations
│   │   ├── models.py
│   │   └── session.py
│   │
│   └── tests/                                        # Pytest Verification Suite
│       ├── test_health.py
│       ├── test_retention_profiler.py                # [Phase 1] Tests
│       ├── test_scheduler.py                         # [Phase 2] Tests
│       ├── test_ingestion.py                         # [Phase 3] Tests
│       ├── test_reader.py                            # [Phase 4] Tests
│       └── test_quiz_and_multimodal.py               # [Phase 5 & 6] Tests
```

---

## 🔗 Shared Components Mapping
- `AntiWebSearchQuizModal.jsx`: Bridged between **Phase 4 (Reader)** and **Phase 5 & 6 (Anti-Web Search Recall)** so students can trigger active recall directly from the reading canvas.
- `TimetableCorrector.jsx`: Feeds selected subjects dynamically into **Phase 3 (Document Ingestion)** requirements.
