from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict, Field


class ScoreBreakdownSchema(BaseModel):
    hook_curiosity: float = 0.0
    semantic_informativeness: float = 0.0
    context_completeness: float = 0.0
    speech_audio_activity: float = 0.0
    visual_framing_quality: float = 0.0
    scene_change_context: float = 0.0


class HighlightResponse(BaseModel):
    id: str
    project_id: str
    start_seconds: float
    end_seconds: float
    duration_seconds: float
    score: float
    title: str
    reason: str
    transcript_excerpt: str
    score_breakdown: ScoreBreakdownSchema
    selected: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HighlightUpdateRequest(BaseModel):
    start_seconds: Optional[float] = Field(None, ge=0.0)
    end_seconds: Optional[float] = Field(None, ge=0.0)
    title: Optional[str] = Field(None, max_length=255)
    selected: Optional[bool] = None
