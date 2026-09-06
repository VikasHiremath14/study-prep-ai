from fastapi import APIRouter
from backend.api.health import router as health_router
from backend.api.auth import router as auth_router
from backend.api.retention import router as retention_router
from backend.api.scheduler import router as scheduler_router
from backend.api.documents import router as documents_router
from backend.api.reader import router as reader_router
from backend.api.quiz import router as quiz_router

api_router = APIRouter()

# Include health router
api_router.include_router(health_router, prefix="", tags=["Health"])

# Include auth & user accounts router
api_router.include_router(auth_router, prefix="", tags=["Authentication & User Records"])

# Include retention & student onboarding router
api_router.include_router(retention_router, prefix="", tags=["Students & Retention"])

# Include scheduler & timetable calibration router
api_router.include_router(scheduler_router, prefix="", tags=["Timetable & Scheduling"])

# Include documents & RAG ingestion router (Phase 3)
api_router.include_router(documents_router, prefix="", tags=["Academic Documents & Ingestion"])

# Include reader & line-level QA tutor router (Phase 4 & 5)
api_router.include_router(reader_router, prefix="", tags=["Active Document Reader & QA Tutor"])

# Include Anti-Web Search Active Recall Quizzes router (Phase 5 & 6)
api_router.include_router(quiz_router, prefix="", tags=["Anti-Web Search Active Recall Quizzes"])


