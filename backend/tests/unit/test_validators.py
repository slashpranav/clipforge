import pytest

from app.core.errors import AppError
from app.utils.validators import (
    validate_file_size_limit,
    validate_video_file_extension,
    validate_youtube_url,
)


def test_validate_youtube_url_valid_formats():
    v1, u1 = validate_youtube_url("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    assert v1 == "dQw4w9WgXcQ"
    assert u1 == "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

    v2, u2 = validate_youtube_url("https://youtu.be/dQw4w9WgXcQ")
    assert v2 == "dQw4w9WgXcQ"

    v3, u3 = validate_youtube_url("https://www.youtube.com/shorts/dQw4w9WgXcQ")
    assert v3 == "dQw4w9WgXcQ"


def test_validate_youtube_url_invalid():
    with pytest.raises(AppError):
        validate_youtube_url("https://example.com/video")

    with pytest.raises(AppError):
        validate_youtube_url("")


def test_validate_video_file_extension():
    assert validate_video_file_extension("my_podcast.mp4") == ".mp4"
    assert validate_video_file_extension("interview.MOV") == ".mov"
    assert validate_video_file_extension("lecture.mkv") == ".mkv"

    with pytest.raises(AppError):
        validate_video_file_extension("malware.exe")


def test_validate_file_size_limit():
    validate_file_size_limit(1024 * 1024 * 50)  # 50 MB is fine

    with pytest.raises(AppError):
        validate_file_size_limit(1024 * 1024 * 1024 * 5)  # 5 GB exceeds 2048 MB limit
