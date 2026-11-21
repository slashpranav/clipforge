from app.database.models.video import Video


def test_project_crud_flow(client, auth_headers, test_user, db_session):
    # 1. Create a video
    vid = Video(
        user_id=test_user.id,
        source_type="upload",
        original_filename="keynote.mp4",
        stored_filename="source.mp4",
        file_path="uploads/test/keynote/source.mp4",
        duration_seconds=120.0,
        width=1920,
        height=1080,
        fps=30.0,
        status="ready",
    )
    db_session.add(vid)
    db_session.commit()

    # 2. Create project
    proj_res = client.post(
        "/api/v1/projects",
        json={
            "video_id": vid.id,
            "title": "Keynote 9:16 Shorts",
            "settings": {
                "clip_duration_seconds": 40,
                "number_of_highlights": 4,
                "aspect_ratio": "9:16",
                "output_width": 1080,
                "output_height": 1920,
                "smart_crop": True,
            },
        },
        headers=auth_headers,
    )
    assert proj_res.status_code == 201
    proj_data = proj_res.json()
    project_id = proj_data["id"]
    assert proj_data["title"] == "Keynote 9:16 Shorts"
    assert proj_data["settings"]["clip_duration_seconds"] == 40

    # 3. Get project
    get_res = client.get(f"/api/v1/projects/{project_id}", headers=auth_headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == project_id

    # 4. List projects
    list_res = client.get("/api/v1/projects", headers=auth_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # 5. Delete project
    del_res = client.delete(f"/api/v1/projects/{project_id}", headers=auth_headers)
    assert del_res.status_code == 200
