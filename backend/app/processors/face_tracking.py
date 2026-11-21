from pathlib import Path
from typing import Any, Dict, List
import cv2
import numpy as np


def _load_cascades():
    cascade_dir = cv2.data.haarcascades
    frontal = cv2.CascadeClassifier(str(Path(cascade_dir) / "haarcascade_frontalface_default.xml"))
    profile = cv2.CascadeClassifier(str(Path(cascade_dir) / "haarcascade_profileface.xml"))
    return frontal, profile


def track_faces_in_interval(
    video_path: Path,
    start_time: float,
    end_time: float,
    sample_fps: float = 1.5,
) -> Dict[str, Any]:
    """
    Sample frames in [start_time, end_time] at ~1-2 fps to detect faces and calculate
    normalized horizontal centroid (cx in [0, 1]) for intelligent 9:16 framing.
    """
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        return {
            "median_cx": 0.5,
            "face_ratio": 0.0,
            "keyframes": [{"t": 0.0, "cx": 0.5}],
        }

    src_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 1920)
    src_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 1080)
    fps = float(cap.get(cv2.CAP_PROP_FPS) or 30.0)
    if fps <= 0:
        fps = 30.0

    frontal, profile = _load_cascades()
    duration = max(0.5, end_time - start_time)
    num_samples = min(60, max(4, int(duration * sample_fps)))
    step_sec = duration / max(1, num_samples)

    points: List[Dict[str, Any]] = []
    face_hits = 0

    for idx in range(num_samples):
        rel_t = idx * step_sec
        abs_t = start_time + rel_t
        cap.set(cv2.CAP_PROP_POS_MSEC, abs_t * 1000.0)
        ok, frame = cap.read()
        if not ok or frame is None:
            continue

        # Scale down for fast CPU face detection
        scale = 360.0 / max(1, src_w)
        sw, sh = max(32, int(src_w * scale)), max(32, int(src_h * scale))
        small = cv2.resize(frame, (sw, sh))
        gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
        gray = cv2.equalizeHist(gray)

        faces = frontal.detectMultiScale(gray, scaleFactor=1.2, minNeighbors=4, minSize=(20, 20))
        if len(faces) == 0 and not profile.empty():
            faces = profile.detectMultiScale(gray, scaleFactor=1.2, minNeighbors=3, minSize=(20, 20))

        if len(faces) > 0:
            face_hits += 1
            # Weighted average center-x by face area
            total_area = 0.0
            sum_cx = 0.0
            for (x, y, w, h) in faces:
                area = float(w * h)
                cx = (x + w * 0.5) / sw
                sum_cx += cx * area
                total_area += area
            avg_cx = sum_cx / max(1.0, total_area)
            points.append({"t": round(rel_t, 2), "cx": round(float(np.clip(avg_cx, 0.15, 0.85)), 3)})
        else:
            # Fallback to center or previous cx
            prev_cx = points[-1]["cx"] if points else 0.5
            points.append({"t": round(rel_t, 2), "cx": prev_cx})

    cap.release()

    if not points:
        return {
            "median_cx": 0.5,
            "face_ratio": 0.0,
            "keyframes": [{"t": 0.0, "cx": 0.5}],
        }

    # Exponential moving average filter for smooth pan
    smoothed = []
    alpha = 0.3
    cur_cx = points[0]["cx"]
    for pt in points:
        cur_cx = alpha * pt["cx"] + (1.0 - alpha) * cur_cx
        smoothed.append({"t": pt["t"], "cx": round(float(cur_cx), 3)})

    all_cx = [p["cx"] for p in smoothed]
    median_cx = round(float(np.median(all_cx)), 3)
    ratio = round(face_hits / max(1, len(points)), 2)

    return {
        "median_cx": median_cx,
        "face_ratio": ratio,
        "keyframes": smoothed,
    }
