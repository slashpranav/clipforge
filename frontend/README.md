# ClipForge AI — Next.js Frontend Dashboard

ClipForge AI Frontend is a modern, minimal, dark-themed dashboard built with **Next.js 14**, **React 18**, **Tailwind CSS**, and **Lucide Icons**. It connects seamlessly to the local FastAPI backend to transform long videos into 9:16 vertical shorts.

---

## 1. Features & Pages

- **Dashboard (`/`)**: High-level metrics (total videos, active projects, rendered clips, CPU engine state) with quick project actions.
- **New Project (`/projects/new`)**:
  - Source video input: Local file drag-and-drop / upload with live progress bar or YouTube reference validation.
  - Customization options: Target clip duration (15s–60s), target highlight count, aspect ratio (9:16), Hindi subtitle styles (`bold_gold`, `clean`, `karaoke`, `cinema`), and Hindi voice-over styles.
- **Project History (`/projects`)**: List and filter all projects, view status badges, and launch into the Studio.
- **Project Studio (`/projects/[id]`)**:
  - **Best Scene Detection**: Ranked list of 10–20 clipping opportunities with explainable 0–100 heuristic scores, factor breakdowns, transcript excerpts, and in-place timestamp fine-tuning.
  - **Pipeline Monitor**: Real-time polling of background AI stages (`EXTRACTING_AUDIO` -> `TRANSCRIBING` -> `DETECTING_SCENES` -> `SCORING_HIGHLIGHTS` -> `READY`).
  - **Clip Editor**: 1-click batch rendering of 9:16 vertical MP4 shorts with smart face tracking and burned subtitles.
  - **9:16 Video Player**: Interactive vertical preview modal with caption tracks.
  - **Voice-over Studio**: Synthesize expressive Hindi narration across styles (`energetic`, `storytelling`, `motivational`, etc.).
  - **Export Center**: Download MP4 videos, `.srt`, and `.vtt` subtitles.
- **System Health (`/health`)**: Diagnostics verifying FastAPI server, SQLite database, and FFmpeg binaries.
- **Authentication (`/auth`)**: JWT-based login/registration with one-click developer credentials fill.

---

## 2. Quickstart

### 2.1 Prerequisites
- Node.js 18+ (tested with v22.20.0)
- ClipForge AI FastAPI Backend running on `http://127.0.0.1:8000`

### 2.2 Setup & Run
From the `frontend` folder:
```powershell
# 1. Install dependencies (if not already installed)
npm install

# 2. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 3. Environment Variables

Configured in `.env.local`:
```ini
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
```
