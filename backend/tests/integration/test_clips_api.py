from app.database.models.clip import Clip
from app.database.models.project import Project
from app.database.models.video import Video


def test_clips_endpoints(client, auth_headers, test_user, db_session):
    vid = Video(
        user_id=test_user.id,
        source_type="upload",
        original_filename="clip_test.mp4",
        stored_filename="source.mp4",
        file_path="uploads/test/source.mp4",
        status="ready",
    )
    db_session.add(vid)
    db_session.flush()

    proj = Project(
        user_id=test_user.id,
        video_id=vid.id,
        title="Clips Project",
        status="ready_for_review",
    )
    db_session.add(proj)
    db_session.flush()

    clip = Clip(
        project_id=proj.id,
        file_path="clips/test/clip1.mp4",
        thumbnail_path="thumbnails/clip1.jpg",
        duration_seconds=30.0,
        width=1080,
        height=1920,
        fps=30,
        subtitle_language="auto",
        status="ready",
    )
    db_session.add(clip)
    db_session.commit()

    # 1. Get clip details
    res = client.get(f"/api/v1/clips/{clip.id}", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["width"] == 1080
    assert res.json()["height"] == 1920

    # 2. List project clips
    list_res = client.get(f"/api/v1/projects/{proj.id}/clips", headers=auth_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1

    # 3. Inspect clip assets
    assets_res = client.get(f"/api/v1/clips/{clip.id}/assets", headers=auth_headers)
    assert assets_res.status_code == 200
    assert assets_res.json()["clip_id"] == clip.id

    # 4. Delete clip
    del_res = client.delete(f"/api/v1/clips/{clip.id}", headers=auth_headers)
    assert del_res.status_code == 200
