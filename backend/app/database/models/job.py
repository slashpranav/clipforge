from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.database.models.user import generate_uuid, utcnow


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=False)
    job_type: Mapped[str] = mapped_column(String(64), nullable=False)  # "full_process", "transcription", "highlight_detection", "clip_render"
    status: Mapped[str] = mapped_column(String(32), default="queued", index=True, nullable=False)  # "queued", "running", "completed", "failed", "cancelled"
    stage: Mapped[str] = mapped_column(String(64), default="queued", nullable=False)  # "queued", "extracting_audio", "transcribing", "detecting_scenes", "analyzing_highlights", "ready_for_review", "rendering", "completed", "failed", "cancelled"
    progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # 0 to 100
    message: Mapped[str] = mapped_column(String(255), default="Job queued", nullable=False)
    error_code: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    attempt_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    project = relationship("Project", back_populates="jobs")
