'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Video, YouTubeReference, ProjectSettings } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import {
  UploadCloud,
  Youtube,
  Film,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  FileVideo,
  Languages,
  Mic,
  Crop
} from 'lucide-react';
import { ProgressBar } from '@/components/ProgressBar';

export default function NewProjectPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // Mode: upload or youtube
  const [inputMode, setInputMode] = useState<'upload' | 'youtube'>('upload');

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadedVideo, setUploadedVideo] = useState<Video | null>(null);

  // YouTube state
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [youtubeRef, setYoutubeRef] = useState<YouTubeReference | null>(null);

  // Project configuration
  const [title, setTitle] = useState('');
  const [clipDuration, setClipDuration] = useState<number>(30);
  const [numberOfHighlights, setNumberOfHighlights] = useState<number>(5);
  const [subtitleStyle, setSubtitleStyle] = useState<'clean' | 'bold_gold' | 'karaoke' | 'cinema'>('bold_gold');
  const [enableHindiVoice, setEnableHindiVoice] = useState(true);
  const [voiceStyle, setVoiceStyle] = useState<'energetic' | 'storytelling' | 'emotional' | 'suspenseful' | 'funny' | 'motivational'>('energetic');
  const [enableHindiTranslation, setEnableHindiTranslation] = useState(true);
  const [smartCrop, setSmartCrop] = useState(true);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. File Upload Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleStartUpload = async () => {
    if (!selectedFile) return;
    setError(null);
    setUploadProgress(1);

    try {
      const video = await api.uploadVideo(selectedFile, (p) => setUploadProgress(p));
      setUploadedVideo(video);
      if (!title) {
        setTitle(video.original_filename.replace(/\.[^/.]+$/, ''));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload video file.');
      setUploadProgress(0);
    }
  };

  // 2. YouTube Checker Handler
  const handleCheckYouTube = async () => {
    if (!youtubeUrl) return;
    setError(null);
    setYoutubeLoading(true);

    try {
      const ref = await api.checkYouTubeUrl(youtubeUrl);
      setYoutubeRef(ref);
      if (ref.title && !title) {
        setTitle(ref.title);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid or inaccessible YouTube URL.');
    } finally {
      setYoutubeLoading(false);
    }
  };

  // 3. Final Create Project & Enqueue
  const handleCreateAndAnalyze = async () => {
    if (!uploadedVideo) {
      setError('Please upload a video file to proceed with AI clipping.');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a project title.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      // 1. Create project
      const project = await api.createProject(uploadedVideo.id, title.trim(), {
        clip_duration_seconds: clipDuration,
        number_of_highlights: numberOfHighlights,
        aspect_ratio: '9:16',
        output_width: 1080,
        output_height: 1920,
        smart_crop: smartCrop,
        subtitle: {
          enabled: true,
          mode: enableHindiTranslation ? 'translated' : 'original',
          language: enableHindiTranslation ? 'hi' : 'auto',
          style: subtitleStyle,
        },
        translation: {
          enabled: enableHindiTranslation,
          target_language: 'hi',
        },
        voice: {
          enabled: enableHindiVoice,
          target_language: 'hi',
          style: voiceStyle,
        },
      });

      // 2. Automatically launch background AI analysis
      await api.startAnalysis(project.id);

      // 3. Redirect to project studio
      router.push(`/projects/${project.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize clipping project.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Film className="w-6 h-6 text-brand-400" />
          Create New Clipping Project
        </h1>
        <p className="text-xs text-surface-muted mt-1">
          Provide your source video, configure smart 9:16 cropping, Hindi captions, and voice-over preferences.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Video Input */}
      <div className="p-6 rounded-2xl bg-surface-card border border-surface-border space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-surface-border">
          <div className="flex items-center gap-2 font-semibold text-white text-sm">
            <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center font-bold">
              1
            </span>
            Source Video Input
          </div>

          <div className="flex rounded-lg bg-surface border border-surface-border p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setInputMode('upload')}
              className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 ${
                inputMode === 'upload'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              Upload Local File
            </button>
            <button
              type="button"
              onClick={() => setInputMode('youtube')}
              className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 ${
                inputMode === 'youtube'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Youtube className="w-3.5 h-3.5" />
              YouTube Reference
            </button>
          </div>
        </div>

        {inputMode === 'upload' ? (
          <div className="space-y-4">
            {!uploadedVideo ? (
              <div className="border-2 border-dashed border-surface-border hover:border-brand-500/50 rounded-2xl p-8 text-center transition bg-surface/50">
                <input
                  type="file"
                  id="video-upload"
                  accept="video/mp4,video/quicktime,video/x-matroska,video/webm"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="video-upload"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-3"
                >
                  <div className="w-12 h-12 rounded-2xl bg-brand-600/15 text-brand-400 flex items-center justify-center">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white hover:text-brand-300">
                      {selectedFile ? selectedFile.name : 'Click to select or drag video file'}
                    </span>
                    <p className="text-xs text-surface-muted mt-1">
                      Supports MP4, MOV, MKV, WebM up to 2 GB
                    </p>
                  </div>
                </label>

                {selectedFile && uploadProgress === 0 && (
                  <div className="mt-4 pt-4 border-t border-surface-border">
                    <button
                      type="button"
                      onClick={handleStartUpload}
                      className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md transition inline-flex items-center gap-2"
                    >
                      <UploadCloud className="w-4 h-4" />
                      Upload to Local Workspace
                    </button>
                  </div>
                )}

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-6 max-w-md mx-auto">
                    <ProgressBar progress={uploadProgress} stage="Uploading Video" />
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{uploadedVideo.original_filename}</div>
                    <div className="text-surface-muted text-[11px]">
                      {(uploadedVideo.size_bytes / (1024 * 1024)).toFixed(1)} MB • {Math.round(uploadedVideo.duration_seconds)}s • {uploadedVideo.width}x{uploadedVideo.height}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUploadedVideo(null);
                    setSelectedFile(null);
                    setUploadProgress(0);
                  }}
                  className="text-slate-400 hover:text-rose-400 transition"
                >
                  Change File
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1 py-2.5 px-4 rounded-xl bg-surface border border-surface-border text-white text-xs focus:outline-none focus:border-red-500 transition"
              />
              <button
                type="button"
                disabled={youtubeLoading || !youtubeUrl}
                onClick={handleCheckYouTube}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium text-xs shadow-md transition flex items-center gap-1.5 shrink-0"
              >
                {youtubeLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Youtube className="w-3.5 h-3.5" />}
                Validate
              </button>
            </div>

            {youtubeRef && (
              <div className="p-4 rounded-xl bg-surface border border-surface-border space-y-3">
                <div className="flex gap-4 items-start">
                  {youtubeRef.thumbnail_url && (
                    <img
                      src={youtubeRef.thumbnail_url}
                      alt="Thumbnail"
                      className="w-28 rounded-lg aspect-video object-cover border border-surface-border"
                    />
                  )}
                  <div className="text-xs space-y-1">
                    <div className="font-semibold text-white">{youtubeRef.title || 'YouTube Video'}</div>
                    <div className="text-surface-muted">{youtubeRef.author}</div>
                    <div className="text-[11px] font-mono text-slate-400">ID: {youtubeRef.video_id}</div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200 leading-relaxed">
                  <strong>Notice:</strong> {youtubeRef.policy_notice}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step 2: Project & AI Settings */}
      <div className="p-6 rounded-2xl bg-surface-card border border-surface-border space-y-6">
        <div className="flex items-center gap-2 font-semibold text-white text-sm pb-4 border-b border-surface-border">
          <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center font-bold">
            2
          </span>
          AI Clipping & Formatting Preferences
        </div>

        <div className="space-y-5 text-xs">
          {/* Project Title */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Project Name</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Podcast Highlights #1"
              className="w-full py-2.5 px-4 rounded-xl bg-surface border border-surface-border text-white text-sm focus:outline-none focus:border-brand-500 transition"
            />
          </div>

          {/* Clip Duration & Highlights Count */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Target Clip Duration</label>
              <select
                value={clipDuration}
                onChange={(e) => setClipDuration(Number(e.target.value))}
                className="w-full py-2.5 px-3 rounded-xl bg-surface border border-surface-border text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value={15}>15 Seconds (Ultra Hook)</option>
                <option value={30}>30 Seconds (Recommended Standard)</option>
                <option value={45}>45 Seconds (Detailed Story)</option>
                <option value={60}>60 Seconds (Max Short Form)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Target Highlight Count</label>
              <select
                value={numberOfHighlights}
                onChange={(e) => setNumberOfHighlights(Number(e.target.value))}
                className="w-full py-2.5 px-3 rounded-xl bg-surface border border-surface-border text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value={3}>Top 3 Best Scenes</option>
                <option value={5}>Top 5 Best Scenes (Standard)</option>
                <option value={10}>Top 10 Ranked Opportunities</option>
                <option value={15}>Top 15 Comprehensive List</option>
              </select>
            </div>
          </div>

          {/* Subtitles & Styling */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-brand-400" />
                Hindi Subtitles Style
              </label>
              <select
                value={subtitleStyle}
                onChange={(e) => setSubtitleStyle(e.target.value as any)}
                className="w-full py-2.5 px-3 rounded-xl bg-surface border border-surface-border text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="bold_gold">Bold Gold (High Engagement Viral)</option>
                <option value="clean">Clean Minimalist White</option>
                <option value="karaoke">Karaoke Word Highlight</option>
                <option value="cinema">Cinematic Lower Third</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-indigo-400" />
                Hindi Voice-over Style
              </label>
              <select
                value={voiceStyle}
                disabled={!enableHindiVoice}
                onChange={(e) => setVoiceStyle(e.target.value as any)}
                className="w-full py-2.5 px-3 rounded-xl bg-surface border border-surface-border text-slate-200 focus:outline-none focus:border-brand-500 disabled:opacity-50"
              >
                <option value="energetic">Energetic (High Pacing)</option>
                <option value="storytelling">Storytelling & Narrative</option>
                <option value="emotional">Emotional & Inspiring</option>
                <option value="suspenseful">Suspenseful Twist</option>
                <option value="motivational">Powerful Motivational</option>
                <option value="funny">Humorous & Entertaining</option>
              </select>
            </div>
          </div>

          {/* Toggles */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="flex items-center gap-2 p-3 rounded-xl bg-surface border border-surface-border cursor-pointer hover:border-brand-500/40 transition">
              <input
                type="checkbox"
                checked={smartCrop}
                onChange={(e) => setSmartCrop(e.target.checked)}
                className="rounded text-brand-600 focus:ring-brand-500"
              />
              <div>
                <div className="font-medium text-slate-200">Smart Face Crop</div>
                <div className="text-[10px] text-surface-muted">Face-aware 9:16 tracking</div>
              </div>
            </label>

            <label className="flex items-center gap-2 p-3 rounded-xl bg-surface border border-surface-border cursor-pointer hover:border-brand-500/40 transition">
              <input
                type="checkbox"
                checked={enableHindiTranslation}
                onChange={(e) => setEnableHindiTranslation(e.target.checked)}
                className="rounded text-brand-600 focus:ring-brand-500"
              />
              <div>
                <div className="font-medium text-slate-200">Hindi Subtitles</div>
                <div className="text-[10px] text-surface-muted">Devanagari synchronization</div>
              </div>
            </label>

            <label className="flex items-center gap-2 p-3 rounded-xl bg-surface border border-surface-border cursor-pointer hover:border-brand-500/40 transition">
              <input
                type="checkbox"
                checked={enableHindiVoice}
                onChange={(e) => setEnableHindiVoice(e.target.checked)}
                className="rounded text-brand-600 focus:ring-brand-500"
              />
              <div>
                <div className="font-medium text-slate-200">Hindi Voice Studio</div>
                <div className="text-[10px] text-surface-muted">TTS narration capability</div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="px-5 py-2.5 rounded-xl border border-surface-border text-slate-400 hover:text-white font-medium text-xs hover:bg-surface-card transition"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={submitting || !uploadedVideo}
          onClick={handleCreateAndAnalyze}
          className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-brand-600/30 transition flex items-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Initializing AI Engine...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Create Project & Analyze Video
            </>
          )}
        </button>
      </div>
    </div>
  );
}
