import httpx
from typing import Any, Dict
from app.core.errors import AppError
from app.core.logging import logger
from app.schemas.video import YouTubeReferenceResponse
from app.utils.validators import validate_youtube_url


class SourceService:
    @staticmethod
    def get_youtube_metadata_reference(url: str) -> YouTubeReferenceResponse:
        """
        Validate YouTube URL and retrieve authorized public metadata via YouTube's official oEmbed API.
        Strictly does NOT download audiovisual streams.
        """
        video_id, canonical_url = validate_youtube_url(url)
        title = None
        author = None
        thumbnail_url = f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
        embed_url = f"https://www.youtube.com/embed/{video_id}"

        # Try official YouTube oEmbed endpoint (no API key required)
        try:
            oembed_endpoint = f"https://www.youtube.com/oembed?url={canonical_url}&format=json"
            with httpx.Client(timeout=6.0) as client:
                resp = client.get(oembed_endpoint)
                if resp.status_code == 200:
                    data = resp.json()
                    title = data.get("title")
                    author = data.get("author_name")
                    if data.get("thumbnail_url"):
                        thumbnail_url = data.get("thumbnail_url")
        except Exception as exc:
            logger.debug(f"oEmbed metadata lookup skipped or failed: {exc}")

        return YouTubeReferenceResponse(
            video_id=video_id,
            canonical_url=canonical_url,
            title=title or f"YouTube Video ({video_id})",
            author=author,
            duration_seconds=None,
            thumbnail_url=thumbnail_url,
            embed_url=embed_url,
        )
