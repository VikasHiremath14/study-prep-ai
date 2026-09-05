import datetime
from typing import List, Optional
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from backend.db.base import Base

try:
    from pgvector.sqlalchemy import Vector
    PGVECTOR_AVAILABLE = True
except ImportError:
    PGVECTOR_AVAILABLE = False
    Vector = None


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, default="Student")
    grade_level = Column(String(50), nullable=False)  # 10th, 12th, engineering, mtech
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    retention_profile = relationship("RetentionProfile", back_populates="student", uselist=False)
    schedules = relationship("Schedule", back_populates="student")
    notes = relationship("Note", back_populates="student")
    doubts = relationship("DoubtLog", back_populates="student")
    quiz_attempts = relationship("QuizAttempt", back_populates="student")
    companion_persona = relationship("CompanionPersona", back_populates="student", uselist=False)
    companion_messages = relationship("CompanionMessage", back_populates="student")
    backlogs = relationship("Backlog", back_populates="student")
    completions = relationship("Completion", back_populates="student")


class RetentionProfile(Base):
    __tablename__ = "retention_profiles"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), unique=True, nullable=False)
    retention_score = Column(Float, nullable=False)  # 0.0 - 1.0
    break_interval_minutes = Column(Integer, nullable=False)  # e.g., 20, 30, 45, 60
    series_completion_score = Column(Float, default=0.0)
    reel_watch_score = Column(Float, default=0.0)
    sustained_focus_score = Column(Float, default=0.0)
    self_report_score = Column(Float, default=0.0)
    distraction_recovery_score = Column(Float, default=0.0)
    details = Column(JSON, nullable=True)  # breakdown payload
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="retention_profile")


class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    wake_time = Column(String(10), nullable=False)  # e.g. "06:00"
    total_study_hours = Column(Float, default=0.0)
    slots = Column(JSON, nullable=False)  # list of {start, end, type}
    corrections_made = Column(JSON, nullable=True)  # list of correction logs
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="schedules")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    filename = Column(String(255), nullable=False)
    total_pages = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    pages = relationship("Page", back_populates="document", cascade="all, delete-orphan")
    chunks = relationship("Chunk", back_populates="document", cascade="all, delete-orphan")
    daily_targets = relationship("DailyTarget", back_populates="document", cascade="all, delete-orphan")


class Page(Base):
    __tablename__ = "pages"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    page_number = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)

    document = relationship("Document", back_populates="pages")


class Chunk(Base):
    __tablename__ = "chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    page_number = Column(Integer, nullable=False)
    chunk_index = Column(Integer, nullable=False, default=0)
    chunk_text = Column(Text, nullable=False)
    # Using JSON or Vector for embeddings
    embedding = Column(JSON, nullable=True)

    document = relationship("Document", back_populates="chunks")


class DailyTarget(Base):
    __tablename__ = "daily_targets"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    day_number = Column(Integer, nullable=False)
    start_page = Column(Integer, nullable=False)
    end_page = Column(Integer, nullable=False)
    target_date = Column(DateTime, nullable=True)
    is_completed = Column(Boolean, default=False)

    document = relationship("Document", back_populates="daily_targets")


class Completion(Base):
    __tablename__ = "completions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    target_id = Column(Integer, ForeignKey("daily_targets.id"), nullable=True)
    completed_type = Column(String(50), default="daily_target")  # daily_target, chapter, full_plan
    completed_at = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="completions")


class DoubtLog(Base):
    __tablename__ = "doubts_log"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    page_number = Column(Integer, nullable=False)
    selected_text = Column(Text, nullable=True)
    question_text = Column(Text, nullable=False)
    explanation = Column(Text, nullable=True)
    confidence_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="doubts")


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    page_number = Column(Integer, nullable=False)
    selected_text = Column(Text, nullable=True)
    note_text = Column(Text, nullable=True)
    is_bookmark = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="notes")


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    quiz_type = Column(String(50), default="daily")  # daily, chapter, comprehensive
    page_start = Column(Integer, nullable=True)
    page_end = Column(Integer, nullable=True)
    questions = Column(JSON, nullable=False)  # [{question, options, answer_index, explanation}]
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    score = Column(Float, nullable=False)
    total_questions = Column(Integer, nullable=False)
    student_answers = Column(JSON, nullable=True)
    completed_at = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="quiz_attempts")


class CompanionPersona(Base):
    __tablename__ = "companion_persona"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), unique=True, nullable=False)
    character_name = Column(String(100), nullable=False)
    source_title = Column(String(150), nullable=True)
    tone_description = Column(Text, nullable=True)
    archetype = Column(String(50), default="cheerful_mentor")  # gritty_antihero, cheerful_mentor, stoic_strategist
    color_theme = Column(String(50), default="emerald")
    avatar_style = Column(String(50), default="bot")

    student = relationship("Student", back_populates="companion_persona")


class CompanionMessage(Base):
    __tablename__ = "companion_messages"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    trigger_type = Column(String(50), nullable=False)  # study_start, missed_session, break_suggestion, milestone, wrapup
    message_text = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="companion_messages")


class Backlog(Base):
    __tablename__ = "backlog"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    slot_info = Column(JSON, nullable=False)
    reason = Column(String(255), nullable=True)
    resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="backlogs")
