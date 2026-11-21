from typing import Any, Dict, List


def analyze_speaker_turns(sentences: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Cluster adjacent sentences by conversational pauses (>1.2s gap)
    to identify candidate speaker or topic turns.
    """
    turns: List[Dict[str, Any]] = []
    if not sentences:
        return turns

    cur_turn = [sentences[0]]
    for s in sentences[1:]:
        gap = s["start"] - cur_turn[-1]["end"]
        if gap > 1.2:
            turns.append({
                "start": cur_turn[0]["start"],
                "end": cur_turn[-1]["end"],
                "sentence_count": len(cur_turn),
            })
            cur_turn = [s]
        else:
            cur_turn.append(s)

    if cur_turn:
        turns.append({
            "start": cur_turn[0]["start"],
            "end": cur_turn[-1]["end"],
            "sentence_count": len(cur_turn),
        })

    return turns
