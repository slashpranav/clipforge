import json
from pathlib import Path
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.ai.model_manager import ModelManager
from app.core.errors import AppError
from app.core.logging import logger
from app.database.models.transcript import Transcript


class TranscriptionService:
    @staticmethod
    def transcribe_audio_file(
        wav_path: Path,
        language: str = "auto",
        model_size: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Transcribe audio file using local faster-whisper with word timestamps and VAD filtering.
        """
        if not wav_path or not wav_path.exists():
            raise AppError(code="AUDIO_MISSING", message="Audio file not found for transcription.", status_code=404)

        model = ModelManager.get_whisper_model(model_size)
        lang_arg = None if language == "auto" else language

        logger.info(f"Starting faster-whisper transcription on {wav_path.name} (language={lang_arg})")
        try:
            segments_iter, info = model.transcribe(
                str(wav_path),
                language=lang_arg,
                word_timestamps=True,
                vad_filter=True,
            )

            detected_lang = info.language or "unknown"
            segments: List[Dict[str, Any]] = []
            full_text_parts: List[str] = []

            for seg in segments_iter:
                text = (seg.text or "").strip()
                if not text:
                    continue
                full_text_parts.append(text)

                words_data = []
                if getattr(seg, "words", None):
                    for w in seg.words:
                        wt = (w.word or "").strip()
                        if wt:
                            words_data.append({
                                "word": wt,
                                "start": round(float(w.start), 3),
                                "end": round(float(w.end), 3),
                            })

                segments.append({
                    "start": round(float(seg.start), 3),
                    "end": round(float(seg.end), 3),
                    "text": text,
                    "words": words_data,
                })

            full_text = " ".join(full_text_parts).strip()
            return {
                "language_code": detected_lang,
                "text": full_text,
                "segments": segments,
            }
        except Exception as exc:
            logger.error(f"Transcription failed: {exc}")
            raise AppError(code="TRANSCRIPTION_FAILED", message=f"Audio transcription failed: {exc}", status_code=500)

    @staticmethod
    def save_transcript(
        db: Session,
        video_id: str,
        result: Dict[str, Any],
        model_name: str = "whisper-small",
    ) -> Transcript:
        """Persist transcript entity to database."""
        # Remove previous transcript if re-running
        existing = db.query(Transcript).filter(Transcript.video_id == video_id).first()
        if existing:
            db.delete(existing)
            db.flush()

        transcript = Transcript(
            video_id=video_id,
            language_code=result["language_code"],
            text=result["text"],
            segments_json=json.dumps(result["segments"], ensure_ascii=False),
            model_name=model_name,
        )
        db.add(transcript)
        db.commit()
        db.refresh(transcript)
        return transcript
