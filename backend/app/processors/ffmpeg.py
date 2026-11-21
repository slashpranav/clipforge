import json
import os
import shutil
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

from app.config import settings
from app.core.errors import AppError
from app.core.logging import logger
from app.utils.subprocesses import run_command

try:
    import imageio_ffmpeg
except ImportError:
    imageio_ffmpeg = None


def get_ffmpeg_binary() -> str:
    """Resolve FFmpeg binary path from config, system PATH, or imageio_ffmpeg."""
    cfg = settings.ffmpeg_path
    if cfg and shutil.which(cfg):
        return cfg
    sys_ffmpeg = shutil.which("ffmpeg")
    if sys_ffmpeg:
        return sys_ffmpeg
    if imageio_ffmpeg is not None:
        return imageio_ffmpeg.get_ffmpeg_exe()
    raise AppError(
        code="FFMPEG_MISSING",
        message="FFmpeg executable not found. Ensure FFmpeg is installed or imageio-ffmpeg is available.",
        status_code=500,
    )


def get_ffprobe_binary() -> str:
    """Resolve FFprobe binary path from config, system PATH, or adjacent to ffmpeg."""
    cfg = settings.ffprobe_path
    if cfg and shutil.which(cfg):
        return cfg
    sys_ffprobe = shutil.which("ffprobe")
    if sys_ffprobe:
        return sys_ffprobe

    # Look adjacent to ffmpeg
    try:
        ffmpeg_bin = Path(get_ffmpeg_binary())
        probe_cand = ffmpeg_bin.parent / ("ffprobe.exe" if os.name == "nt" else "ffprobe")
        if probe_cand.exists():
            return str(probe_cand)
    except Exception:
        pass

    # Fallback to ffmpeg -i if ffprobe binary is standalone
    return get_ffmpeg_binary()


def check_ffmpeg_availability() -> Tuple[bool, str]:
    """Test availability of FFmpeg."""
    try:
        bin_path = get_ffmpeg_binary()
        ret, stdout, stderr = run_command([bin_path, "-version"], timeout=10.0, check=False)
        if ret == 0:
            first_line = stdout.splitlines()[0] if stdout else "FFmpeg available"
            return True, first_line
        return False, stderr
    except Exception as exc:
        return False, str(exc)


def probe_media_file(file_path: Path) -> Dict[str, Any]:
    """
    Extract container format, duration, dimensions, framerate, and audio presence
    accurately using ffprobe (or ffmpeg fallback).
    """
    if not file_path.exists():
        raise AppError(code="FILE_NOT_FOUND", message=f"Target media file does not exist: {file_path.name}", status_code=404)

    ffprobe = get_ffprobe_binary()
    meta = {
        "format_name": file_path.suffix.lstrip(".").lower(),
        "duration_seconds": 0.0,
        "size_bytes": file_path.stat().st_size,
        "width": 1920,
        "height": 1080,
        "fps": 30.0,
        "audio_present": False,
        "video_codec": "unknown",
        "audio_codec": "none",
    }

    # If ffprobe is available, run json probe
    if "ffprobe" in Path(ffprobe).name.lower():
        cmd = [
            ffprobe,
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            str(file_path),
        ]
        ret, stdout, _ = run_command(cmd, timeout=30.0, check=False)
        if ret == 0 and stdout:
            try:
                data = json.loads(stdout)
                fmt = data.get("format", {})
                meta["duration_seconds"] = round(float(fmt.get("duration", 0.0)), 2)
                meta["format_name"] = str(fmt.get("format_name", meta["format_name"]))

                for stream in data.get("streams", []):
                    c_type = stream.get("codec_type")
                    if c_type == "video" and meta["video_codec"] == "unknown":
                        meta["video_codec"] = stream.get("codec_name", "unknown")
                        meta["width"] = int(stream.get("width") or meta["width"])
                        meta["height"] = int(stream.get("height") or meta["height"])
                        r_frame = stream.get("r_frame_rate", "30/1")
                        try:
                            if "/" in r_frame:
                                num, den = r_frame.split("/")
                                if float(den) > 0:
                                    meta["fps"] = round(float(num) / float(den), 2)
                            else:
                                meta["fps"] = round(float(r_frame), 2)
                        except Exception:
                            meta["fps"] = 30.0
                    elif c_type == "audio":
                        meta["audio_present"] = True
                        meta["audio_codec"] = stream.get("codec_name", "unknown")

                return meta
            except Exception as e:
                logger.warning(f"Error parsing ffprobe output: {e}")

    # Fallback using ffmpeg -i parsing
    ffmpeg = get_ffmpeg_binary()
    ret, _, stderr = run_command([ffmpeg, "-hide_banner", "-i", str(file_path)], timeout=20.0, check=False)
    import re

    dur_match = re.search(r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)", stderr)
    if dur_match:
        h, m, s = int(dur_match.group(1)), int(dur_match.group(2)), float(dur_match.group(3))
        meta["duration_seconds"] = round(h * 3600 + m * 60 + s, 2)

    res_match = re.search(r",\s*(\d{2,5})x(\d{2,5})", stderr)
    if res_match:
        meta["width"] = int(res_match.group(1))
        meta["height"] = int(res_match.group(2))

    fps_match = re.search(r"(\d+(?:\.\d+)?)\s*fps", stderr)
    if fps_match:
        meta["fps"] = round(float(fps_match.group(1)), 2)

    if "Audio:" in stderr:
        meta["audio_present"] = True

    return meta
