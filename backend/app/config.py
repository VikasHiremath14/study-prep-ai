import os
from typing import Literal
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Agentic Study-Prep AI"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    APP_PORT: int = 8000
    FRONTEND_URL: str = "http://localhost:5173"

    # LLM Settings (gemini, claude, mock)
    LLM_PROVIDER: Literal["gemini", "claude", "mock"] = "gemini"
    LLM_API_KEY: str = ""

    # Database Configuration (PostgreSQL / Supabase + pgvector or SQLite for tests/local)
    DATABASE_URL: str = "sqlite:///./study_prep_ai.db"

    # Supabase Configuration (Optional for Cloud Auth & Direct Vector Storage)
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # ── LangSmith Tracing (course: "Integrating LangSmith for LangChain Application Tracing") ──
    # Set LANGCHAIN_TRACING_V2=true in .env to enable automatic LangSmith tracing for all chains.
    LANGCHAIN_TRACING_V2: str = "false"
    LANGCHAIN_API_KEY: str = ""
    LANGCHAIN_PROJECT: str = "StudyPrepAI"
    LANGCHAIN_ENDPOINT: str = "https://api.smith.langchain.com"

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()

# ── Propagate LangSmith env vars so LangChain SDK picks them up automatically ──
if settings.LANGCHAIN_TRACING_V2.lower() == "true":
    os.environ.setdefault("LANGCHAIN_TRACING_V2", "true")
    os.environ.setdefault("LANGCHAIN_API_KEY", settings.LANGCHAIN_API_KEY)
    os.environ.setdefault("LANGCHAIN_PROJECT", settings.LANGCHAIN_PROJECT)
    os.environ.setdefault("LANGCHAIN_ENDPOINT", settings.LANGCHAIN_ENDPOINT)

