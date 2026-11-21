from pathlib import Path
from typing import List
import cv2
import numpy as np

from app.core.logging import logger

try:
    from scenedetect import detect, ContentDetector, AdaptiveDetector
    SCENEDETECT_AVAILABLE = True
except ImportError:
    SCENEDETECT_AVAILABLE = False


def detect_scene_boundaries(video_path: Path, min_scene_len_seconds: float = 2.0) -> List[float]:
    """
    Detect visual scene change timestamps (in seconds) across the video.
    Uses PySceneDetect if installed; falls back to an efficient sampled histogram detector.
    """
    if not video_path.exists():
        return [0.0]

    cuts: List[float] = [0.0]

    # Try PySceneDetect
    if SCENEDETECT_AVAILABLE:
        try:
            logger.debug(f"Running PySceneDetect on {video_path.name}")
            scene_list = detect(str(video_path), ContentDetector(threshold=27.0, min_scene_len=int(min_scene_len_seconds * 30)))
            for start_time, end_time in scene_list:
                sec = round(start_time.get_seconds(), 2)
                if sec > 0.0 and (not cuts or sec - cuts[-1] >= min_scene_len_seconds):
                    cuts.append(sec)
            return cuts
        except Exception as e:
            logger.warning(f"PySceneDetect encountered error: {e}. Falling back to OpenCV frame diff.")

    # OpenCV sampled HSV histogram fallback
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        return cuts

    fps = float(cap.get(cv2.CAP_PROP_FPS) or 30.0)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    if fps <= 0 or total_frames <= 0:
        cap.release()
        return cuts

    # Sample ~1.5 frames per second
    frame_step = max(1, int(fps * 0.75))
    prev_hist = None
    diffs = []

    for f_idx in range(0, total_frames, frame_step):
        cap.set(cv2.CAP_PROP_POS_FRAMES, f_idx)
        ok, frame = cap.read()
        if not ok or frame is None:
            break

        small = cv2.resize(frame, (160, 90))
        hsv = cv2.cvtColor(small, cv2.COLOR_BGR2HSV)
        hist = cv2.calcHist([hsv], [0, 1], None, [16, 16], [0, 180, 0, 256])
        cv2.normalize(hist, hist)

        t = round(f_idx / fps, 2)
        if prev_hist is not None:
            score = float(cv2.compareHist(prev_hist, hist, cv2.HISTCMP_BHATTACHARYYA))
            diffs.append((t, score))
        prev_hist = hist

    cap.release()

    if diffs:
        scores = [d[1] for d in diffs]
        threshold = float(np.mean(scores) + 1.4 * np.std(scores))
        threshold = max(0.35, threshold)

        last_cut = 0.0
        for t, s in diffs:
            if s >= threshold and (t - last_cut) >= min_scene_len_seconds:
                cuts.append(t)
                last_cut = t

    return cuts
