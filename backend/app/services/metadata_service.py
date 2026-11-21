from pathlib import Path
from typing import Any, Dict
from app.config import settings
from app.core.errors import AppError
from app.processors.ffmpeg import probe_media_file


class MetadataService:
    @staticmethod
    def extract_and_validate_video(file_path: Path) -> Dict[str, Any]:
        """Probe video with FFprobe and validate maximum duration and codec properties."""
        meta = probe_media_file(file_path)
        duration = meta.get("duration_seconds", 0.0)

        if duration > settings.max_video_duration_seconds:
            raise AppError(
                code="VIDEO_TOO_LONG",
                message=f"Video duration ({duration:.1f}s) exceeds the maximum allowed limit of {settings.max_video_duration_seconds}s.",
                status_code=422,
            )

        if meta.get("width", 0) <= 0 or meta.get("height", 0) <= 0:
            raise AppError(
                code="INVALID_VIDEO_DIMENSIONS",
                message="Uploaded file does not contain a valid decodable video stream.",
                status_code=422,
            )

        return meta
