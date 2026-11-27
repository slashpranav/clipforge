from app.ai.highlight_scorer import generate_candidate_highlights, score_window


def test_score_window_weights_and_breakdown():
    text = "What is the biggest secret to success? Over 90 percent of people miss this."
    score, breakdown, reason = score_window(
        text=text,
        duration=28.0,
        target_duration=30.0,
        energy_points=[{"t": 1.0, "energy": 0.8}, {"t": 15.0, "energy": 0.75}],
        scene_cuts=[10.5],
        start_time=0.0,
        end_time=28.0,
        has_face=True,
    )

    assert 0.0 <= score <= 100.0
    assert "hook_curiosity" in breakdown
    assert "semantic_informativeness" in breakdown
    assert "context_completeness" in breakdown
    assert "speech_audio_activity" in breakdown
    assert "visual_framing_quality" in breakdown
    assert "scene_change_context" in breakdown
    assert len(reason) > 5


def test_generate_candidate_highlights_deduplication():
    sentences = [
        {"start": 0.0, "end": 12.0, "text": "Why do most founders fail in the first year?"},
        {"start": 12.2, "end": 26.0, "text": "They fail because they build things nobody wants."},
        {"start": 26.5, "end": 40.0, "text": "Listen to your users every single day without excuses."},
        {"start": 40.2, "end": 55.0, "text": "And that is how you build a lasting sustainable business."},
    ]

    highlights = generate_candidate_highlights(
        sentences=sentences,
        source_duration=60.0,
        target_duration=25.0,
        number_of_highlights=3,
    )

    assert len(highlights) >= 1
    # Verify no candidate exceeds source duration
    for h in highlights:
        assert h["end_seconds"] <= 60.0
        assert h["start_seconds"] >= 0.0
        assert h["score"] > 0


def test_generate_multi_clips_10_and_15():
    sentences = [
        {"start": float(i * 4), "end": float(i * 4 + 3.8), "text": f"Sentence number {i} with interesting fact."}
        for i in range(20)
    ]
    highlights_10 = generate_candidate_highlights(
        sentences=sentences,
        source_duration=80.0,
        target_duration=15.0,
        number_of_highlights=10,
    )
    assert len(highlights_10) == 10
    assert all(h["selected"] is True for h in highlights_10)

    highlights_15 = generate_candidate_highlights(
        sentences=sentences,
        source_duration=120.0,
        target_duration=15.0,
        number_of_highlights=15,
    )
    assert len(highlights_15) == 15
    assert all(h["selected"] is True for h in highlights_15)
