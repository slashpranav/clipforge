import io
from app.database.models.video import Video


def test_youtube_reference_endpoint(client, auth_headers):
    # Valid YouTube URL
    res = client.post(
        "/api/v1/videos/youtube-reference",
        json={"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"},
        headers=auth_headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["video_id"] == "dQw4w9WgXcQ"
    assert "policy_notice" in data
    assert "does not extract or download" in data["policy_notice"]


def test_video_ownership_and_list(client, auth_headers, test_user, db_session):
    # Seed a video directly in DB
    vid = Video(
        user_id=test_user.id,
        source_type="upload",
        original_filename="podcast.mp4",
        stored_filename="source.mp4",
        file_path="uploads/test/vid1/source.mp4",
        duration_seconds=65.0,
        width=1920,
        height=1080,
        fps=30.0,
        status="ready",
    )
    db_session.add(vid)
    db_session.commit()

    # List videos
    res = client.get("/api/v1/videos", headers=auth_headers)
    assert res.status_code == 200
    items = res.json()
    assert len(items) >= 1
    assert items[0]["id"] == vid.id

    # Get single video
    detail_res = client.get(f"/api/v1/videos/{vid.id}", headers=auth_headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["original_filename"] == "podcast.mp4"
