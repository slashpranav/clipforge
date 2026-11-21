from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.clips import router as clips_router
from app.api.health import router as health_router
from app.api.highlights import router as highlights_router
from app.api.jobs import router as jobs_router
from app.api.projects import router as projects_router
from app.api.videos import router as videos_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(videos_router)
api_router.include_router(projects_router)
api_router.include_router(jobs_router)
api_router.include_router(highlights_router)
api_router.include_router(clips_router)
