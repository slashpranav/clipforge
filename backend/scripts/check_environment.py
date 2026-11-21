#!/usr/bin/env python3
"""Diagnostic script to verify system prerequisites, FFmpeg, CPU models, and storage."""
import os
import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import settings
from app.processors.ffmpeg import check_ffmpeg_availability
from app.utils.paths import get_storage_root


def main():
    print("=" * 60)
    print("ClipForge AI — Environment Diagnostics")
    print("=" * 60)
    print(f"Python Version    : {sys.version.split()[0]}")
    print(f"Platform          : {sys.platform} ({os.name})")
    print(f"App Environment   : {settings.app_env}")
    print(f"Database URL      : {settings.database_url}")
    print(f"Storage Directory : {get_storage_root()}")

    # Check FFmpeg
    ff_ok, ff_info = check_ffmpeg_availability()
    print(f"FFmpeg Status     : {'[OK]' if ff_ok else '[FAILED]'} ({ff_info})")

    # Check faster-whisper import
    try:
        import faster_whisper
        print(f"faster-whisper    : [OK] (version {faster_whisper.__version__})")
    except ImportError as e:
        print(f"faster-whisper    : [NOT INSTALLED] ({e})")

    # Check OpenCV
    try:
        import cv2
        print(f"OpenCV            : [OK] (version {cv2.__version__})")
    except ImportError as e:
        print(f"OpenCV            : [NOT INSTALLED] ({e})")

    # Check PySceneDetect
    try:
        import scenedetect
        print(f"PySceneDetect     : [OK] (version {scenedetect.__version__})")
    except ImportError as e:
        print(f"PySceneDetect     : [NOT INSTALLED] ({e})")

    print("=" * 60)
    if not ff_ok:
        print("WARNING: FFmpeg must be installed and accessible on PATH or via imageio-ffmpeg.")
        sys.exit(1)
    else:
        print("System is ready to run ClipForge AI!")
        sys.exit(0)


if __name__ == "__main__":
    main()
