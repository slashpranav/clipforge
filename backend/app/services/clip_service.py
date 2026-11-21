import json
import uuid
from pathlib import Path
from typing import List, Optional
from sqlalchemy.orm import Session

from app.core.errors import AppError, NotFoundError
from app.database.models.clip import Clip
from app.database.models.highlight import Highlight
from app.database.models.project import Project
from app.database.models.video import Video
from app.processors.face_tracking import track_faces_in_interval
from app.processors.renderer import render_short_clip
from app.schemas.clip import ClipResponse
from app.services.subtitle_service import SubtitleService
from app.utils.paths import get_storage_root, resolve_safe_path


class ClipService:
    @staticmethod
    def render_clips_for_project(
        db: Session,
        project_id: str,
        highlight_ids: Optional[List[str]] = None,
        output_width: int = 1080,
        output_height: int = 1920,
        fps: int = 30,
        smart_crop: bool = True,
        burn_subtitles: bool = True,
    ) -> List[Clip]:
        """
        Render 9:16 vertical MP4 shorts for designated or selected highlights.
        """
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise NotFoundError("Project", project_id)

        video = db.query(Video).filter(Video.id == project.video_id).first()
        if not video:
            raise NotFoundError("Video", project.video_id)

        source_abs = resolve_safe_path(video.file_path)

        # Determine target highlights
        q = db.query(Highlight).filter(Highlight.project_id == project_id)
        if highlight_ids:
            q = q.filter(Highlight.id.in_(highlight_ids))
        else:
            q = q.filter(Highlight.selected.is_(True))

        target_highlights = q.all()
        if not target_highlights:
            # Fallback to top highlight
            target_highlights = (
                db.query(Highlight)
                .filter(Highlight.project_id == project_id)
                .order_by(Highlight.score.desc())
                .limit(1)
                .all()
            )

        storage_root = get_storage_root()
        rendered_clips: List[Clip] = []

        for h in target_highlights:
            clip_id = str(uuid.uuid4())
            clip_dest = storage_root / "clips" / project_id / f"{clip_id}.mp4"
            thumb_dest = storage_root / "thumbnails" / f"{clip_id}.jpg"

            # 1. Track faces if smart crop enabled
            face_track_info = None
            if smart_crop:
                face_track_info = track_faces_in_interval(source_abs, h.start_seconds, h.end_seconds)

            # 2. Extract subtitle cues
            cues = SubtitleService.extract_cues_for_interval(db, video.id, h.start_seconds, h.end_seconds)

            # 3. Render MP4
            res = render_short_clip(
                source_video_path=source_abs,
                output_clip_path=clip_dest,
                thumbnail_path=thumb_dest,
                start_seconds=h.start_seconds,
                end_seconds=h.end_seconds,
                output_width=output_width,
                output_height=output_height,
                fps=fps,
                smart_crop=smart_crop,
                face_track_info=face_track_info,
                cues=cues,
                burn_subtitles=burn_subtitles,
            )

            rel_clip_path = clip_dest.relative_to(storage_root).as_posix()
            rel_thumb_path = thumb_dest.relative_to(storage_root).as_posix() if thumb_dest.exists() else None

            clip_record = Clip(
                id=clip_id,
                project_id=project_id,
                highlight_id=h.id,
                file_path=rel_clip_path,
                thumbnail_path=rel_thumb_path,
                duration_seconds=res["duration_seconds"],
                width=res["width"],
                height=res["height"],
                fps=res["fps"],
                subtitle_language="auto",
                status="ready",
            )
            db.add(clip_record)
            rendered_clips.append(clip_record)

        db.commit()
        for c in rendered_clips:
            db.refresh(c)
        return rendered_clips

    @staticmethod
    def to_response(clip: Clip) -> ClipResponse:
        return ClipResponse(
            id=clip.id,
            project_id=clip.project_id,
            highlight_id=clip.highlight_id,
            file_path=clip.file_path,
            thumbnail_path=clip.thumbnail_path,
            duration_seconds=clip.duration_seconds,
            width=clip.width,
            height=clip.height,
            fps=clip.fps,
            subtitle_language=clip.subtitle_language,
            status=clip.status,
            created_at=clip.created_at,
            download_url=f"/api/v1/clips/{clip.id}/download",
        )
