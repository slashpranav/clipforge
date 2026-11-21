import shutil
import uuid
from pathlib import Path
from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.database.models.video import Video
from app.services.metadata_service import MetadataService
from app.utils.paths import get_user_upload_dir
from app.utils.validators import validate_file_size_limit, validate_video_file_extension


class UploadService:
    @staticmethod
    async def process_video_upload(
        db: Session,
        user_id: str,
        upload_file: UploadFile,
    ) -> Video:
        """Handle multipart video upload, validate extension/size/format, and store metadata."""
        original_name = upload_file.filename or "video.mp4"
        ext = validate_video_file_extension(original_name)

        video_id = str(uuid.uuid4())
        upload_dir = get_user_upload_dir(user_id, video_id)
        stored_name = f"source{ext}"
        destination_path = upload_dir / stored_name

        # Stream chunks to disk and calculate size
        total_bytes = 0
        try:
            with open(destination_path, "wb") as f_out:
                while True:
                    chunk = await upload_file.read(1024 * 1024)  # 1MB buffer
                    if not chunk:
                        break
                    total_bytes += len(chunk)
                    validate_file_size_limit(total_bytes)
                    f_out.write(chunk)
        except Exception as exc:
            # Clean up on failure
            if destination_path.exists():
                destination_path.unlink(missing_ok=True)
            if isinstance(exc, AppError):
                raise exc
            raise AppError(code="UPLOAD_FAILED", message=f"Failed to save upload: {exc}", status_code=500)

        # Inspect and validate format/codec with FFprobe
        meta = MetadataService.extract_and_validate_video(destination_path)

        # Store relative file path for database
        rel_path = destination_path.relative_to(destination_path.parents[3]).as_posix()

        video = Video(
            id=video_id,
            user_id=user_id,
            source_type="upload",
            original_filename=original_name,
            stored_filename=stored_name,
            file_path=rel_path,
            mime_type=upload_file.content_type or f"video/{ext.lstrip('.')}",
            size_bytes=total_bytes,
            duration_seconds=meta["duration_seconds"],
            width=meta["width"],
            height=meta["height"],
            fps=meta["fps"],
            audio_present=meta["audio_present"],
            status="ready",
        )
        db.add(video)
        db.commit()
        db.refresh(video)
        return video
