from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, HttpUrl


class VideoResponse(BaseModel):
    id: str
    user_id: str
    source_type: str
    original_filename: str
    stored_filename: str
    mime_type: str
    size_bytes: int
    duration_seconds: float
    width: int
    height: int
    fps: float
    audio_present: bool
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class YouTubeReferenceRequest(BaseModel):
    url: str


class YouTubeReferenceResponse(BaseModel):
    video_id: str
    canonical_url: str
    title: Optional[str] = None
    author: Optional[str] = None
    duration_seconds: Optional[float] = None
    thumbnail_url: Optional[str] = None
    embed_url: str
    policy_notice: str = (
        "Note: In compliance with platform policies and intellectual property rights, "
        "ClipForge AI does not extract or download audiovisual streams from YouTube. "
        "To process this video, upload an authorized local file that you own or have permission to process."
    )
