import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "ClipForge AI"
    app_env: str = "development"
    debug: bool = True
    host: str = "127.0.0.1"
    port: int = 8000
    api_prefix: str = "/api/v1"

    database_url: str = f"sqlite:///{(BASE_DIR / 'storage' / 'clipforge.db').as_posix()}"
    jwt_secret: str = "clipforge-dev-secret-replace-in-production-with-long-random-string"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    storage_root: str = str(BASE_DIR / "storage")
    max_upload_mb: int = 2048
    allowed_video_extensions: str = ".mp4,.mov,.mkv,.webm"
    max_video_duration_seconds: int = 14400

    whisper_model: str = "small"
    whisper_device: str = "cpu"
    whisper_compute_type: str = "int8"
    whisper_language: str = "auto"
    ai_max_concurrent_jobs: int = 1

    ffmpeg_path: str = "ffmpeg"
    ffprobe_path: str = "ffprobe"
    default_clip_duration: int = 30
    default_output_width: int = 1080
    default_output_height: int = 1920
    default_output_fps: int = 30

    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def allowed_extensions_set(self) -> set[str]:
        return {ext.strip().lower() for ext in self.allowed_video_extensions.split(",") if ext.strip()}

    @property
    def storage_path(self) -> Path:
        return Path(self.storage_root).resolve()


settings = Settings()
