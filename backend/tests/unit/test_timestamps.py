from app.utils.timestamps import (
    compute_temporal_overlap,
    parse_timestamp_str,
    seconds_to_ass_time,
    seconds_to_srt_time,
    seconds_to_vtt_time,
)


def test_seconds_to_srt_format():
    assert seconds_to_srt_time(0.0) == "00:00:00,000"
    assert seconds_to_srt_time(65.432) == "00:01:05,432"
    assert seconds_to_srt_time(3661.050) == "01:01:01,050"


def test_seconds_to_vtt_format():
    assert seconds_to_vtt_time(0.0) == "00:00:00.000"
    assert seconds_to_vtt_time(65.432) == "00:01:05.432"


def test_seconds_to_ass_format():
    assert seconds_to_ass_time(65.43) == "0:01:05.43"


def test_parse_timestamp_str():
    assert parse_timestamp_str("01:30.5") == 90.5
    assert parse_timestamp_str("01:00:00") == 3600.0
    assert parse_timestamp_str("45.2") == 45.2


def test_compute_temporal_overlap():
    # Identical intervals
    assert compute_temporal_overlap((10.0, 30.0), (10.0, 30.0)) == 1.0

    # Non-overlapping
    assert compute_temporal_overlap((0.0, 10.0), (15.0, 25.0)) == 0.0

    # Half overlap: [0, 20] and [10, 30] -> intersection 10, union 30 -> 1/3
    iou = compute_temporal_overlap((0.0, 20.0), (10.0, 30.0))
    assert round(iou, 2) == 0.33
