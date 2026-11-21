import threading
from typing import Optional
from app.config import settings
from app.core.logging import logger

_whisper_lock = threading.Lock()
_whisper_instance = None


class ModelManager:
    """Manages lazy-loading and thread-safe execution of AI models for CPU inference."""

    @classmethod
    def get_whisper_model(cls, model_size: Optional[str] = None):
        global _whisper_instance
        size = model_size or settings.whisper_model

        with _whisper_lock:
            if _whisper_instance is None:
                logger.info(f"Lazy loading faster-whisper model: {size} (device={settings.whisper_device}, compute={settings.whisper_compute_type})")
                from faster_whisper import WhisperModel
                _whisper_instance = WhisperModel(
                    size,
                    device=settings.whisper_device,
                    compute_type=settings.whisper_compute_type,
                    cpu_threads=4,
                )
            return _whisper_instance

    @classmethod
    def release_whisper_model(cls):
        global _whisper_instance
        with _whisper_lock:
            if _whisper_instance is not None:
                logger.info("Releasing faster-whisper model memory.")
                del _whisper_instance
                _whisper_instance = None
                import gc
                gc.collect()
