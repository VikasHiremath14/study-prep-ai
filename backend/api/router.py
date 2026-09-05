from fastapi import APIRouter
from backend.api.health import router as health_router
from backend.api.retention import router as retention_router

api_router = APIRouter()

# Include health router
api_router.include_router(health_router, prefix="", tags=["Health"])

# Include retention & student onboarding router
api_router.include_router(retention_router, prefix="", tags=["Students & Retention"])
