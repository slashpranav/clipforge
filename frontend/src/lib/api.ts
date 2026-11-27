import {
  AuthTokens,
  Clip,
  ClipAsset,
  HealthStatus,
  Highlight,
  Job,
  Project,
  ProjectSettings,
  ReadinessStatus,
  User,
  Video,
  YouTubeReference,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('clipforge_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('clipforge_token', token);
      } else {
        localStorage.removeItem('clipforge_token');
      }
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('clipforge_token');
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    const token = this.getToken();
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Do not set Content-Type if body is FormData
    if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        } else if (errorData.error && errorData.error.message) {
          errorMessage = errorData.error.message;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // Fallback to response text
        const text = await response.text();
        if (text) errorMessage = text;
      }
      throw new Error(errorMessage);
    }

    // For 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // ---------------- AUTH ----------------
  async register(email: string, password: string): Promise<User> {
    return this.request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async login(email: string, password: string): Promise<AuthTokens> {
    const data = await this.request<AuthTokens>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.access_token);
    return data;
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    } finally {
      this.setToken(null);
    }
  }

  // ---------------- VIDEOS ----------------
  async uploadVideo(file: File, onProgress?: (percent: number) => void): Promise<Video> {
    const token = this.getToken();
    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}/videos/upload`);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            reject(new Error('Invalid JSON response from server'));
          }
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.error?.message || err.detail || 'Upload failed'));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => reject(new Error('Network error during file upload'));
      xhr.send(formData);
    });
  }

  async checkYouTubeUrl(url: string): Promise<YouTubeReference> {
    return this.request<YouTubeReference>('/videos/youtube-reference', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  }

  async listVideos(): Promise<Video[]> {
    return this.request<Video[]>('/videos');
  }

  async getVideo(videoId: string): Promise<Video> {
    return this.request<Video>(`/videos/${videoId}`);
  }

  async deleteVideo(videoId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/videos/${videoId}`, {
      method: 'DELETE',
    });
  }

  // ---------------- PROJECTS ----------------
  async createProject(videoId: string, title: string, settings?: Partial<ProjectSettings>): Promise<Project> {
    return this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify({
        video_id: videoId,
        title,
        settings: settings || {},
      }),
    });
  }

  async listProjects(): Promise<Project[]> {
    return this.request<Project[]>('/projects');
  }

  async getProject(projectId: string): Promise<Project> {
    return this.request<Project>(`/projects/${projectId}`);
  }

  async updateProject(projectId: string, title?: string, settings?: Partial<ProjectSettings>): Promise<Project> {
    return this.request<Project>(`/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title,
        settings,
      }),
    });
  }

  async deleteProject(projectId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/projects/${projectId}`, {
      method: 'DELETE',
    });
  }

  // ---------------- JOBS / PIPELINE ----------------
  async startAnalysis(projectId: string): Promise<{ job_id: string; status: string; stage: string; progress: number; message: string }> {
    return this.request(`/projects/${projectId}/process`, {
      method: 'POST',
    });
  }

  async getJob(jobId: string): Promise<Job> {
    return this.request<Job>(`/jobs/${jobId}`);
  }

  async listProjectJobs(projectId: string): Promise<Job[]> {
    return this.request<Job[]>(`/projects/${projectId}/jobs`);
  }

  async cancelJob(jobId: string): Promise<Job> {
    return this.request<Job>(`/jobs/${jobId}/cancel`, {
      method: 'POST',
    });
  }

  // ---------------- HIGHLIGHTS ----------------
  async listHighlights(projectId: string): Promise<Highlight[]> {
    return this.request<Highlight[]>(`/projects/${projectId}/highlights`);
  }

  async updateHighlight(
    highlightId: string,
    updates: { start_seconds?: number; end_seconds?: number; title?: string; selected?: boolean }
  ): Promise<Highlight> {
    return this.request<Highlight>(`/highlights/${highlightId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // ---------------- CLIPS / RENDERING ----------------
  async generateClips(
    projectId: string,
    options: {
      highlight_ids?: string[];
      output_width?: number;
      output_height?: number;
      fps?: number;
      smart_crop?: boolean;
      burn_subtitles?: boolean;
    } = {}
  ): Promise<Clip[]> {
    return this.request<Clip[]>('/clips/generate', {
      method: 'POST',
      body: JSON.stringify({
        project_id: projectId,
        ...options,
      }),
    });
  }

  async listClips(projectId: string): Promise<Clip[]> {
    return this.request<Clip[]>(`/projects/${projectId}/clips`);
  }

  async getClip(clipId: string): Promise<ClipAsset> {
    return this.request<ClipAsset>(`/clips/${clipId}/assets`);
  }

  getClipDownloadUrl(clipId: string): string {
    const token = this.getToken();
    const qs = token ? `?token=${encodeURIComponent(token)}` : '';
    return `${API_BASE}/clips/${clipId}/download${qs}`;
  }

  getClipSubtitlesUrl(clipId: string, format: 'srt' | 'vtt' = 'srt'): string {
    const token = this.getToken();
    const qs = token ? `&token=${encodeURIComponent(token)}` : '';
    return `${API_BASE}/clips/${clipId}/subtitles?format=${format}${qs}`;
  }

  async requestSubtitleTranslation(clipId: string, targetLanguage: string): Promise<{ clip_id: string; status: string; target_language: string }> {
    return this.request(`/clips/${clipId}/translate`, {
      method: 'POST',
      body: JSON.stringify({ target_language: targetLanguage }),
    });
  }

  async requestVoiceOver(
    clipId: string,
    targetLanguage: string = 'hi',
    style: string = 'energetic'
  ): Promise<{ clip_id: string; status: string; voice_style: string; language: string }> {
    return this.request(`/clips/${clipId}/voice`, {
      method: 'POST',
      body: JSON.stringify({
        target_language: targetLanguage,
        style,
        voice_model: 'default',
      }),
    });
  }

  // ---------------- HEALTH ----------------
  async getHealth(): Promise<HealthStatus> {
    return this.request<HealthStatus>('/health');
  }

  async getReadiness(): Promise<ReadinessStatus> {
    return this.request<ReadinessStatus>('/health/ready');
  }
}

export const api = new ApiClient();
