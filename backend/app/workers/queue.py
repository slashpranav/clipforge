from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session

from app.core.logging import logger
from app.database.models.job import Job
from app.database.models.user import utcnow
from app.database.session import SessionLocal


class JobQueue:
    @staticmethod
    def enqueue(db: Session, project_id: str, job_type: str = "full_process") -> Job:
        """Create and persist a new queued job record."""
        job = Job(
            project_id=project_id,
            job_type=job_type,
            status="queued",
            stage="queued",
            progress=0,
            message="Video job queued for processing",
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        return job

    @staticmethod
    def claim_next_job(db: Session) -> Optional[Job]:
        """
        Claim the next pending job transactionally to prevent double processing.
        Limits concurrency to one active job.
        """
        # Check if a job is already running
        running = db.query(Job).filter(Job.status == "running").first()
        if running:
            return None

        # Claim oldest queued job
        job = (
            db.query(Job)
            .filter(Job.status == "queued")
            .order_by(Job.created_at.asc())
            .with_for_update(skip_locked=True) if db.bind and db.bind.dialect.name != "sqlite"
            else db.query(Job).filter(Job.status == "queued").order_by(Job.created_at.asc())
        ).first()

        if job:
            job.status = "running"
            job.started_at = utcnow()
            job.attempt_count += 1
            job.message = "Job started by worker"
            db.commit()
            db.refresh(job)
            logger.info(f"Worker claimed job {job.id} for project {job.project_id}")
            return job
        return None

    @staticmethod
    def update_progress(
        job_id: str,
        stage: str,
        progress: int,
        message: str,
    ) -> None:
        """Update job stage, monotonic progress, and human-readable message."""
        db = SessionLocal()
        try:
            job = db.query(Job).filter(Job.id == job_id).first()
            if job and job.status == "running":
                job.stage = stage
                job.progress = max(job.progress, min(100, progress))
                job.message = message[:250]
                db.commit()
        finally:
            db.close()

    @staticmethod
    def mark_completed(job_id: str, message: str = "Completed successfully") -> None:
        db = SessionLocal()
        try:
            job = db.query(Job).filter(Job.id == job_id).first()
            if job:
                job.status = "completed"
                job.stage = "completed"
                job.progress = 100
                job.message = message[:250]
                job.completed_at = utcnow()
                db.commit()
        finally:
            db.close()

    @staticmethod
    def mark_failed(job_id: str, error_code: str, error_message: str) -> None:
        db = SessionLocal()
        try:
            job = db.query(Job).filter(Job.id == job_id).first()
            if job:
                job.status = "failed"
                job.stage = "failed"
                job.error_code = error_code
                job.error_message = error_message
                job.message = f"Failed: {error_message[:180]}"
                job.completed_at = utcnow()
                db.commit()
        finally:
            db.close()

    @staticmethod
    def is_cancelled(job_id: str) -> bool:
        db = SessionLocal()
        try:
            job = db.query(Job).filter(Job.id == job_id).first()
            return bool(job and job.status == "cancelled")
        finally:
            db.close()

    @staticmethod
    def reconcile_stale_jobs_on_startup() -> None:
        """Reconcile jobs left in running state across server restarts."""
        db = SessionLocal()
        try:
            stale_jobs = db.query(Job).filter(Job.status == "running").all()
            for j in stale_jobs:
                logger.warning(f"Reconciling stale job {j.id} left running on restart.")
                j.status = "queued"
                j.message = "Re-queued automatically after server restart"
                j.stage = "queued"
            db.commit()
        finally:
            db.close()
