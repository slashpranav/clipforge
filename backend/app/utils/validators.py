import re
from pathlib import Path
from typing import Optional, Tuple
from app.config import settings
from app.core.errors import AppError

YOUTUBE_URL_REGEX = re.compile(
    r"^(https?://)?(www\.)?(youtube\.com/(watch\?v=|shorts/|embed/|live/)|youtu\.be/)([\w\-]{11})",
    re.IGNORECASE,
)


def validate_youtube_url(url: str) -> Tuple[str, str]:
    """
    Validate a YouTube URL and extract its canonical 11-character video ID.
    Returns (video_id, canonical_url).
    Does NOT download any media.
    """
    cleaned = (url or "").strip()
    if not cleaned:
        raise AppError(code="INVALID_URL", message="YouTube URL cannot be empty.", status_code=422)

    match = YOUTUBE_URL_REGEX.search(cleaned)
    if not match:
        raise AppError(
            code="INVALID_YOUTUBE_URL",
            message="Invalid YouTube URL format. Supported formats: youtube.com/watch?v=..., youtu.be/..., youtube.com/shorts/...",
            status_code=422,
        )
    video_id = match.group(5)
    canonical = f"https://www.youtube.com/watch?v={video_id}"
    return video_id, canonical


def validate_video_file_extension(filename: str) -> str:
    """Validate that the uploaded video filename has a supported extension."""
    ext = Path(filename or "").suffix.lower()
    if ext not in settings.allowed_extensions_set:
        raise AppError(
            code="UNSUPPORTED_MEDIA_TYPE",
            message=f"File extension '{ext}' is not permitted. Allowed extensions: {settings.allowed_video_extensions}",
            status_code=415,
        )
    return ext


def validate_file_size_limit(size_bytes: int) -> None:
    """Enforce maximum upload file size."""
    max_bytes = settings.max_upload_mb * 1024 * 1024
    if size_bytes > max_bytes:
        raise AppError(
            code="FILE_TOO_LARGE",
            message=f"File size exceeds the configured maximum limit of {settings.max_upload_mb} MB.",
            status_code=413,
        )
