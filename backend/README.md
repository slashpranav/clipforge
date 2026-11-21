# ClipForge AI — Backend Engine

ClipForge AI is a high-performance, local-first backend that transforms long-form video content into engaging, professionally formatted 9:16 vertical shorts (YouTube Shorts / Instagram Reels / TikTok). It runs locally with CPU-first inference, local SQLite persistence, explainable highlight ranking (0–100 heuristic scoring), and automated FFmpeg video processing.

---

## 1. Architectural Highlights

- **Framework**: FastAPI with asynchronous endpoints, dependency injection, and Pydantic v2 schemas.
- **Database & Storage**: SQLite with SQLAlchemy 2.0 ORM, Alembic migrations, and transactional isolation.
- **Security**: Argon2id password hashing (`pwdlib`), JWT Bearer token authentication, and strict multi-tenant ownership enforcement.
- **Path Traversal Protection**: All file access validated against canonical workspace roots (`app/utils/paths.py`).
- **AI Engine (Local & CPU-First)**:
  - **Speech Transcription**: `faster-whisper` (`int8` CPU quantization, lazy model loading & RAM release).
  - **Sentence Boundary Preservation**: Multi-lingual sentence segmenter (supporting Hindi Devanagari punctuation `।` / `॥` and standard English `.` / `?` / `!`).
  - **Explainable Highlight Scoring**: Heuristic 0–100 ranking engine evaluating opening hooks, informativeness, context completeness, audio activity, face framing, and scene transitions (no misleading virality claims).
  - **Scene & Face Processing**: PySceneDetect (adaptive scene cut detection) and OpenCV face-aware smart cropping to 9:16 aspect ratio.
  - **Subtitles**: Subtitle generation with word-level timing, customizable styles (`clean`, `bold_gold`, `karaoke`, `cinema`), and ASS/SRT export or FFmpeg hardcoding.
- **Queue & Pipeline**: Persistent transactional SQLite job table (`jobs`), resilient against process crashes, with stage-by-stage pipeline execution (`QUEUED` -> `EXTRACTING_AUDIO` -> `TRANSCRIBING` -> `DETECTING_SCENES` -> `SCORING_HIGHLIGHTS` -> `READY`).

---

## 2. Directory Layout

```
backend/
├── app/
│   ├── ai/                # AI analysis, language detection, sentence segmenter, highlight scorer
│   ├── api/               # FastAPI route controllers (auth, videos, projects, jobs, highlights, clips, health)
│   ├── config.py          # Pydantic BaseSettings configuration
│   ├── core/              # Errors, structured logging, JWT/Argon2 security, auth dependencies
│   ├── database/          # Base, models (User, Video, Project, Job, Transcript, Highlight, Clip), session, Alembic migrations
│   ├── main.py            # FastAPI application entrypoint with lifespan events & CORS
│   ├── processors/        # FFmpeg, audio extraction, scene detection, face tracking, smart cropping, subtitle generator, renderer
│   ├── schemas/           # Pydantic v2 request/response validation schemas
│   ├── services/          # Business logic services (auth, upload, source, metadata, transcription, highlight, clip, tts)
│   ├── utils/             # Safe path resolution, timestamp formatters (SRT/VTT/ASS), subprocess runner, validators
│   └── workers/           # Persistent SQLite job queue, staged pipeline runner, worker loop
├── scripts/
│   └── check_environment.py # Diagnostic script checking FFmpeg, faster-whisper, OpenCV, and PySceneDetect
├── storage/               # Isolated storage subdirectories (.gitkeep protected)
│   ├── uploads/           # Raw uploaded long videos
│   ├── work/              # Ephemeral per-job scratch files
│   ├── audio/             # Extracted 16kHz WAV audio tracks
│   ├── frames/            # Extracted visual frames for face tracking
│   ├── transcripts/       # JSON transcription files & word-level segments
│   ├── clips/             # Rendered 9:16 vertical MP4 shorts
│   └── thumbnails/        # Generated clip thumbnails
├── tests/
│   ├── conftest.py        # Shared test fixtures (StaticPool in-memory SQLite, mock clients)
│   ├── unit/              # 18 unit tests (security, timestamps, validators, paths, scorer, segmenter)
│   └── integration/       # 8 integration tests (auth, health, videos, projects, jobs, highlights, clips)
├── .env.example           # Documented environment variables template
├── alembic.ini            # Alembic configuration pointing to storage/clipforge.db
├── pyproject.toml         # Build system & pytest configuration
└── requirements.txt       # Frozen dependencies
```

---

## 3. Quickstart & Installation (Windows / Local)

### 3.1 Prerequisites
- Python 3.11+ (Python 3.14 compatible)
- Windows 10/11 x64 (or Linux/macOS)
- FFmpeg (bundled automatically via `imageio-ffmpeg` or installed on system PATH)

### 3.2 Environment Setup
From the `backend` directory:
```powershell
# 1. Create Python virtual environment
python -m venv .venv

# 2. Activate virtual environment
.\.venv\Scripts\Activate.ps1

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy environment configuration
cp .env.example .env
```

### 3.3 Verify System Dependencies
Run the diagnostic script to ensure FFmpeg, OpenCV, and faster-whisper are functioning:
```powershell
python scripts/check_environment.py
```

### 3.4 Database Initialization & Migrations
Initialize the SQLite database with the latest schema migrations:
```powershell
python -m alembic upgrade head
```

