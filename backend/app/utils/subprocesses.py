import os
import signal
import subprocess
from typing import List, Optional, Tuple
from app.core.errors import AppError
from app.core.logging import logger


def run_command(
    args: List[str],
    timeout: Optional[float] = 300.0,
    check: bool = True,
    cwd: Optional[str] = None,
) -> Tuple[int, str, str]:
    """
    Run an external binary safely using argument array without shell interpolation.
    Captures stdout and stderr, enforces timeout, and cleans up child processes properly.
    """
    cmd_str = " ".join(args[:4]) + ("..." if len(args) > 4 else "")
    logger.debug(f"Executing subprocess: {cmd_str}")

    try:
        proc = subprocess.Popen(
            args,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            errors="replace",
            cwd=cwd,
            shell=False,
        )
        stdout, stderr = proc.communicate(timeout=timeout)
        ret = proc.returncode

        if check and ret != 0:
            tail_err = "".join(stderr.splitlines()[-15:]) if stderr else f"Exit code {ret}"
            raise AppError(
                code="SUBPROCESS_FAILED",
                message=f"Command '{args[0]}' failed: {tail_err}",
                status_code=500,
            )
        return ret, stdout, stderr

    except subprocess.TimeoutExpired:
        logger.error(f"Subprocess timed out after {timeout}s: {args[0]}")
        try:
            proc.kill()
            proc.communicate()
        except Exception:
            pass
        raise AppError(
            code="SUBPROCESS_TIMEOUT",
            message=f"Process '{args[0]}' exceeded execution timeout limit of {timeout}s.",
            status_code=504,
        )
    except FileNotFoundError:
        raise AppError(
            code="BINARY_NOT_FOUND",
            message=f"Required executable '{args[0]}' was not found on system PATH.",
            status_code=500,
        )
