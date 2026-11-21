import wave
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import numpy as np

from app.core.logging import logger
from app.processors.ffmpeg import get_ffmpeg_binary
from app.utils.subprocesses import run_command


def extract_audio_to_wav(video_path: Path, output_wav_path: Path, sample_rate: int = 16000) -> Optional[Path]:
    """
    Extract audio as mono 16 kHz PCM WAV (pcm_s16le) for Whisper transcription.
    Returns the output path if successful, or None if the video has no audio track.
    """
    output_wav_path.parent.mkdir(parents=True, exist_ok=True)
    ffmpeg = get_ffmpeg_binary()

    cmd = [
        ffmpeg,
        "-y",
        "-i", str(video_path),
        "-vn",
        "-ac", "1",
        "-ar", str(sample_rate),
        "-c:a", "pcm_s16le",
        str(output_wav_path),
    ]

    ret, _, stderr = run_command(cmd, timeout=300.0, check=False)
    if ret == 0 and output_wav_path.exists() and output_wav_path.stat().st_size > 100:
        return output_wav_path

    # If failure was due to no audio stream, log info and return None
    if "does not contain any stream" in stderr or "Output file is empty" in stderr:
        logger.info(f"Video {video_path.name} does not have an audio stream.")
        return None

    logger.warning(f"Audio extraction failed for {video_path.name}: {stderr[-200:]}")
    return None


def calculate_audio_energy(
    wav_path: Path,
    bucket_seconds: float = 1.0,
) -> Tuple[List[Dict[str, float]], List[Tuple[float, float]]]:
    """
    Calculate normalized audio RMS energy over time and detect speech/silence intervals.
    Returns (energy_curve, speech_intervals).
    """
    if not wav_path or not wav_path.exists():
        return [], []

    try:
        with wave.open(str(wav_path), "rb") as wf:
            sr = wf.getframerate()
            n_channels = wf.getnchannels()
            n_frames = wf.getnframes()
            raw_bytes = wf.readframes(n_frames)
    except Exception as e:
        logger.warning(f"Could not open wav file {wav_path}: {e}")
        return [], []

    if not raw_bytes or sr <= 0:
        return [], []

    samples = np.frombuffer(raw_bytes, dtype=np.int16).astype(np.float32) / 32768.0
    if n_channels > 1:
        samples = samples.reshape(-1, n_channels).mean(axis=1)

    total_samples = len(samples)
    total_duration = total_samples / sr
    if total_duration <= 0:
        return [], []

    # Adaptive bucket step
    step = max(1, int(sr * bucket_seconds))
    rms_points: List[Tuple[float, float]] = []

    for idx in range(0, total_samples, step):
        chunk = samples[idx : idx + step]
        if len(chunk) == 0:
            continue
        rms = float(np.sqrt(np.mean(chunk * chunk)))
        t = round(idx / sr, 2)
        rms_points.append((t, rms))

    if not rms_points:
        return [], []

    max_rms = max(r for _, r in rms_points) or 1e-6
    energy_curve = [
        {"t": t, "energy": round(min(1.0, val / max_rms), 3)}
        for t, val in rms_points
    ]

    # Detect speech intervals with fine-grained 0.25s chunks
    fine_step = max(1, int(sr * 0.25))
    fine_rms = []
    for i in range(0, total_samples, fine_step):
        c = samples[i : i + fine_step]
        fine_rms.append(float(np.sqrt(np.mean(c * c))) if len(c) else 0.0)

    median_val = float(np.median(fine_rms)) if fine_rms else 0.01
    silence_thresh = max(0.008, min(0.04, median_val * 0.4))

    speech_intervals: List[Tuple[float, float]] = []
    in_speech = False
    seg_start = 0.0
    for idx, val in enumerate(fine_rms):
        t = idx * 0.25
        if val >= silence_thresh and not in_speech:
            in_speech = True
            seg_start = t
        elif val < silence_thresh and in_speech:
            in_speech = False
            if t - seg_start >= 0.5:
                speech_intervals.append((round(seg_start, 2), round(t, 2)))
    if in_speech:
        speech_intervals.append((round(seg_start, 2), round(total_duration, 2)))

    return energy_curve, speech_intervals
