import shutil
from pathlib import Path
from app.core.logging import logger
from app.utils.paths import resolve_safe_path


class CleanupService:
    @staticmethod
    def delete_file_safely(file_path_str: str) -> bool:
        """Safely delete a file verifying it remains within the storage boundary."""
        if not file_path_str:
            return False
        try:
            p = resolve_safe_path(file_path_str)
            if p.is_file():
                p.unlink(missing_ok=True)
                logger.info(f"Deleted file: {p.name}")
                return True
        except Exception as e:
            logger.warning(f"Cleanup error for file {file_path_str}: {e}")
        return False

    @staticmethod
    def delete_directory_safely(dir_path_str: str) -> bool:
        """Safely delete a directory and all contents within storage bounds."""
        if not dir_path_str:
            return False
        try:
            p = resolve_safe_path(dir_path_str)
            if p.is_dir():
                shutil.rmtree(p, ignore_errors=True)
                logger.info(f"Deleted directory: {p.name}")
                return True
        except Exception as e:
            logger.warning(f"Cleanup error for directory {dir_path_str}: {e}")
        return False
