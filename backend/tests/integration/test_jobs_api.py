from app.database.models.project import Project
from app.database.models.video import Video


def test_jobs_enqueue_poll_cancel(client, auth_headers, test_user, db_session):
    vid = Video(
        user_id=test_user.id,
        source_type="upload",
        original_filename="demo.mp4",
        stored_filename="source.mp4",
        file_path="uploads/test/demo/source.mp4",
        duration_seconds=90.0,
        status="ready",
    )
    db_session.add(vid)
    db_session.flush()

    proj = Project(
        user_id=test_user.id,
        video_id=vid.id,
        title="Demo Project",
        settings_json="{}",
        status="created",
    )
    db_session.add(proj)
    db_session.commit()

    # 1. Enqueue job
    enq_res = client.post(f"/api/v1/projects/{proj.id}/process", headers=auth_headers)
    assert enq_res.status_code == 202
    job_data = enq_res.json()
    job_id = job_data["job_id"]
    assert job_data["status"] in ("queued", "running")

    # 2. Poll job status
    poll_res = client.get(f"/api/v1/jobs/{job_id}", headers=auth_headers)
    assert poll_res.status_code == 200
    assert poll_res.json()["id"] == job_id

    # 3. List jobs for project
    jobs_list = client.get(f"/api/v1/projects/{proj.id}/jobs", headers=auth_headers)
    assert jobs_list.status_code == 200
    assert len(jobs_list.json()) >= 1

    # 4. Cancel job
    cancel_res = client.post(f"/api/v1/jobs/{job_id}/cancel", headers=auth_headers)
    assert cancel_res.status_code == 200
