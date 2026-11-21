#!/usr/bin/env python3
"""Cleanup script to purge temporary work folders and orphaned clips."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.utils.paths import get_storage_root


def cleanup_temp_directories():
    root = get_storage_root()
    work_dir = root / "work"
    count = 0
    if work_dir.exists():
        for item in work_dir.iterdir():
            if item.is_dir():
                import shutil
                shutil.rmtree(item, ignore_errors=True)
                count += 1
            elif item.is_file() and item.name != ".gitkeep":
                item.unlink(missing_ok=True)
                count += 1
    print(f"Cleaned up {count} temporary items from storage/work/.")


if __name__ == "__main__":
    cleanup_temp_directories()
