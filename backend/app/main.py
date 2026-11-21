import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.config import settings
from app.core.errors import (
    AppError,
    app_error_handler,
    generic_error_handler,
    http_error_handler,
    validation_error_handler,
)
from app.core.logging import logger
from app.database.session import init_db
from app.utils.paths import ensure_storage_subdirs
from app.workers.runner import start_worker, stop_worker


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle startup and shutdown logic."""
    logger.info("Initializing ClipForge AI application...")
    ensure_storage_subdirs()
    init_db()
    if settings.app_env != "test" and os.getenv("TESTING") != "1":
        start_worker()
    yield
    logger.info("Shutting down ClipForge AI application...")
    if settings.app_env != "test" and os.getenv("TESTING") != "1":
        stop_worker()


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Local-first AI Long-Form Video to Viral Shorts Backend. CPU-first inference, explainable highlight ranking, and 9:16 vertical MP4 rendering.",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register custom exception handlers
app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(RequestValidationError, validation_error_handler)
app.add_exception_handler(HTTPException, http_error_handler)
app.add_exception_handler(Exception, generic_error_handler)

# Mount versioned API routes
app.include_router(api_router, prefix=settings.api_prefix)
