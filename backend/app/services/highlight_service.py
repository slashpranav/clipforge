import json
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.ai.highlight_scorer import generate_candidate_highlights
from app.ai.sentence_segmenter import segment_transcript_into_sentences
from app.core.errors import AppError, NotFoundError
from app.database.models.highlight import Highlight
from app.database.models.project import Project
from app.database.models.transcript import Transcript
from app.database.models.video import Video
from app.schemas.highlight import HighlightResponse, ScoreBreakdownSchema


class HighlightService:
    @staticmethod
    def detect_and_rank_highlights(
        db: Session,
        project_id: str,
        target_duration: float = 30.0,
        number_of_highlights: int = 5,
        energy_points: Optional[List[Dict[str, float]]] = None,
        scene_cuts: Optional[List[float]] = None,
    ) -> List[Highlight]:
        """
        Process transcript segments into sentences, evaluate candidates, and persist ranked highlights.
        """
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise NotFoundError("Project", project_id)

        transcript = db.query(Transcript).filter(Transcript.video_id == project.video_id).first()
        video = db.query(Video).filter(Video.id == project.video_id).first()
        source_dur = video.duration_seconds if video else 60.0

        raw_segments = json.loads(transcript.segments_json) if transcript else []
        sentences = segment_transcript_into_sentences(raw_segments)

        # Generate candidates using explainable scorer
        candidates = generate_candidate_highlights(
            sentences=sentences,
            source_duration=source_dur,
            target_duration=target_duration,
            number_of_highlights=number_of_highlights,
            energy_points=energy_points,
            scene_cuts=scene_cuts,
        )

        # Clear existing highlights for this project if re-generating
        db.query(Highlight).filter(Highlight.project_id == project_id).delete()

        persisted: List[Highlight] = []
        for cand in candidates:
            h = Highlight(
                project_id=project_id,
                start_seconds=cand["start_seconds"],
                end_seconds=cand["end_seconds"],
                score=cand["score"],
                title=cand["title"],
                reason=cand["reason"],
                transcript_excerpt=cand["transcript_excerpt"],
                score_breakdown_json=json.dumps(cand["score_breakdown"], ensure_ascii=False),
                selected=cand["selected"],
            )
            db.add(h)
            persisted.append(h)

        db.commit()
        for h in persisted:
            db.refresh(h)
        return persisted

    @staticmethod
    def to_response(h: Highlight) -> HighlightResponse:
        breakdown_dict = {}
        try:
            breakdown_dict = json.loads(h.score_breakdown_json)
        except Exception:
            pass

        return HighlightResponse(
            id=h.id,
            project_id=h.project_id,
            start_seconds=h.start_seconds,
            end_seconds=h.end_seconds,
            duration_seconds=round(h.end_seconds - h.start_seconds, 2),
            score=h.score,
            title=h.title,
            reason=h.reason,
            transcript_excerpt=h.transcript_excerpt,
            score_breakdown=ScoreBreakdownSchema(**breakdown_dict),
            selected=h.selected,
            created_at=h.created_at,
        )
