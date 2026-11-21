from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict, Field


class SubtitleSettingsSchema(BaseModel):
    enabled: bool = True
    mode: str = "original"  # "original" | "translated"
    language: str = "auto"
    style: str = "clean"  # "clean" | "bold_gold" | "karaoke" | "cinema"


class TranslationSettingsSchema(BaseModel):
    enabled: bool = False
    target_language: str = "en"


class VoiceSettingsSchema(BaseModel):
    enabled: bool = False
    target_language: str = "en"
    style: str = "energetic"


class ProjectSettingsSchema(BaseModel):
    clip_duration_seconds: int = Field(default=30, ge=15, le=120, description="Target clip duration in seconds.")
    number_of_highlights: int = Field(default=5, ge=1, le=25, description="Number of highlights to identify.")
    aspect_ratio: str = Field(default="9:16", pattern=r"^(9:16|1:1|16:9|4:5)$")
    output_width: int = Field(default=1080, ge=360, le=3840)
    output_height: int = Field(default=1920, ge=360, le=3840)
    subtitle: SubtitleSettingsSchema = Field(default_factory=SubtitleSettingsSchema)
    translation: TranslationSettingsSchema = Field(default_factory=TranslationSettingsSchema)
    voice: VoiceSettingsSchema = Field(default_factory=VoiceSettingsSchema)
    smart_crop: bool = True


class ProjectCreateRequest(BaseModel):
    video_id: str
    title: str = Field(..., min_length=1, max_length=255)
    settings: ProjectSettingsSchema = Field(default_factory=ProjectSettingsSchema)


class ProjectResponse(BaseModel):
    id: str
    user_id: str
    video_id: str
    title: str
    settings: ProjectSettingsSchema
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
