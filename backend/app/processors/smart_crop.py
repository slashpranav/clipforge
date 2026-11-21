from typing import Any, Dict, List, Tuple


def calculate_crop_dimensions(
    src_width: int,
    src_height: int,
    target_width: int = 1080,
    target_height: int = 1920,
) -> Tuple[int, int]:
    """
    Calculate the source crop rectangle (crop_w, crop_h) that matches the target aspect ratio.
    Ensures even pixel dimensions for H.264 compatibility.
    """
    target_ar = target_width / float(target_height)
    src_ar = src_width / float(max(1, src_height))

    if src_ar > target_ar:
        # Source is wider than 9:16 (e.g. 16:9 landscape) -> crop width
        crop_h = src_height
        crop_w = int(round(src_height * target_ar)) // 2 * 2
        crop_w = min(src_width, crop_w)
    else:
        # Source is taller or equal -> crop height
        crop_w = src_width
        crop_h = int(round(src_width / target_ar)) // 2 * 2
        crop_h = min(src_height, crop_h)

    return crop_w, crop_h


def build_ffmpeg_crop_filter(
    src_width: int,
    src_height: int,
    target_width: int = 1080,
    target_height: int = 1920,
    smart_crop: bool = True,
    face_track_info: Dict[str, Any] = None,
) -> str:
    """
    Generate an FFmpeg crop filter string.
    If smart_crop is enabled and keyframes exist, builds smooth pan or centered framing.
    """
    crop_w, crop_h = calculate_crop_dimensions(src_width, src_height, target_width, target_height)
    max_x = max(0, src_width - crop_w)
    max_y = max(0, src_height - crop_h)

    if max_x == 0 and max_y == 0:
        return f"scale={target_width}:{target_height}"

    if not smart_crop or not face_track_info:
        # Static center crop
        x = max_x // 2
        y = max_y // 2
        return f"crop={crop_w}:{crop_h}:{x}:{y},scale={target_width}:{target_height}"

    keyframes = face_track_info.get("keyframes", [])
    if not keyframes or len(keyframes) < 2:
        cx = face_track_info.get("median_cx", 0.5)
        x = int(max(0, min(max_x, round(cx * src_width - crop_w * 0.5))))
        y = max_y // 2
        return f"crop={crop_w}:{crop_h}:{x}:{y},scale={target_width}:{target_height}"

    # Sample up to 6 control points for smooth linear interpolation across clip
    step = max(1, len(keyframes) // 5)
    pts = keyframes[::step]
    if pts[-1]["t"] != keyframes[-1]["t"]:
        pts.append(keyframes[-1])

    def cx_to_x(val: float) -> int:
        return int(max(0, min(max_x, round(val * src_width - crop_w * 0.5))))

    expr = str(cx_to_x(pts[-1]["cx"]))
    for i in range(len(pts) - 2, -1, -1):
        t0, t1 = float(pts[i]["t"]), float(pts[i + 1]["t"])
        x0, x1 = cx_to_x(pts[i]["cx"]), cx_to_x(pts[i + 1]["cx"])
        dt = max(0.1, t1 - t0)
        if x0 == x1:
            seg = f"{x0}"
        else:
            seg = f"({x0}+({x1}-{x0})*clip((t-{t0:.2f})/{dt:.2f},0,1))"
        expr = f"if(lt(t,{t1:.2f}),{seg},{expr})"

    y = max_y // 2
    return f"crop={crop_w}:{crop_h}:'{expr}':{y},scale={target_width}:{target_height}"
