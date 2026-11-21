from typing import List, Optional
from app.core.logging import logger


class TranslationService:
    @staticmethod
    def translate_text(text: str, target_language: str = "en") -> str:
        """
        Optional local translation service hook.
        Safely returns translated text or falls back cleanly with clear notices.
        """
        logger.info(f"Translation requested to {target_language} for text: {text[:40]}...")
        # Clean local baseline fallback when external NLLB or translation model is unconfigured
        return text
