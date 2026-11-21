import math
import re
from typing import Tuple


def seconds_to_srt_time(seconds: float) -> str:
    """Format seconds into SRT timestamp HH:MM:SS,mmm."""
    total_ms = max(0, int(round(seconds * 1000)))
    hrs = total_ms // 3_600_000
    mins = (total_ms % 3_600_000) // 60_000
    secs = (total_ms % 60_000) // 1000
    ms = total_ms % 1000
    return f"{hrs:02d}:{mins:02d}:{secs:02d},{ms:03d}"


def seconds_to_vtt_time(seconds: float) -> str:
    """Format seconds into WebVTT timestamp HH:MM:SS.mmm."""
    total_ms = max(0, int(round(seconds * 1000)))
    hrs = total_ms // 3_600_000
    mins = (total_ms % 3_600_000) // 60_000
    secs = (total_ms % 60_000) // 1000
    ms = total_ms % 1000
    return f"{hrs:02d}:{mins:02d}:{secs:02d}.{ms:03d}"


def seconds_to_ass_time(seconds: float) -> str:
    """Format seconds into ASS subtitle timestamp H:MM:SS.cc."""
    total_cs = max(0, int(round(seconds * 100)))
    hrs = total_cs // 360_000
    mins = (total_cs % 360_000) // 6_000
    secs = (total_cs % 6_000) // 100
    cs = total_cs % 100
    return f"{hrs}:{mins:02d}:{secs:02d}.{cs:02d}"


def parse_timestamp_str(ts_str: str) -> float:
    """Parse HH:MM:SS(.mmm) or MM:SS(.mmm) or raw float seconds."""
    s = ts_str.strip().replace(",", ".")
    parts = s.split(":")
    try:
        if len(parts) == 3:
            return float(parts[0]) * 3600 + float(parts[1]) * 60 + float(parts[2])
        if len(parts) == 2:
            return float(parts[0]) * 60 + float(parts[1])
        return float(parts[0])
    except ValueError:
        return 0.0


def compute_temporal_overlap(
    interval_a: Tuple[float, float],
    interval_b: Tuple[float, float],
) -> float:
    """
    Compute intersection-over-union (IoU) of two 1D time intervals [start, end].
    Returns float in range [0.0, 1.0].
    """
    start_a, end_a = interval_a
    start_b, end_b = interval_b

    inter_start = max(start_a, start_b)
    inter_end = min(end_a, end_b)
    intersection = max(0.0, inter_end - inter_start)

    len_a = max(0.0, end_a - start_a)
    len_b = max(0.0, end_b - start_b)
    union = len_a + len_b - intersection

    if union <= 0.0:
        return 0.0
    return intersection / union
