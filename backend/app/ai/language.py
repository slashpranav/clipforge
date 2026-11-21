import re
from typing import Optional

DEVANAGARI_RANGE = re.compile(r"[\u0900-\u097F]")


def is_devanagari_text(text: str) -> bool:
    """Check if the text contains Hindi/Devanagari script."""
    return bool(DEVANAGARI_RANGE.search(text or ""))


def normalize_language_code(lang: Optional[str]) -> str:
    """Normalize input language code to standard 2-letter ISO code."""
    if not lang or lang.lower() in ("auto", "none", ""):
        return "auto"
    code = lang.strip().lower()
    if code in ("hindi", "hi", "hin"):
        return "hi"
    if code in ("english", "en", "eng"):
        return "en"
    return code[:2]
