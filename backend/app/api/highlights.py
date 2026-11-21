from typing import Annotated, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.errors import ForbiddenError, NotFoundError
from app.database.models.highlight import Highlight
from app.database.models.project import Project
from app.database.models.user import User
from app.database.session import get_db
from app.schemas.highlight import HighlightResponse, HighlightUpdateRequest
from app.services.highlight_service import HighlightService

router = APIRouter(tags=["Highlights"])


@router.get("/projects/{project_id}/highlights", response_model=List[HighlightResponse])
def list_project_highlights(
    project_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Retrieve ranked highlights for a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise NotFoundError("Project", project_id)
    if project.user_id != current_user.id:
        raise ForbiddenError()

    highlights = (
        db.query(Highlight)
        .filter(Highlight.project_id == project_id)
        .order_by(Highlight.score.desc())
        .all()
    )
    return [HighlightService.to_response(h) for h in highlights]


@router.patch("/highlights/{highlight_id}", response_model=HighlightResponse)
def update_highlight(
    highlight_id: str,
    req: HighlightUpdateRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Adjust highlight timestamps, title, or selection state."""
    highlight = db.query(Highlight).filter(Highlight.id == highlight_id).first()
    if not highlight:
        raise NotFoundError("Highlight", highlight_id)

    project = db.query(Project).filter(Project.id == highlight.project_id).first()
    if not project or project.user_id != current_user.id:
        raise ForbiddenError()

    data = req.model_dump(exclude_unset=True)
    if "start_seconds" in data and data["start_seconds"] is not None:
        highlight.start_seconds = round(float(data["start_seconds"]), 2)
    if "end_seconds" in data and data["end_seconds"] is not None:
        highlight.end_seconds = round(float(data["end_seconds"]), 2)
    if "title" in data and data["title"] is not None:
        highlight.title = data["title"].strip()
    if "selected" in data and data["selected"] is not None:
        highlight.selected = bool(data["selected"])

    db.commit()
    db.refresh(highlight)
    return HighlightService.to_response(highlight)


@router.post("/projects/{project_id}/highlights/regenerate", response_model=List[HighlightResponse])
def regenerate_project_highlights(
    project_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Re-run highlight ranking based on existing transcript and project settings."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise NotFoundError("Project", project_id)
    if project.user_id != current_user.id:
        raise ForbiddenError()

    highlights = HighlightService.detect_and_rank_highlights(db, project_id)
    return [HighlightService.to_response(h) for h in highlights]
