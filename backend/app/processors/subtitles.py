import os
from pathlib import Path
from typing import Any, Dict, List
from app.utils.timestamps import seconds_to_ass_time, seconds_to_srt_time, seconds_to_vtt_time


def generate_srt_content(cues: List[Dict[str, Any]]) -> str:
    """Generate valid SubRip (.srt) subtitle format string."""
    blocks = []
    for idx, cue in enumerate(cues, start=1):
        s = seconds_to_srt_time(float(cue.get("start", 0.0)))
        e = seconds_to_srt_time(float(cue.get("end", 0.0)))
        text = str(cue.get("text", "")).strip()
        blocks.append(f"{idx}\n{s} --> {e}\n{text}\n")
    return "\n".join(blocks)


def generate_vtt_content(cues: List[Dict[str, Any]]) -> str:
    """Generate valid WebVTT (.vtt) format string."""
    lines = ["WEBVTT\n"]
    for idx, cue in enumerate(cues, start=1):
        s = seconds_to_vtt_time(float(cue.get("start", 0.0)))
        e = seconds_to_vtt_time(float(cue.get("end", 0.0)))
        text = str(cue.get("text", "")).strip()
        lines.append(f"{idx}\n{s} --> {e}\n{text}\n")
    return "\n".join(lines)


def generate_ass_content(
    cues: List[Dict[str, Any]],
    style: str = "clean",
    play_res_x: int = 1080,
    play_res_y: int = 1920,
) -> str:
    """
    Generate Advanced SubStation Alpha (.ass) subtitle file.
    Configured for 9:16 vertical shorts with Unicode Hindi font support.
    """
    font_name = "Nirmala UI" if os.name == "nt" else "DejaVu Sans"

    styles_preset = {
        "clean": {"size": 58, "primary": "&H00FFFFFF", "outline": "&H00000000", "outline_w": 4, "shadow": 2, "margin_v": 340},
        "bold_gold": {"size": 66, "primary": "&H0012D6FF", "outline": "&H00000000", "outline_w": 6, "shadow": 3, "margin_v": 340},
        "karaoke": {"size": 62, "primary": "&H0000FFFF", "outline": "&H00101010", "outline_w": 8, "shadow": 0, "margin_v": 320},
        "cinema": {"size": 54, "primary": "&H00F0F0F0", "outline": "&H00181818", "outline_w": 3, "shadow": 2, "margin_v": 300},
    }
    cfg = styles_preset.get(style, styles_preset["clean"])

    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {play_res_x}
PlayResY: {play_res_y}
ScaledBorderAndShadow: yes
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: ShortsStyle,{font_name},{cfg['size']},{cfg['primary']},&H000000FF,{cfg['outline']},&H80000000,-1,0,0,0,100,100,0,0,1,{cfg['outline_w']},{cfg['shadow']},2,60,60,{cfg['margin_v']},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    events = []
    for cue in cues:
        s = seconds_to_ass_time(float(cue.get("start", 0.0)))
        e = seconds_to_ass_time(float(cue.get("end", 0.0)))
        raw_text = str(cue.get("text", "")).strip().replace("\\", "\\\\").replace("{", "\\{").replace("}", "\\}").replace("\n", "\\N")
        events.append(f"Dialogue: 0,{s},{e},ShortsStyle,,0,0,0,,{raw_text}")

    return header + "\n".join(events) + "\n"
