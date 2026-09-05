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

    # Database Configuration (PostgreSQL + pgvector or SQLite for tests/local)
    DATABASE_URL: str = "sqlite:///./study_prep_ai.db"

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
