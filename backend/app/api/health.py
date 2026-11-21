from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.database.session import get_db
from app.processors.ffmpeg import check_ffmpeg_availability

router = APIRouter(tags=["Health"])


@router.get("/health")
def health_check():
    """Liveness probe."""
    return {
        "status": "healthy",
        "app_name": settings.app_name,
        "environment": settings.app_env,
    }


@router.get("/health/ready")
def readiness_check(db: Annotated[Session, Depends(get_db)]):
    """
    Readiness probe: validates database connectivity and FFmpeg availability.
    Does NOT load heavy AI models.
    """
    # 1. Database check
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    # 2. FFmpeg check
    ffmpeg_ok, ffmpeg_info = check_ffmpeg_availability()

    overall_ready = db_ok and ffmpeg_ok
    return {
        "status": "ready" if overall_ready else "not_ready",
        "database_connected": db_ok,
        "ffmpeg_available": ffmpeg_ok,
        "ffmpeg_version": ffmpeg_info if ffmpeg_ok else "Not found",
        "cpu_mode": True,
        "whisper_configured_model": settings.whisper_model,
    }
