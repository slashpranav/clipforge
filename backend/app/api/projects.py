import json
from typing import Annotated, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.errors import ForbiddenError, NotFoundError
from app.database.models.project import Project
from app.database.models.user import User
from app.database.models.video import Video
from app.database.session import get_db
from app.schemas.project import ProjectCreateRequest, ProjectResponse, ProjectSettingsSchema
from app.services.cleanup_service import CleanupService
from app.utils.paths import get_storage_root

router = APIRouter(prefix="/projects", tags=["Projects"])


def _serialize_project(project: Project) -> ProjectResponse:
    settings_dict = {}
    try:
        settings_dict = json.loads(project.settings_json)
    except Exception:
        pass
    return ProjectResponse(
        id=project.id,
        user_id=project.user_id,
        video_id=project.video_id,
        title=project.title,
        settings=ProjectSettingsSchema(**settings_dict),
        status=project.status,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


@router.post("", response_model=ProjectResponse, status_code=201)
def create_project(
    req: ProjectCreateRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Create a new project from an owned video and clipping settings."""
    video = db.query(Video).filter(Video.id == req.video_id).first()
    if not video:
        raise NotFoundError("Video", req.video_id)
    if video.user_id != current_user.id:
        raise ForbiddenError("You do not own this video.")

    project = Project(
        user_id=current_user.id,
        video_id=video.id,
        title=req.title.strip(),
        settings_json=json.dumps(req.settings.model_dump(), ensure_ascii=False),
        status="created",
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return _serialize_project(project)


@router.get("", response_model=List[ProjectResponse])
def list_projects(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """List all projects owned by the authenticated user."""
    projects = (
        db.query(Project)
        .filter(Project.user_id == current_user.id)
        .order_by(Project.created_at.desc())
        .all()
    )
    return [_serialize_project(p) for p in projects]


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project_details(
    project_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Retrieve details of a project. Enforces ownership."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise NotFoundError("Project", project_id)
    if project.user_id != current_user.id:
        raise ForbiddenError()
    return _serialize_project(project)


@router.delete("/{project_id}")
def delete_project(
    project_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Delete a project and its generated clip assets. Enforces ownership."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise NotFoundError("Project", project_id)
    if project.user_id != current_user.id:
        raise ForbiddenError()

    # Clean up generated clip directory
    storage_root = get_storage_root()
    project_clips_dir = storage_root / "clips" / project_id
    CleanupService.delete_directory_safely(str(project_clips_dir))

    db.delete(project)
    db.commit()
    return {"message": f"Project '{project_id}' deleted successfully."}
