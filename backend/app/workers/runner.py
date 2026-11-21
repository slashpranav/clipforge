import threading
import time
from app.core.logging import logger
from app.database.session import SessionLocal
from app.workers.pipeline import run_project_pipeline
from app.workers.queue import JobQueue

_stop_event = threading.Event()
_worker_thread = None


def worker_loop():
    """Background polling loop claiming and executing queued jobs."""
    logger.info("ClipForge background worker loop started.")
    while not _stop_event.is_set():
        try:
            db = SessionLocal()
            try:
                claimed = JobQueue.claim_next_job(db)
            finally:
                db.close()

            if claimed:
                logger.info(f"Executing pipeline for job {claimed.id}...")
                run_project_pipeline(claimed.id)
            else:
                # Sleep briefly between polls when idle
                time.sleep(1.0)
        except Exception as exc:
            logger.error(f"Error in worker loop: {exc}")
            time.sleep(2.0)
    logger.info("ClipForge background worker loop stopped.")


def start_worker():
    """Start background worker thread."""
    global _worker_thread
    JobQueue.reconcile_stale_jobs_on_startup()
    _stop_event.clear()
    _worker_thread = threading.Thread(target=worker_loop, name="clipforge-worker", daemon=True)
    _worker_thread.start()


def stop_worker():
    """Signal worker thread to gracefully stop."""
    _stop_event.set()
    if _worker_thread:
        _worker_thread.join(timeout=3.0)
