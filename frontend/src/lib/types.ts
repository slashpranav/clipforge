export interface User {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
  expires_in_seconds: number;
}

export interface Video {
  id: string;
  user_id: string;
  source_type: 'upload' | 'youtube_reference';
  original_filename: string;
  stored_filename: string;
  mime_type: string;
  size_bytes: number;
  duration_seconds: number;
  width: number;
  height: number;
  fps: number;
  audio_present: boolean;
  status: string;
  created_at: string;
}

export interface YouTubeReference {
  video_id: string;
  canonical_url: string;
  title?: string;
  author?: string;
  duration_seconds?: number;
  thumbnail_url?: string;
  embed_url: string;
  policy_notice: string;
}

export interface SubtitleSettings {
  enabled: boolean;
  mode: 'original' | 'translated';
  language: string;
  style: 'clean' | 'bold_gold' | 'karaoke' | 'cinema';
}

export interface TranslationSettings {
  enabled: boolean;
  target_language: string;
}

export interface VoiceSettings {
  enabled: boolean;
  target_language: string;
  style: 'energetic' | 'storytelling' | 'emotional' | 'suspenseful' | 'funny' | 'motivational';
}

export interface ProjectSettings {
  clip_duration_seconds: number;
  number_of_highlights: number;
  aspect_ratio: '9:16' | '1:1' | '16:9' | '4:5';
  output_width: number;
  output_height: number;
  subtitle: SubtitleSettings;
  translation: TranslationSettings;
  voice: VoiceSettings;
  smart_crop: boolean;
}

export interface Project {
  id: string;
  user_id: string;
  video_id: string;
  title: string;
  settings: ProjectSettings;
  status: 'created' | 'analyzing' | 'ready' | 'rendering' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  project_id: string;
  job_type: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  stage: string;
  progress: number;
  message: string;
  error_code?: string;
  error_message?: string;
  attempt_count: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface ScoreBreakdown {
  hook_curiosity: number;
  semantic_informativeness: number;
  context_completeness: number;
  speech_audio_activity: number;
  visual_framing_quality: number;
  scene_change_context: number;
}

export interface Highlight {
  id: string;
  project_id: string;
  start_seconds: number;
  end_seconds: number;
  duration_seconds: number;
  score: number;
  title: string;
  reason: string;
  transcript_excerpt: string;
  score_breakdown: ScoreBreakdown;
  selected: boolean;
  created_at: string;
}

export interface Clip {
  id: string;
  project_id: string;
  highlight_id?: string;
  file_path: string;
  thumbnail_path?: string;
  duration_seconds: number;
  width: number;
  height: number;
  fps: number;
  subtitle_language: string;
  status: 'rendered' | 'processing' | 'failed';
  created_at: string;
  download_url: string;
}

export interface ClipAsset {
  clip_id: string;
  video_available: boolean;
  thumbnail_available: boolean;
  srt_available: boolean;
  vtt_available: boolean;
  download_url: string;
  srt_url?: string;
  vtt_url?: string;
}

export interface HealthStatus {
  status: string;
  app_name: string;
  environment: string;
}

export interface ReadinessStatus {
  status: string;
  database_connected: boolean;
  ffmpeg_available: boolean;
  ffmpeg_version: string;
  cpu_mode: boolean;
  whisper_configured_model: string;
}
