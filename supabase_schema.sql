-- ============================================================================
-- StudyPrep.AI — Supabase Cloud PostgreSQL Schema
-- Complete relational & vector schema for Student Accounts, Timetable,
-- Retention Profiles, Daily Target Completions, Notes, Bookmarks & Quizzes.
-- ============================================================================

-- 1. Enable pgvector extension for AI RAG vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ----------------------------------------------------------------------------
-- Table: users (Account Auth & Supabase Sync)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(30),
    password_hash VARCHAR(255),
    supabase_uid VARCHAR(255) UNIQUE,
    auth_provider VARCHAR(50) DEFAULT 'email', -- email, google, supabase
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_phone_verified BOOLEAN DEFAULT FALSE,
    otp_code VARCHAR(10),
    otp_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_login_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_supabase_uid ON users(supabase_uid);

-- ----------------------------------------------------------------------------
-- Table: students (Student Profile & Academic Metadata)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL DEFAULT 'Student',
    phone_number VARCHAR(30),
    grade_level VARCHAR(50) NOT NULL DEFAULT 'engineering', -- 10th, 12th, engineering, mtech
    wake_time VARCHAR(10) DEFAULT '06:30',
    sleep_time VARCHAR(10) DEFAULT '23:30',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);

-- ----------------------------------------------------------------------------
-- Table: retention_profiles (Phase 1 Neurocognitive Attention Baseline)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS retention_profiles (
    id SERIAL PRIMARY KEY,
    student_id INTEGER UNIQUE NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    retention_score FLOAT NOT NULL, -- 0.00 to 1.00
    break_interval_minutes INTEGER NOT NULL DEFAULT 45, -- 20, 30, 45, 60
    series_completion_score FLOAT DEFAULT 0.0,
    reel_watch_score FLOAT DEFAULT 0.0,
    sustained_focus_score FLOAT DEFAULT 0.0,
    self_report_score FLOAT DEFAULT 0.0,
    distraction_recovery_score FLOAT DEFAULT 0.0,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_retention_profiles_student ON retention_profiles(student_id);

-- ----------------------------------------------------------------------------
-- Table: schedules (Phase 2 Circadian Timetable & Delusion Scanner)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schedules (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    wake_time VARCHAR(10) NOT NULL,
    total_study_hours FLOAT DEFAULT 0.0,
    slots JSONB NOT NULL, -- [{start: "07:30", end: "08:15", type: "focus_slot", subject: "DSA"}]
    corrections_made JSONB, -- [{type: "sleep_buffer_enforced", explanation: "..."}]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_schedules_student ON schedules(student_id);

-- ----------------------------------------------------------------------------
-- Table: documents (Phase 3 Academic Ingestion & Chunking)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    total_pages INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ----------------------------------------------------------------------------
-- Table: pages (Extracted Document Pages)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pages (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pages_doc_page ON pages(document_id, page_number);

-- ----------------------------------------------------------------------------
-- Table: chunks (RAG Vector Chunks with pgvector)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chunks (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    chunk_index INTEGER NOT NULL DEFAULT 0,
    chunk_text TEXT NOT NULL,
    embedding JSONB, -- Can also be altered to vector(768) if using pgvector column directly
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chunks_document ON chunks(document_id);

-- ----------------------------------------------------------------------------
-- Table: daily_targets (Phase 3 Daily Target Roadmap)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_targets (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    start_page INTEGER NOT NULL,
    end_page INTEGER NOT NULL,
    target_date TIMESTAMP WITH TIME ZONE,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_daily_targets_student_doc ON daily_targets(student_id, document_id);

-- ----------------------------------------------------------------------------
-- Table: completions (Student Task & Chapter Completion Tracking)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS completions (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    document_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
    target_id INTEGER REFERENCES daily_targets(id) ON DELETE SET NULL,
    completed_type VARCHAR(50) DEFAULT 'daily_target', -- daily_target, chapter, full_plan
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_completions_student ON completions(student_id);

-- ----------------------------------------------------------------------------
-- Table: doubts_log (Phase 4 In-App AI Tutor Doubts)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS doubts_log (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    selected_text TEXT,
    question_text TEXT NOT NULL,
    explanation TEXT,
    confidence_score FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_doubts_student_doc ON doubts_log(student_id, document_id);

-- ----------------------------------------------------------------------------
-- Table: notes (Phase 4 Highlights, Margin Notes & Bookmarks)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    selected_text TEXT,
    note_text TEXT,
    is_bookmark BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notes_student_doc ON notes(student_id, document_id);

-- ----------------------------------------------------------------------------
-- Table: quizzes (Phase 5 & 6 Anti-Web Search Recall Quizzes)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quizzes (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    quiz_type VARCHAR(50) DEFAULT 'daily', -- daily, chapter, comprehensive
    page_start INTEGER,
    page_end INTEGER,
    questions JSONB NOT NULL, -- [{question, options, answer_index, explanation}]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quizzes_document ON quizzes(document_id);

-- ----------------------------------------------------------------------------
-- Table: quiz_attempts (Student Quiz Submissions & Mastery Scores)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    score FLOAT NOT NULL,
    total_questions INTEGER NOT NULL,
    student_answers JSONB,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student ON quiz_attempts(student_id);

-- ----------------------------------------------------------------------------
-- Table: companion_persona & companion_messages (Character Companion Agent)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS companion_persona (
    id SERIAL PRIMARY KEY,
    student_id INTEGER UNIQUE NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    character_name VARCHAR(100) NOT NULL DEFAULT 'Aristotle',
    source_title VARCHAR(150) DEFAULT 'Classical Philosophy',
    tone_description TEXT,
    archetype VARCHAR(50) DEFAULT 'cheerful_mentor',
    color_theme VARCHAR(50) DEFAULT 'emerald',
    avatar_style VARCHAR(50) DEFAULT 'bot',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS companion_messages (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    trigger_type VARCHAR(50) NOT NULL,
    message_text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS backlog (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    slot_info JSONB NOT NULL,
    reason VARCHAR(255),
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- Schema initialization complete.
-- ============================================================================