### 3.5 Run the Development Server
```powershell
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Interactive API documentation will be available at:
- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **OpenAPI Schema**: [http://127.0.0.1:8000/openapi.json](http://127.0.0.1:8000/openapi.json)

---

## 4. Environment Variables Reference

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `APP_NAME` | `ClipForge AI` | Application branding name |
| `APP_ENV` | `development` | Environment mode (`development`, `production`, `test`) |
| `DEBUG` | `true` | Enable FastAPI debug mode and verbose logging |
| `HOST` | `127.0.0.1` | HTTP binding host |
| `PORT` | `8000` | HTTP listening port |
| `API_PREFIX` | `/api/v1` | Base URL prefix for all REST endpoints |
| `DATABASE_URL` | `sqlite:///./storage/clipforge.db` | SQLAlchemy SQLite connection URI |
| `JWT_SECRET` | `clipforge-dev-secret-...` | Secret key for signing HS256 JWT access tokens |
| `JWT_ALGORITHM` | `HS256` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES`| `60` | Token lifetime before expiration |
| `STORAGE_ROOT` | `./storage` | Base path for media files and rendered assets |
| `MAX_UPLOAD_MB` | `2048` | Maximum video upload size in Megabytes (2 GB) |
| `ALLOWED_VIDEO_EXTENSIONS` | `.mp4,.mov,.mkv,.webm` | Permitted video container formats |
| `MAX_VIDEO_DURATION_SECONDS` | `14400` | Maximum video duration (4 hours) |
| `WHISPER_MODEL` | `small` | faster-whisper model variant (`tiny`, `base`, `small`, `medium`) |
| `WHISPER_DEVICE` | `cpu` | Device backend (`cpu` or `cuda`) |
| `WHISPER_COMPUTE_TYPE` | `int8` | CPU quantization precision |
| `AI_MAX_CONCURRENT_JOBS` | `1` | Max concurrent background AI analysis tasks |
| `FFMPEG_PATH` | `ffmpeg` | Path to ffmpeg binary (falls back to imageio-ffmpeg) |
| `FFPROBE_PATH` | `ffprobe` | Path to ffprobe binary |
| `CORS_ORIGINS` | `http://localhost:3000` | Permitted CORS origins for frontend UI |

---

## 5. API Endpoints Overview

All endpoints are mounted under `/api/v1`:

### Authentication (`/api/v1/auth`)
- `POST /auth/register`: Create a new user account with email and password.
- `POST /auth/login`: Authenticate and receive a JWT Bearer access token.
- `GET /auth/me`: Retrieve current user profile.
- `POST /auth/logout`: Stateless client logout.

### Video Source & Uploads (`/api/v1/videos`)
- `POST /videos/upload`: Multipart video file upload with MIME/magic header validation and metadata extraction.
- `POST /videos/youtube`: Validate YouTube URL, extract canonical video ID, and return oEmbed reference (**never** downloads streams from YouTube directly).
- `GET /videos`: List videos owned by authenticated user.
- `GET /videos/{video_id}`: Get video metadata.
- `DELETE /videos/{video_id}`: Delete video and purge physical storage files.

### Projects (`/api/v1/projects`)
- `POST /projects`: Create a new clipping project tied to an uploaded video.
- `GET /projects`: List user projects.
- `GET /projects/{project_id}`: Project detail with status and configuration.
- `PATCH /projects/{project_id}`: Update project title or settings.
- `DELETE /projects/{project_id}`: Remove project and associated highlights/jobs.

### Jobs & Pipeline (`/api/v1/jobs`)
- `POST /jobs/projects/{project_id}/analyze`: Enqueue background AI analysis job.
- `GET /jobs/{job_id}`: Poll job status, pipeline stage, and percentage progress.
- `POST /jobs/{job_id}/cancel`: Cancel a queued or running job.

### Highlights (`/api/v1/highlights`)
- `GET /highlights/project/{project_id}`: Get ranked candidate highlights with 0–100 scores and breakdown.
- `PATCH /highlights/{highlight_id}`: Adjust timestamps, edit title, or toggle selection.

### Clips & Rendering (`/api/v1/clips`)
- `POST /clips/generate`: Render 9:16 vertical MP4 shorts with smart cropping and subtitles.
- `GET /clips/project/{project_id}`: List rendered clips for a project.
- `GET /clips/{clip_id}`: Clip details and asset status.
- `GET /clips/{clip_id}/download`: Download rendered MP4 video.
- `GET /clips/{clip_id}/subtitles`: Download generated `.srt` or `.vtt` subtitles.
- `POST /clips/{clip_id}/translate`: Request subtitle translation.
- `POST /clips/{clip_id}/voice`: Request Hindi voice-over synthesis.

### Health & Monitoring (`/api/v1/health`)
- `GET /health`: Liveness probe.
- `GET /health/ready`: Readiness probe validating DB connectivity and FFmpeg binary.

---

## 6. Running Tests

The test suite includes 26 unit and integration tests covering security, timestamps, validators, path traversal prevention, sentence segmenters, highlight scoring, and all REST endpoints.

Run the test suite with:
```powershell
pytest -v
```

All 26 tests run in under 2 seconds using an isolated in-memory SQLite database (`StaticPool`).

---

## 7. Policy & Legal Notices

- **YouTube Policy**: ClipForge AI strictly adheres to YouTube Terms of Service and API Guidelines. The `/videos/youtube` endpoint provides URL normalization and oEmbed metadata reference only. Audiovisual streams are **never** scraped or downloaded from YouTube URLs. Users must supply their own authorized local media files.
- **AI Virality Notice**: Highlight scores represent an algorithmic, heuristic engagement estimate (0–100) based on opening hook energy, lexical density, speech patterns, and visual continuity. The system never claims or guarantees that any clip will become viral.
