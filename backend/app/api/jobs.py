from typing import Annotated, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.errors import AppError, ForbiddenError, NotFoundError
from app.database.models.job import Job
from app.database.models.project import Project
from app.database.models.user import User
from app.database.session import get_db
from app.schemas.job import JobEnqueueResponse, JobResponse
from app.workers.queue import JobQueue

router = APIRouter(tags=["Jobs"])


@router.post("/projects/{project_id}/process", response_model=JobEnqueueResponse, status_code=202)
@router.post("/projects/{project_id}/analyze", response_model=JobEnqueueResponse, status_code=202)
@router.post("/jobs/projects/{project_id}/analyze", response_model=JobEnqueueResponse, status_code=202)
@router.post("/jobs/projects/{project_id}/process", response_model=JobEnqueueResponse, status_code=202)
def start_processing_job(
    project_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Enqueue an asynchronous full-video analysis pipeline job."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise NotFoundError("Project", project_id)
    if project.user_id != current_user.id:
        raise ForbiddenError()

    job = JobQueue.enqueue(db, project_id=project_id, job_type="full_process")
    project.status = "processing"
    db.commit()

    return JobEnqueueResponse(
        job_id=job.id,
        status=job.status,
        stage=job.stage,
        progress=job.progress,
        message=job.message,
    )


@router.get("/jobs/{job_id}", response_model=JobResponse)
def get_job_status(
    job_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Poll job status, stage, progress, and messages."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise NotFoundError("Job", job_id)

    project = db.query(Project).filter(Project.id == job.project_id).first()
    if not project or project.user_id != current_user.id:
        raise ForbiddenError()

    return JobResponse.model_validate(job)


@router.post("/jobs/{job_id}/cancel")
def cancel_job(
    job_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Best-effort cancellation of an active or queued job."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise NotFoundError("Job", job_id)

    project = db.query(Project).filter(Project.id == job.project_id).first()
    if not project or project.user_id != current_user.id:
        raise ForbiddenError()

    if job.status in ("completed", "failed", "cancelled"):
        raise AppError(code="INVALID_OPERATION", message=f"Job is already {job.status}.")

    job.status = "cancelled"
    job.stage = "cancelled"
    job.message = "Job cancelled by user"
    db.commit()
    return {"message": f"Job '{job_id}' marked as cancelled."}


@router.get("/projects/{project_id}/jobs", response_model=List[JobResponse])
def list_project_jobs(
    project_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """List all processing jobs for a specific project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise NotFoundError("Project", project_id)
    if project.user_id != current_user.id:
        raise ForbiddenError()

    jobs = db.query(Job).filter(Job.project_id == project_id).order_by(Job.created_at.desc()).all()
    return [JobResponse.model_validate(j) for j in jobs]
