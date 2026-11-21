from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class JobResponse(BaseModel):
    id: str
    project_id: str
    job_type: str
    status: str
    stage: str
    progress: int
    message: str
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    attempt_count: int
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class JobEnqueueResponse(BaseModel):
    job_id: str
    status: str
    stage: str
    progress: int
    message: str
