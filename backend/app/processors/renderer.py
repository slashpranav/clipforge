from pathlib import Path
from typing import Any, Dict, List, Optional
from app.core.errors import AppError
from app.core.logging import logger
from app.processors.ffmpeg import get_ffmpeg_binary, probe_media_file
from app.processors.smart_crop import build_ffmpeg_crop_filter
from app.processors.subtitles import generate_ass_content, generate_srt_content, generate_vtt_content
from app.utils.subprocesses import run_command


def render_short_clip(
    source_video_path: Path,
    output_clip_path: Path,
    thumbnail_path: Path,
    start_seconds: float,
    end_seconds: float,
    output_width: int = 1080,
    output_height: int = 1920,
    fps: int = 30,
    smart_crop: bool = True,
    face_track_info: Optional[Dict[str, Any]] = None,
    cues: Optional[List[Dict[str, Any]]] = None,
    burn_subtitles: bool = True,
    subtitle_style: str = "clean",
    crf: int = 22,
) -> Dict[str, Any]:
    """
    Render a 9:16 vertical Short MP4 with face-aware smart crop, optional burned-in subtitles,
    and AAC audio. Generates a thumbnail and verifies output with FFprobe.
    """
    output_clip_path.parent.mkdir(parents=True, exist_ok=True)
    thumbnail_path.parent.mkdir(parents=True, exist_ok=True)
    ffmpeg = get_ffmpeg_binary()

    source_meta = probe_media_file(source_video_path)
    src_w = source_meta["width"]
    src_h = source_meta["height"]
    has_audio = source_meta["audio_present"]

    duration = max(1.0, end_seconds - start_seconds)

    # 1. Prepare subtitles if provided
    ass_file = None
    if cues:
        # Write SRT and VTT alongside clip
        srt_path = output_clip_path.with_suffix(".srt")
        srt_path.write_text(generate_srt_content(cues), encoding="utf-8")

        vtt_path = output_clip_path.with_suffix(".vtt")
        vtt_path.write_text(generate_vtt_content(cues), encoding="utf-8")

        if burn_subtitles:
            ass_path = output_clip_path.with_suffix(".ass")
            ass_path.write_text(generate_ass_content(cues, style=subtitle_style, play_res_x=output_width, play_res_y=output_height), encoding="utf-8")
            ass_file = ass_path

    # 2. Build video filter chain
    crop_scale_filter = build_ffmpeg_crop_filter(
        src_width=src_w,
        src_height=src_h,
        target_width=output_width,
        target_height=output_height,
        smart_crop=smart_crop,
        face_track_info=face_track_info,
    )
    v_filters = [crop_scale_filter, f"fps={fps}", "format=yuv420p"]

    if ass_file and ass_file.exists():
        # Escape path for FFmpeg ass filter
        escaped_ass = ass_file.resolve().as_posix().replace(":", "\\:").replace("'", "\\'")
        v_filters.append(f"ass='{escaped_ass}'")

    filter_str = ",".join(v_filters)

    cmd = [
        ffmpeg,
        "-y",
        "-ss", f"{start_seconds:.3f}",
        "-t", f"{duration:.3f}",
        "-i", str(source_video_path),
        "-vf", filter_str,
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", str(crf),
    ]

    if has_audio:
        cmd.extend(["-c:a", "aac", "-b:a", "128k", "-ar", "44100"])
    else:
        cmd.extend(["-an"])

    cmd.extend(["-movflags", "+faststart", str(output_clip_path)])

    logger.info(f"Rendering clip: {start_seconds:.1f}s to {end_seconds:.1f}s -> {output_clip_path.name}")
    ret, _, stderr = run_command(cmd, timeout=300.0, check=False)
    if ret != 0 or not output_clip_path.exists():
        raise AppError(code="RENDER_FAILED", message=f"Clip rendering failed: {stderr[-200:]}", status_code=500)

    # 3. Generate thumbnail at 1.0s or middle of clip
    thumb_time = min(1.0, duration * 0.5)
    thumb_cmd = [
        ffmpeg,
        "-y",
        "-ss", f"{thumb_time:.2f}",
        "-i", str(output_clip_path),
        "-vframes", "1",
        "-q:v", "3",
        str(thumbnail_path),
    ]
    run_command(thumb_cmd, timeout=30.0, check=False)

    # 4. Verify output with FFprobe
    clip_meta = probe_media_file(output_clip_path)
    logger.info(f"Verified output clip: {clip_meta['width']}x{clip_meta['height']} @ {clip_meta['duration_seconds']}s")

    return {
        "file_path": str(output_clip_path),
        "thumbnail_path": str(thumbnail_path) if thumbnail_path.exists() else None,
        "duration_seconds": clip_meta["duration_seconds"],
        "width": clip_meta["width"],
        "height": clip_meta["height"],
        "fps": int(round(clip_meta["fps"])),
    }
