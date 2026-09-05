import sys
from pathlib import Path

# Add project root and backend to sys.path
root_dir = Path(__file__).resolve().parents[2]
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.api.router import api_router
from backend.api.health import router as health_router
from backend.db.base import Base
from backend.db.session import engine
import backend.db.models  # Ensure all models are registered

# Create database tables if not created
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Multi-Agent AI Study Preparation and Retention Calibration System"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register endpoints at both root and /api prefixes
app.include_router(health_router, prefix="", tags=["Root Health"])
app.include_router(api_router, prefix="/api")


@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "health_check": "/health",
        "docs": "/docs",
        "version": settings.APP_VERSION
    }
