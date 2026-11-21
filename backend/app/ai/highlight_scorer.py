import re
from typing import Any, Dict, List, Optional, Tuple
from app.utils.timestamps import compute_temporal_overlap

HOOK_KEYWORDS = {
    # English
    "secret", "mistake", "never", "stop", "truth", "nobody", "shocking", "wait",
    "watch", "hidden", "why", "how", "what", "question", "actually", "number one",
    # Hindi
    "सच", "राज़", "गलती", "रुकिए", "जानिए", "कारण", "ध्यान", "हैरान", "सवाल",
}

INFORMATIVE_KEYWORDS = {
    "percent", "%", "million", "billion", "research", "study", "fact", "science",
    "explained", "example", "history", "important", "तथ्य", "रिसर्च", "इतिहास", "ज़रूरी",
}


def score_window(
    text: str,
    duration: float,
    target_duration: float,
    energy_points: List[Dict[str, float]],
    scene_cuts: List[float],
    start_time: float,
    end_time: float,
    has_face: bool = True,
) -> Tuple[float, Dict[str, float], str]:
    """
    Compute explainable heuristic score in [0, 100] with explicit component breakdown and reason.
    - Hook / curiosity: 25%
    - Semantic informativeness: 25%
    - Context completeness: 20%
    - Speech / audio activity: 15%
    - Visual / framing quality: 10%
    - Scene-change cue: 5%
    """
    lower = text.lower()
    words = re.findall(r"[\w\u0900-\u097F]+", lower)
    word_count = len(words)

    # 1. Hook / Curiosity (max 25)
    hook_matches = [w for w in HOOK_KEYWORDS if w in lower]
    has_question = "?" in text
    hook_score = min(25.0, len(hook_matches) * 5.0 + (10.0 if has_question else 0.0) + (5.0 if "!" in text else 0.0))

    # 2. Semantic Informativeness (max 25)
    info_matches = [w for w in INFORMATIVE_KEYWORDS if w in lower]
    has_numbers = bool(re.search(r"\b\d+\b", text))
    density = min(1.0, word_count / max(1.0, duration * 2.8))
    semantic_score = min(25.0, len(info_matches) * 4.0 + (7.0 if has_numbers else 0.0) + (density * 10.0))

    # 3. Context Completeness (max 20)
    dur_ratio = 1.0 - abs(duration - target_duration) / target_duration
    dur_factor = max(0.0, min(1.0, dur_ratio))
    ends_cleanly = bool(re.search(r"[.?!।॥]$", text.strip()))
    starts_cleanly = not bool(re.match(r"^(and|but|or|so|because|aur|lekin)\b", lower))
    context_score = min(20.0, (dur_factor * 10.0) + (6.0 if ends_cleanly else 0.0) + (4.0 if starts_cleanly else 0.0))

    # 4. Speech / Audio Activity (max 15)
    in_range_energies = [p["energy"] for p in energy_points if start_time <= p["t"] <= end_time]
    avg_energy = float(sum(in_range_energies) / len(in_range_energies)) if in_range_energies else 0.5
    speech_score = min(15.0, avg_energy * 15.0)

    # 5. Visual / Framing Quality (max 10)
    visual_score = 9.0 if has_face else 6.0

    # 6. Scene Change Cue (max 5)
    cuts_inside = [c for c in scene_cuts if start_time <= c <= end_time]
    scene_score = min(5.0, len(cuts_inside) * 2.5) if cuts_inside else 3.0

    total_score = round(hook_score + semantic_score + context_score + speech_score + visual_score + scene_score, 1)

    breakdown = {
        "hook_curiosity": round(hook_score, 1),
        "semantic_informativeness": round(semantic_score, 1),
        "context_completeness": round(context_score, 1),
        "speech_audio_activity": round(speech_score, 1),
        "visual_framing_quality": round(visual_score, 1),
        "scene_change_context": round(scene_score, 1),
    }

    # Generate human-readable reason
    reasons = []
    if has_question:
        reasons.append("opens with thought-provoking question")
    if hook_matches:
        reasons.append(f"strong hook keyword '{hook_matches[0]}'")
    if has_numbers or info_matches:
        reasons.append("high factual information density")
    if avg_energy >= 0.65:
        reasons.append("high vocal energy delivery")
    if ends_cleanly:
        reasons.append("self-contained sentence conclusion")
    if not reasons:
        reasons.append("continuous conversational statement with natural pacing")

    reason_str = "Clear highlight: " + "; ".join(reasons) + "."
    return total_score, breakdown, reason_str


def generate_candidate_highlights(
    sentences: List[Dict[str, Any]],
    source_duration: float,
    target_duration: float = 30.0,
    number_of_highlights: int = 5,
    energy_points: Optional[List[Dict[str, float]]] = None,
    scene_cuts: Optional[List[float]] = None,
) -> List[Dict[str, Any]]:
    """
    Generate and rank candidate highlight windows respecting sentence boundaries.
    Deduplicates candidates using IoU temporal overlap and returns top N.
    """
    if not sentences or source_duration <= 5.0:
        return []

    energy_pts = energy_points or []
    cuts = scene_cuts or []

    candidates: List[Dict[str, Any]] = []
    n_sentences = len(sentences)

    for i in range(n_sentences):
        start_t = float(sentences[i]["start"])
        for j in range(i, n_sentences):
            end_t = float(sentences[j]["end"])
            dur = end_t - start_t

            # Allow tolerance around target duration: [0.65 * target, 1.35 * target]
            if dur > target_duration * 1.35 or end_t > source_duration:
                break
            if dur >= max(8.0, target_duration * 0.65):
                text_slice = " ".join(s["text"] for s in sentences[i : j + 1]).strip()
                score, breakdown, reason = score_window(
                    text=text_slice,
                    duration=dur,
                    target_duration=target_duration,
                    energy_points=energy_pts,
                    scene_cuts=cuts,
                    start_time=start_t,
                    end_time=end_t,
                )

                # Formulate a descriptive title from first sentence
                first_sent = sentences[i]["text"].strip()
                title = first_sent[:65].rstrip(",;:- ") + ("..." if len(first_sent) > 65 else "")

                candidates.append({
                    "start_seconds": round(start_t, 2),
                    "end_seconds": round(end_t, 2),
                    "duration_seconds": round(dur, 2),
                    "score": score,
                    "title": title or "Highlight Opportunity",
                    "reason": reason,
                    "transcript_excerpt": text_slice,
                    "score_breakdown": breakdown,
                    "selected": False,
                })

    # Sort descending by score
    candidates.sort(key=lambda c: c["score"], reverse=True)

    # Deduplicate using non-maximum suppression / IoU threshold
    selected: List[Dict[str, Any]] = []
    for cand in candidates:
        if len(selected) >= number_of_highlights:
            break
        cand_interval = (cand["start_seconds"], cand["end_seconds"])
        overlaps = False
        for ex in selected:
            ex_interval = (ex["start_seconds"], ex["end_seconds"])
            if compute_temporal_overlap(cand_interval, ex_interval) > 0.25:
                overlaps = True
                break
        if not overlaps:
            cand["selected"] = len(selected) < 3  # Select top 3 by default
            selected.append(cand)

    return selected
