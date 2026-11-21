import json
import shutil
import traceback
from pathlib import Path
from sqlalchemy.orm import Session

from app.ai.model_manager import ModelManager
from app.core.logging import logger
from app.database.models.job import Job
from app.database.models.project import Project
from app.database.models.video import Video
from app.database.session import SessionLocal
from app.processors.audio import calculate_audio_energy, extract_audio_to_wav
from app.processors.scenes import detect_scene_boundaries
from app.services.highlight_service import HighlightService
from app.services.transcription_service import TranscriptionService
from app.utils.paths import get_job_work_dir, resolve_safe_path
from app.workers.queue import JobQueue


def run_project_pipeline(job_id: str) -> None:
    """Execute the end-to-end staged video processing pipeline for a claimed job."""
    db: Session = SessionLocal()
    work_dir = get_job_work_dir(job_id)

    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            return

        project = db.query(Project).filter(Project.id == job.project_id).first()
        if not project:
            JobQueue.mark_failed(job_id, "PROJECT_MISSING", "Associated project was not found.")
            return

        video = db.query(Video).filter(Video.id == project.video_id).first()
        if not video:
            JobQueue.mark_failed(job_id, "VIDEO_MISSING", "Associated video was not found.")
            return

        settings_dict = json.loads(project.settings_json) if project.settings_json else {}
        target_clip_duration = float(settings_dict.get("clip_duration_seconds", 30))
        num_highlights = int(settings_dict.get("number_of_highlights", 5))

        source_abs = resolve_safe_path(video.file_path)

        # ---------------------------------------------------------------------
        # Stage B: Audio Extraction
        # ---------------------------------------------------------------------
        if JobQueue.is_cancelled(job_id):
            return
        JobQueue.update_progress(job_id, stage="extracting_audio", progress=15, message="Extracting audio track as mono 16kHz PCM...")

        wav_path = work_dir / "audio.wav"
        extracted_wav = extract_audio_to_wav(source_abs, wav_path)

        energy_points = []
        if extracted_wav:
            energy_points, _ = calculate_audio_energy(extracted_wav)

        # ---------------------------------------------------------------------
        # Stage C & D: Transcription & Sentence Segmentation
        # ---------------------------------------------------------------------
        if JobQueue.is_cancelled(job_id):
            return
        JobQueue.update_progress(job_id, stage="transcribing", progress=40, message="Transcribing speech with faster-whisper CPU INT8...")

        if extracted_wav:
            sub_settings = settings_dict.get("subtitle", {})
            lang_hint = sub_settings.get("language", "auto")
            tr_res = TranscriptionService.transcribe_audio_file(extracted_wav, language=lang_hint)
            TranscriptionService.save_transcript(db, video.id, tr_res)
        else:
            logger.info("Video has no audio; creating empty transcript.")
            TranscriptionService.save_transcript(db, video.id, {"language_code": "none", "text": "", "segments": []})

        # ---------------------------------------------------------------------
        # Stage E: Visual Scene Detection
        # ---------------------------------------------------------------------
        if JobQueue.is_cancelled(job_id):
            return
        JobQueue.update_progress(job_id, stage="detecting_scenes", progress=70, message="Analyzing scene boundaries and visual shot transitions...")

        scene_cuts = detect_scene_boundaries(source_abs, min_scene_len_seconds=2.0)

        # ---------------------------------------------------------------------
        # Stage F: Highlight Generation & Ranking
        # ---------------------------------------------------------------------
        if JobQueue.is_cancelled(job_id):
            return
        JobQueue.update_progress(job_id, stage="analyzing_highlights", progress=85, message="Scoring highlight candidates across sentence boundaries...")

        highlights = HighlightService.detect_and_rank_highlights(
            db=db,
            project_id=project.id,
            target_duration=target_clip_duration,
            number_of_highlights=num_highlights,
            energy_points=energy_points,
            scene_cuts=scene_cuts,
        )

        project.status = "ready_for_review"
        db.commit()

        # ---------------------------------------------------------------------
        # Stage Completion: Ready for user review
        # ---------------------------------------------------------------------
        JobQueue.update_progress(job_id, stage="ready_for_review", progress=100, message=f"Generated {len(highlights)} highlights. Ready for review.")
        JobQueue.mark_completed(job_id, message=f"Ready for review ({len(highlights)} candidate highlights)")

    except Exception as exc:
        logger.error(f"Pipeline error on job {job_id}: {exc}\n{traceback.format_exc()}")
        JobQueue.mark_failed(job_id, "PIPELINE_ERROR", str(exc))
    finally:
        # Release heavy models after job to conserve 16GB RAM
        ModelManager.release_whisper_model()
        # Clean up temporary work directory
        shutil.rmtree(work_dir, ignore_errors=True)
        db.close()
