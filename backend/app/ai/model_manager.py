import os
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
                try:
                    import faster_whisper.audio
                    import soundfile as sf
                    import numpy as np

                    def _patched_decode_audio(input_file, sampling_rate=16000, split_stereo=False):
                        if isinstance(input_file, np.ndarray):
                            return input_file
                        audio, sr = sf.read(str(input_file), dtype="float32")
                        if audio.ndim > 1:
                            if split_stereo:
                                return audio[:, 0], audio[:, 1]
                            audio = audio.mean(axis=1)
                        return audio

                    faster_whisper.audio.decode_audio = _patched_decode_audio
                except Exception as patch_err:
                    logger.warning(f"Could not patch faster_whisper decode_audio: {patch_err}")

                from faster_whisper import WhisperModel
                threads = min(8, os.cpu_count() or 4)
                try:
                    # Try cached local weights first to avoid slow hub HTTP round-trips
                    _whisper_instance = WhisperModel(
                        size,
                        device=settings.whisper_device,
                        compute_type=settings.whisper_compute_type,
                        cpu_threads=threads,
                        local_files_only=True,
                    )
                except Exception:
                    _whisper_instance = WhisperModel(
                        size,
                        device=settings.whisper_device,
                        compute_type=settings.whisper_compute_type,
                        cpu_threads=threads,
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
