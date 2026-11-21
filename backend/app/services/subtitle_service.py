import json
from pathlib import Path
from typing import Any, Dict, List
from sqlalchemy.orm import Session

from app.database.models.project import Project
from app.database.models.transcript import Transcript
from app.processors.subtitles import generate_ass_content, generate_srt_content, generate_vtt_content


class SubtitleService:
    @staticmethod
    def extract_cues_for_interval(
        db: Session,
        video_id: str,
        start_seconds: float,
        end_seconds: float,
    ) -> List[Dict[str, Any]]:
        """
        Extract and slice transcript segments/words relative to a clip's [start_seconds, end_seconds].
        Returns timestamped cues in relative seconds [0.0, duration].
        """
        transcript = db.query(Transcript).filter(Transcript.video_id == video_id).first()
        if not transcript:
            return []

        segments = json.loads(transcript.segments_json)
        cues: List[Dict[str, Any]] = []

        clip_dur = end_seconds - start_seconds

        for seg in segments:
            s = float(seg.get("start", 0.0))
            e = float(seg.get("end", 0.0))
            if e <= start_seconds or s >= end_seconds:
                continue

            words = seg.get("words", [])
            if words:
                # Group words into 4-6 word subtitle chunks
                cur_chunk: List[str] = []
                chunk_start = None
                chunk_end = None
                for w in words:
                    ws = float(w.get("start", s))
                    we = float(w.get("end", e))
                    if we > start_seconds and ws < end_seconds:
                        rel_s = max(0.0, ws - start_seconds)
                        rel_e = min(clip_dur, we - start_seconds)
                        if chunk_start is None:
                            chunk_start = rel_s
                        chunk_end = rel_e
                        cur_chunk.append(w.get("word", ""))
                        if len(cur_chunk) >= 5:
                            cues.append({
                                "start": round(chunk_start, 2),
                                "end": round(chunk_end, 2),
                                "text": " ".join(cur_chunk).strip(),
                            })
                            cur_chunk = []
                            chunk_start = None
                if cur_chunk and chunk_start is not None and chunk_end is not None:
                    cues.append({
                        "start": round(chunk_start, 2),
                        "end": round(chunk_end, 2),
                        "text": " ".join(cur_chunk).strip(),
                    })
            else:
                rel_s = max(0.0, s - start_seconds)
                rel_e = min(clip_dur, e - start_seconds)
                cues.append({
                    "start": round(rel_s, 2),
                    "end": round(rel_e, 2),
                    "text": seg.get("text", "").strip(),
                })

        return cues
