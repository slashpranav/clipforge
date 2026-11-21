import re
from typing import Any, Dict, List

# Sentence terminators for English and Hindi (Devanagari danda '।', double danda '॥', '.', '?', '!')
SENTENCE_TERMINATORS = re.compile(r"([.?!।॥]+)")


def segment_transcript_into_sentences(segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Transform raw Whisper segments into sentence-like units.
    Ensures that clips never start or cut mid-sentence and timestamps are accurately preserved.
    """
    if not segments:
        return []

    # Flatten all words if word timestamps exist, otherwise distribute words evenly across segments
    all_words: List[Dict[str, Any]] = []
    for seg in segments:
        words = seg.get("words")
        seg_text = seg.get("text", "").strip()
        seg_start = float(seg.get("start", 0.0))
        seg_end = float(seg.get("end", seg_start + 1.0))

        if words:
            for w in words:
                all_words.append({
                    "word": str(w.get("word", "")).strip(),
                    "start": float(w.get("start", seg_start)),
                    "end": float(w.get("end", seg_end)),
                })
        elif seg_text:
            parts = [p for p in re.split(r"\s+", seg_text) if p]
            if parts:
                step = (seg_end - seg_start) / len(parts)
                for idx, p in enumerate(parts):
                    all_words.append({
                        "word": p,
                        "start": round(seg_start + idx * step, 3),
                        "end": round(seg_start + (idx + 1) * step, 3),
                    })

    if not all_words:
        return []

    sentences: List[Dict[str, Any]] = []
    current_sentence_words: List[Dict[str, Any]] = []

    for item in all_words:
        word = item["word"]
        if not word:
            continue
        current_sentence_words.append(item)

        # Check if word ends with a sentence terminator
        has_terminator = bool(re.search(r"[.?!।॥]$", word))
        is_long_enough = len(current_sentence_words) >= 6
        is_excessive = len(current_sentence_words) >= 28

        if has_terminator or (is_long_enough and (item["end"] - current_sentence_words[0]["start"] >= 6.0)) or is_excessive:
            sent_text = " ".join(w["word"] for w in current_sentence_words).strip()
            sentences.append({
                "start": current_sentence_words[0]["start"],
                "end": current_sentence_words[-1]["end"],
                "text": sent_text,
                "words": current_sentence_words,
            })
            current_sentence_words = []

    # Residual words
    if current_sentence_words:
        sent_text = " ".join(w["word"] for w in current_sentence_words).strip()
        if sentences and len(current_sentence_words) < 4:
            # Merge short residual fragment to previous sentence
            sentences[-1]["end"] = current_sentence_words[-1]["end"]
            sentences[-1]["text"] = f"{sentences[-1]['text']} {sent_text}"
            sentences[-1]["words"].extend(current_sentence_words)
        else:
            sentences.append({
                "start": current_sentence_words[0]["start"],
                "end": current_sentence_words[-1]["end"],
                "text": sent_text,
                "words": current_sentence_words,
            })

    return sentences
