from typing import Annotated, List
from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.errors import ForbiddenError, NotFoundError
from app.database.models.user import User
from app.database.models.video import Video
from app.database.session import get_db
from app.schemas.video import VideoResponse, YouTubeReferenceRequest, YouTubeReferenceResponse
from app.services.cleanup_service import CleanupService
from app.services.source_service import SourceService
from app.services.upload_service import UploadService
from app.utils.paths import resolve_safe_path

router = APIRouter(prefix="/videos", tags=["Videos"])


@router.post("/upload", response_model=VideoResponse, status_code=201)
async def upload_video(
    file: Annotated[UploadFile, File(...)],
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """
    Upload an authorized video file (MP4, MOV, MKV, WebM) that you own or have permission to process.
    Inspects codecs and duration via FFprobe.
    """
    video = await UploadService.process_video_upload(db, current_user.id, file)
    return VideoResponse.model_validate(video)


@router.post("/youtube-reference", response_model=YouTubeReferenceResponse)
def submit_youtube_reference(
    req: YouTubeReferenceRequest,
    current_user: Annotated[User, Depends(get_current_user)],
):
    """
    Submit a YouTube URL for supported public metadata retrieval and embedded playback.
    In accordance with platform terms, this does NOT download or extract audiovisual streams.
    """
    return SourceService.get_youtube_metadata_reference(req.url)


@router.get("", response_model=List[VideoResponse])
def list_user_videos(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """List all uploaded videos owned by the authenticated user."""
    videos = (
        db.query(Video)
        .filter(Video.user_id == current_user.id)
        .order_by(Video.created_at.desc())
        .all()
    )
    return [VideoResponse.model_validate(v) for v in videos]


@router.get("/{video_id}", response_model=VideoResponse)
def get_video_details(
    video_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Retrieve metadata of a video. Enforces ownership."""
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise NotFoundError("Video", video_id)
    if video.user_id != current_user.id:
        raise ForbiddenError()
    return VideoResponse.model_validate(video)


@router.delete("/{video_id}")
def delete_video(
    video_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Delete a video and its physical stored files. Enforces ownership."""
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise NotFoundError("Video", video_id)
    if video.user_id != current_user.id:
        raise ForbiddenError()

    # Safely remove file on disk
    try:
        abs_path = resolve_safe_path(video.file_path)
        parent_dir = abs_path.parent
        CleanupService.delete_directory_safely(str(parent_dir))
    except Exception:
        pass

    db.delete(video)
    db.commit()
    return {"message": f"Video '{video_id}' and associated assets deleted successfully."}
