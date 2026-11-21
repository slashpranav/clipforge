from app.database.models.highlight import Highlight
from app.database.models.project import Project
from app.database.models.video import Video


def test_highlights_crud_and_patch(client, auth_headers, test_user, db_session):
    vid = Video(
        user_id=test_user.id,
        source_type="upload",
        original_filename="talk.mp4",
        stored_filename="source.mp4",
        file_path="uploads/test/talk/source.mp4",
        status="ready",
    )
    db_session.add(vid)
    db_session.flush()

    proj = Project(
        user_id=test_user.id,
        video_id=vid.id,
        title="Talk Project",
        status="ready_for_review",
    )
    db_session.add(proj)
    db_session.flush()

    hl = Highlight(
        project_id=proj.id,
        start_seconds=10.0,
        end_seconds=40.0,
        score=88.5,
        title="Opening Hook Statement",
        reason="Clear question and high vocal energy.",
        transcript_excerpt="Why do people struggle with focus?",
        score_breakdown_json='{"hook_curiosity": 22.0, "semantic_informativeness": 20.0}',
        selected=False,
    )
    db_session.add(hl)
    db_session.commit()

    # 1. List highlights
    res = client.get(f"/api/v1/projects/{proj.id}/highlights", headers=auth_headers)
    assert res.status_code == 200
    items = res.json()
    assert len(items) == 1
    assert items[0]["score"] == 88.5

    # 2. Patch highlight (adjust timestamps and select)
    patch_res = client.patch(
        f"/api/v1/highlights/{hl.id}",
        json={"start_seconds": 12.0, "end_seconds": 42.0, "selected": True},
        headers=auth_headers,
    )
    assert patch_res.status_code == 200
    updated = patch_res.json()
    assert updated["start_seconds"] == 12.0
    assert updated["end_seconds"] == 42.0
    assert updated["selected"] is True
