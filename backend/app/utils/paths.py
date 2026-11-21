import os
from pathlib import Path
from typing import Union
from app.config import settings
from app.core.errors import AppError


def get_storage_root() -> Path:
    """Return the absolute Path to the configured storage root, ensuring it exists."""
    root = settings.storage_path
    root.mkdir(parents=True, exist_ok=True)
    return root


def ensure_storage_subdirs() -> None:
    """Ensure all required storage subdirectories exist."""
    root = get_storage_root()
    subdirs = ["uploads", "work", "audio", "frames", "transcripts", "clips", "thumbnails"]
    for sub in subdirs:
        (root / sub).mkdir(parents=True, exist_ok=True)


def resolve_safe_path(relative_or_absolute: Union[str, Path]) -> Path:
    """
    Resolve path and strictly ensure it is contained within the STORAGE_ROOT directory.
    Prevents path traversal attacks (e.g. '../..').
    """
    root = get_storage_root().resolve()
    target = Path(relative_or_absolute)
    if not target.is_absolute():
        target = (root / target).resolve()
    else:
        target = target.resolve()

    try:
        # Raises ValueError if target is not relative to root
        target.relative_to(root)
    except ValueError:
        raise AppError(
            code="UNSAFE_PATH",
            message="Access denied: file path is outside the allowed storage directory.",
            status_code=403,
        )
    return target


def get_user_upload_dir(user_id: str, video_id: str) -> Path:
    """Return isolated directory for a user video upload."""
    root = get_storage_root()
    dest = root / "uploads" / user_id / video_id
    dest.mkdir(parents=True, exist_ok=True)
    return dest


def get_job_work_dir(job_id: str) -> Path:
    """Return isolated working directory for a job."""
    root = get_storage_root()
    dest = root / "work" / job_id
    dest.mkdir(parents=True, exist_ok=True)
    return dest
