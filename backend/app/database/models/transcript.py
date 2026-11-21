from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.database.models.user import generate_uuid, utcnow


class Transcript(Base):
    __tablename__ = "transcripts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    video_id: Mapped[str] = mapped_column(String(36), ForeignKey("videos.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    language_code: Mapped[str] = mapped_column(String(16), default="auto", nullable=False)
    text: Mapped[str] = mapped_column(Text, default="", nullable=False)
    segments_json: Mapped[str] = mapped_column(Text, default="[]", nullable=False)  # JSON array of segments
    model_name: Mapped[str] = mapped_column(String(64), default="whisper-small", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    # Relationships
    video = relationship("Video", back_populates="transcript")
