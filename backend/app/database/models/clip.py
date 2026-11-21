from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.database.models.user import generate_uuid, utcnow


class Clip(Base):
    __tablename__ = "clips"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=False)
    highlight_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("highlights.id", ondelete="SET NULL"), nullable=True)
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    thumbnail_path: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    duration_seconds: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    width: Mapped[int] = mapped_column(Integer, default=1080, nullable=False)
    height: Mapped[int] = mapped_column(Integer, default=1920, nullable=False)
    fps: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    subtitle_language: Mapped[str] = mapped_column(String(16), default="auto", nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="ready", nullable=False)  # "draft", "rendering", "ready", "failed"
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    # Relationships
    project = relationship("Project", back_populates="clips")
    highlight = relationship("Highlight", back_populates="clips")
