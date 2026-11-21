from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ClipGenerateRequest(BaseModel):
    project_id: str
    highlight_ids: Optional[List[str]] = Field(default=None, description="Optional list of highlight IDs. If omitted, all selected highlights will be rendered.")
    output_width: Optional[int] = Field(default=1080, ge=360, le=3840)
    output_height: Optional[int] = Field(default=1920, ge=360, le=3840)
    fps: Optional[int] = Field(default=30, ge=24, le=60)
    smart_crop: Optional[bool] = True
    burn_subtitles: Optional[bool] = True


class ClipResponse(BaseModel):
    id: str
    project_id: str
    highlight_id: Optional[str] = None
    file_path: str
    thumbnail_path: Optional[str] = None
    duration_seconds: float
    width: int
    height: int
    fps: int
    subtitle_language: str
    status: str
    created_at: datetime
    download_url: str

    model_config = ConfigDict(from_attributes=True)


class ClipSubtitlesRequest(BaseModel):
    format: str = Field(default="srt", pattern=r"^(srt|vtt|ass)$")
    burn_in: bool = False
    style: str = "clean"


class ClipTranslateRequest(BaseModel):
    target_language: str = Field(..., min_length=2, max_length=10)


class ClipVoiceRequest(BaseModel):
    voice_model: str = "default"
    target_language: str = "hi"
    style: str = "energetic"


class ClipAssetResponse(BaseModel):
    clip_id: str
    video_available: bool
    thumbnail_available: bool
    srt_available: bool
    vtt_available: bool
    download_url: str
    srt_url: Optional[str] = None
    vtt_url: Optional[str] = None
