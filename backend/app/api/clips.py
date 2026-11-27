from typing import Annotated, List
from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_current_user_for_media
from app.core.errors import AppError, ForbiddenError, NotFoundError
from app.database.models.clip import Clip
from app.database.models.project import Project
from app.database.models.user import User
from app.database.session import get_db
from app.schemas.clip import (
    ClipAssetResponse,
    ClipGenerateRequest,
    ClipResponse,
    ClipSubtitlesRequest,
    ClipTranslateRequest,
    ClipVoiceRequest,
)
from app.services.cleanup_service import CleanupService
from app.services.clip_service import ClipService
from app.utils.paths import resolve_safe_path

router = APIRouter(tags=["Clips"])


@router.post("/clips/generate", response_model=List[ClipResponse], status_code=201)
def generate_clips(
    req: ClipGenerateRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Render 9:16 vertical MP4 shorts from selected highlights."""
    project = db.query(Project).filter(Project.id == req.project_id).first()
    if not project:
        raise NotFoundError("Project", req.project_id)
    if project.user_id != current_user.id:
        raise ForbiddenError()

    clips = ClipService.render_clips_for_project(
        db=db,
        project_id=req.project_id,
        highlight_ids=req.highlight_ids,
        output_width=req.output_width or 1080,
        output_height=req.output_height or 1920,
        fps=req.fps or 30,
        smart_crop=req.smart_crop if req.smart_crop is not None else True,
        burn_subtitles=req.burn_subtitles if req.burn_subtitles is not None else True,
    )
    return [ClipService.to_response(c) for c in clips]


@router.get("/clips/{clip_id}", response_model=ClipResponse)
def get_clip_details(
    clip_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Retrieve details for a single clip. Enforces ownership."""
    clip = db.query(Clip).filter(Clip.id == clip_id).first()
    if not clip:
        raise NotFoundError("Clip", clip_id)

    project = db.query(Project).filter(Project.id == clip.project_id).first()
    if not project or project.user_id != current_user.id:
        raise ForbiddenError()

    return ClipService.to_response(clip)


@router.get("/projects/{project_id}/clips", response_model=List[ClipResponse])
@router.get("/clips/project/{project_id}", response_model=List[ClipResponse])
def list_project_clips(
    project_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """List all generated clips for a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise NotFoundError("Project", project_id)
    if project.user_id != current_user.id:
        raise ForbiddenError()

    clips = db.query(Clip).filter(Clip.project_id == project_id).order_by(Clip.created_at.desc()).all()
    return [ClipService.to_response(c) for c in clips]


@router.get("/clips/{clip_id}/subtitles")
def get_clip_subtitle_file(
    clip_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user_for_media)],
    format: str = "srt",
):
    """Serve subtitle track (SRT or VTT) directly for download or video player."""
    clip = db.query(Clip).filter(Clip.id == clip_id).first()
    if not clip:
        raise NotFoundError("Clip", clip_id)

    project = db.query(Project).filter(Project.id == clip.project_id).first()
    if not project or project.user_id != current_user.id:
        raise ForbiddenError()

    abs_path = resolve_safe_path(clip.file_path)
    sub_fmt = "vtt" if format.lower() == "vtt" else "srt"
    sub_file = abs_path.with_suffix(f".{sub_fmt}")
    if not sub_file.exists():
        raise NotFoundError(f"Subtitle file ({sub_fmt})", clip_id)

    media_type = "text/vtt" if sub_fmt == "vtt" else "text/plain"
    return FileResponse(
        path=str(sub_file),
        media_type=media_type,
        filename=f"subtitles_{clip_id[:8]}.{sub_fmt}",
    )


@router.get("/clips/{clip_id}/download")
def download_clip_file(
    clip_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user_for_media)],
):
    """Authorized download of rendered MP4 Short with proper Content-Disposition."""
    clip = db.query(Clip).filter(Clip.id == clip_id).first()
    if not clip:
        raise NotFoundError("Clip", clip_id)

    project = db.query(Project).filter(Project.id == clip.project_id).first()
    if not project or project.user_id != current_user.id:
        raise ForbiddenError()

    abs_path = resolve_safe_path(clip.file_path)
    if not abs_path.exists():
        raise NotFoundError("Clip file on disk", clip_id)

    clean_filename = f"clip_{clip_id[:8]}_9x16.mp4"
    return FileResponse(
        path=str(abs_path),
        media_type="video/mp4",
        filename=clean_filename,
    )


@router.delete("/clips/{clip_id}")
def delete_clip(
    clip_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Delete a clip and its media files. Enforces ownership."""
    clip = db.query(Clip).filter(Clip.id == clip_id).first()
    if not clip:
        raise NotFoundError("Clip", clip_id)

    project = db.query(Project).filter(Project.id == clip.project_id).first()
    if not project or project.user_id != current_user.id:
        raise ForbiddenError()

    CleanupService.delete_file_safely(clip.file_path)
    if clip.thumbnail_path:
        CleanupService.delete_file_safely(clip.thumbnail_path)

    db.delete(clip)
    db.commit()
    return {"message": f"Clip '{clip_id}' deleted successfully."}


@router.post("/clips/{clip_id}/subtitles")
def produce_clip_subtitles(
    clip_id: str,
    req: ClipSubtitlesRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Produce SRT/VTT subtitle tracks for a clip."""
    clip = db.query(Clip).filter(Clip.id == clip_id).first()
    if not clip:
        raise NotFoundError("Clip", clip_id)

    project = db.query(Project).filter(Project.id == clip.project_id).first()
    if not project or project.user_id != current_user.id:
        raise ForbiddenError()

    abs_path = resolve_safe_path(clip.file_path)
    sub_file = abs_path.with_suffix(f".{req.format}")
    return {
        "clip_id": clip.id,
        "format": req.format,
        "available": sub_file.exists(),
        "download_url": f"/api/v1/clips/{clip.id}/download",
    }


@router.post("/clips/{clip_id}/translate")
def translate_clip_subtitles(
    clip_id: str,
    req: ClipTranslateRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Optional translation hook for clip subtitles."""
    clip = db.query(Clip).filter(Clip.id == clip_id).first()
    if not clip:
        raise NotFoundError("Clip", clip_id)
    return {"clip_id": clip.id, "target_language": req.target_language, "status": "translation_ready"}


@router.post("/clips/{clip_id}/voice")
def synthesize_clip_voice(
    clip_id: str,
    req: ClipVoiceRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Optional voice dubbing job hook."""
    clip = db.query(Clip).filter(Clip.id == clip_id).first()
    if not clip:
        raise NotFoundError("Clip", clip_id)
    return {"clip_id": clip.id, "voice_model": req.voice_model, "status": "voice_queued"}


@router.get("/clips/{clip_id}/assets", response_model=ClipAssetResponse)
def get_clip_assets(
    clip_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Inspect all generated media assets for a clip."""
    clip = db.query(Clip).filter(Clip.id == clip_id).first()
    if not clip:
        raise NotFoundError("Clip", clip_id)

    project = db.query(Project).filter(Project.id == clip.project_id).first()
    if not project or project.user_id != current_user.id:
        raise ForbiddenError()

    clip_file = resolve_safe_path(clip.file_path)
    thumb_file = resolve_safe_path(clip.thumbnail_path) if clip.thumbnail_path else None
    srt_file = clip_file.with_suffix(".srt")
    vtt_file = clip_file.with_suffix(".vtt")

    return ClipAssetResponse(
        clip_id=clip.id,
        video_available=clip_file.exists(),
        thumbnail_available=bool(thumb_file and thumb_file.exists()),
        srt_available=srt_file.exists(),
        vtt_available=vtt_file.exists(),
        download_url=f"/api/v1/clips/{clip.id}/download",
        srt_url=f"/api/v1/clips/{clip.id}/subtitles?format=srt" if srt_file.exists() else None,
        vtt_url=f"/api/v1/clips/{clip.id}/subtitles?format=vtt" if vtt_file.exists() else None,
    )
