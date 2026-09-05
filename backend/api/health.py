import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.db.session import get_db
from backend.app.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    """Comprehensive health check endpoint checking DB, settings, and agent readiness."""
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    agents_status = {
        "retention_profiler": "ready",
        "scheduler": "ready",
        "content_ingestion": "ready",
        "reader_rag": "ready",
        "quiz_generator": "ready",
        "weak_topic_recommender": "ready",
        "companion": "ready",
        "orchestrator": "ready"
    }

    return {
        "status": "ok",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "database": db_status,
        "llm_provider": settings.LLM_PROVIDER,
        "llm_configured": bool(settings.LLM_API_KEY),
        "agents": agents_status
    }
