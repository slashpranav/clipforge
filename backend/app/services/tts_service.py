from pathlib import Path
from typing import Optional
from app.core.logging import logger


class TTSService:
    @staticmethod
    def synthesize_speech(text: str, output_path: Path, language: str = "hi", voice: str = "default") -> Optional[Path]:
        """
        Optional local TTS dubbing hook.
        Ensures original audio is never overwritten.
        """
        logger.info(f"TTS requested for: {text[:40]}... (lang={language}, voice={voice})")
        return None
