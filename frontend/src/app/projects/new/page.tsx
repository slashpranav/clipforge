'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Video, YouTubeReference } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import {
  UploadCloud,
  Youtube,
  Film,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Languages,
  Mic,
  Scissors,
  Clock,
  Wand2,
} from 'lucide-react';
import { ProgressBar } from '@/components/ProgressBar';

export default function NewProjectPage() {
  const router = useRouter();
  useAuth();

  // Mode: upload or youtube
  const [inputMode, setInputMode] = useState<'upload' | 'youtube'>('upload');

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadedVideo, setUploadedVideo] = useState<Video | null>(null);

  // YouTube state
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [youtubeRef, setYoutubeRef] = useState<YouTubeReference | null>(null);

  // Project configuration
  const [title, setTitle] = useState('');
  const [clipDuration, setClipDuration] = useState<number>(30);
  const [numberOfHighlights, setNumberOfHighlights] = useState<number>(10);
  const [subtitleStyle, setSubtitleStyle] = useState<'clean' | 'bold_gold' | 'karaoke' | 'cinema'>('bold_gold');
  const [enableHindiVoice, setEnableHindiVoice] = useState(true);
  const [voiceStyle, setVoiceStyle] = useState<'energetic' | 'storytelling' | 'emotional' | 'suspenseful' | 'funny' | 'motivational'>('energetic');
  const [enableHindiTranslation, setEnableHindiTranslation] = useState(true);
  const [smartCrop, setSmartCrop] = useState(true);
  const [autoRenderClips, setAutoRenderClips] = useState(true);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptFile = (file: File) => {
    setSelectedFile(file);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  // 1. File Upload Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      acceptFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      acceptFile(e.dataTransfer.files[0]);
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
      const project = await api.createProject(uploadedVideo.id, title.trim(), {
        clip_duration_seconds: clipDuration,
        number_of_highlights: numberOfHighlights,
        aspect_ratio: '9:16',
        output_width: 1080,
        output_height: 1920,
        smart_crop: smartCrop,
        auto_render_clips: autoRenderClips,
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

      await api.startAnalysis(project.id);
      router.push(`/projects/${project.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize clipping project.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-7 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-brand-300 mb-1">
            <Wand2 className="w-3.5 h-3.5" />
            Project Setup Wizard
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            Create Multi-Clip Project
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Upload your source video, pick how many 9:16 shorts to generate, and customize Hindi captions & voice.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Source Media */}
      <div className="p-6 md:p-7 rounded-3xl studio-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white text-xs flex items-center justify-center font-bold shadow">
              1
            </span>
            <div>
              <h2 className="font-bold text-white text-sm">Source Video Input</h2>
              <p className="text-[11px] text-slate-400">Upload local video or validate YouTube metadata</p>
            </div>
          </div>

          <div className="flex rounded-xl bg-black/30 border border-white/[0.08] p-1 text-xs font-semibold self-start">
            <button
              type="button"
              onClick={() => setInputMode('upload')}
              className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                inputMode === 'upload'
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              Local File
            </button>
            <button
              type="button"
              onClick={() => setInputMode('youtube')}
              className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                inputMode === 'youtube'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Youtube className="w-3.5 h-3.5" />
              YouTube Ref
            </button>
          </div>
        </div>

        {inputMode === 'upload' ? (
          <div className="space-y-4">
            {!uploadedVideo ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 md:p-10 text-center transition bg-black/20 ${
                  isDragging
                    ? 'border-brand-400 bg-brand-500/10'
                    : selectedFile
                    ? 'border-brand-500/40'
                    : 'border-white/[0.1] hover:border-brand-500/40'
                }`}
              >
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
                  <div className="w-14 h-14 rounded-2xl bg-brand-500/15 border border-brand-500/25 text-brand-400 flex items-center justify-center shadow-inner">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white hover:text-brand-300 transition block">
                      {selectedFile ? selectedFile.name : 'Drop your video here or click to browse'}
                    </span>
                    <p className="text-xs text-slate-400 mt-1">
                      {selectedFile
                        ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB ready to upload`
                        : 'Supports MP4, MOV, MKV, WebM • Up to 2 GB'}
                    </p>
                  </div>
                </label>

                {selectedFile && uploadProgress === 0 && (
                  <div className="mt-5 pt-5 border-t border-white/[0.06]">
                    <button
                      type="button"
                      onClick={handleStartUpload}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-brand-600/25 ring-1 ring-white/15 transition inline-flex items-center gap-2"
                    >
                      <UploadCloud className="w-4 h-4" />
                      Upload Video to Workspace
                    </button>
                  </div>
                )}

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-6 max-w-md mx-auto">
                    <ProgressBar progress={uploadProgress} stage="Uploading Media" />
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-white truncate">{uploadedVideo.original_filename}</div>
                    <div className="text-emerald-200/80 text-[11px] font-mono mt-0.5">
                      {(uploadedVideo.size_bytes / (1024 * 1024)).toFixed(1)} MB • {Math.round(uploadedVideo.duration_seconds)}s • {uploadedVideo.width}×{uploadedVideo.height}
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
                  className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-rose-500/15 text-slate-300 hover:text-rose-300 font-medium transition shrink-0"
                >
                  Replace File
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
                placeholder="Paste YouTube URL (e.g. https://youtu.be/...)"
                className="flex-1 py-2.5 px-4 rounded-xl bg-black/30 border border-white/[0.1] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-red-500 transition"
              />
              <button
                type="button"
                disabled={youtubeLoading || !youtubeUrl}
                onClick={handleCheckYouTube}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold text-xs shadow-md transition flex items-center gap-1.5 shrink-0"
              >
                {youtubeLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Youtube className="w-3.5 h-3.5" />}
                Validate URL
              </button>
            </div>

            {youtubeRef && (
              <div className="p-4 rounded-2xl bg-black/30 border border-white/[0.08] space-y-4">
                <div className="flex gap-4 items-start">
                  {youtubeRef.thumbnail_url && (
                    <img
                      src={youtubeRef.thumbnail_url}
                      alt="Thumbnail"
                      className="w-32 rounded-xl aspect-video object-cover border border-white/10"
                    />
                  )}
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-white text-sm">{youtubeRef.title || 'YouTube Video'}</div>
                    <div className="text-slate-400">{youtubeRef.author}</div>
                    <div className="text-[11px] font-mono text-slate-500">Video ID: {youtubeRef.video_id}</div>
                  </div>
                </div>

                {youtubeRef.embed_url && (
                  <div className="aspect-video w-full max-w-md rounded-xl overflow-hidden border border-white/10 bg-black">
                    <iframe
                      src={youtubeRef.embed_url}
                      title={youtubeRef.title || 'YouTube Preview'}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  </div>
                )}

                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200 leading-relaxed space-y-2.5">
                  <div>
                    <strong>Platform & Rights Policy:</strong> {youtubeRef.policy_notice}
                  </div>
                  <button
                    type="button"
                    onClick={() => setInputMode('upload')}
                    className="px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition inline-flex items-center gap-1.5"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    Switch to Local File Upload
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step 2: Configuration Studio */}
      <div className="p-6 md:p-7 rounded-3xl studio-card space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-white/[0.07]">
          <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white text-xs flex items-center justify-center font-bold shadow">
            2
          </span>
          <div>
            <h2 className="font-bold text-white text-sm">Multi-Clip & AI Preferences</h2>
            <p className="text-[11px] text-slate-400">Configure clip count, target length, captions, and voice style</p>
          </div>
        </div>

        <div className="space-y-6 text-xs">
          {/* Project Title */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-brand-400" />
              Project Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Tech Podcast Viral Moments"
              className="w-full py-3 px-4 rounded-xl bg-black/30 border border-white/[0.1] text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/40 transition"
            />
          </div>

          {/* Number of Multi-Clips + Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Multi-clip selector */}
            <div className="space-y-2.5">
              <label className="font-semibold text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-brand-400" />
                  Number of Clips (Multi-Clip)
                </span>
                <span className="px-2 py-0.5 rounded-md bg-brand-500/15 border border-brand-500/30 font-mono text-[11px] text-brand-300">
                  {numberOfHighlights} clips
                </span>
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[3, 5, 10, 15, 20].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setNumberOfHighlights(cnt)}
                    className={`py-2.5 rounded-xl border font-mono font-bold text-xs transition ${
                      numberOfHighlights === cnt
                        ? 'bg-gradient-to-br from-brand-600 to-indigo-600 border-brand-400 text-white shadow-md shadow-brand-600/25'
                        : 'bg-black/25 border-white/[0.08] text-slate-300 hover:border-brand-500/40 hover:text-white'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400">
                Choose 10 or 15 to automatically generate multiple ranked vertical shorts.
              </p>
            </div>

            {/* Duration selector */}
            <div className="space-y-2.5">
              <label className="font-semibold text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  Target Clip Length
                </span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 font-mono text-[11px] text-indigo-300">
                  ~{clipDuration}s
                </span>
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[10, 15, 30, 45, 60].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setClipDuration(sec)}
                    className={`py-2.5 rounded-xl border font-mono font-bold text-xs transition ${
                      clipDuration === sec
                        ? 'bg-gradient-to-br from-indigo-600 to-brand-600 border-indigo-400 text-white shadow-md shadow-indigo-600/25'
                        : 'bg-black/25 border-white/[0.08] text-slate-300 hover:border-indigo-500/40 hover:text-white'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400">
                Adapts automatically if source video is shorter than target length.
              </p>
            </div>
          </div>

          {/* Subtitle Style Swatches & Voice Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2.5">
              <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-brand-400" />
                Subtitle Typography Style
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'bold_gold', name: 'Bold Gold', sample: 'AA', sampleClass: 'text-amber-400 font-black' },
                  { id: 'clean', name: 'Clean White', sample: 'AA', sampleClass: 'text-white font-bold' },
                  { id: 'karaoke', name: 'Karaoke Pop', sample: 'AA', sampleClass: 'text-cyan-300 font-extrabold' },
                  { id: 'cinema', name: 'Cinema', sample: 'AA', sampleClass: 'text-slate-200 font-semibold tracking-wider' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSubtitleStyle(st.id as any)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition ${
                      subtitleStyle === st.id
                        ? 'bg-brand-500/15 border-brand-500/50 text-white'
                        : 'bg-black/25 border-white/[0.08] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center text-xs ${st.sampleClass}`}>
                      {st.sample}
                    </span>
                    <span className="font-medium text-xs">{st.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-indigo-400" />
                Hindi Voice-Over Tone
              </label>
              <select
                value={voiceStyle}
                disabled={!enableHindiVoice}
                onChange={(e) => setVoiceStyle(e.target.value as any)}
                className="w-full py-3 px-3.5 rounded-xl bg-black/30 border border-white/[0.1] text-slate-100 text-xs focus:outline-none focus:border-brand-500 disabled:opacity-40"
              >
                <option value="energetic">Energetic (High Pacing Shorts)</option>
                <option value="storytelling">Storytelling & Narrative</option>
                <option value="emotional">Emotional & Inspiring</option>
                <option value="suspenseful">Suspenseful Twist</option>
                <option value="motivational">Powerful Motivational</option>
                <option value="funny">Humorous & Entertaining</option>
              </select>
              <p className="text-[11px] text-slate-400">
                Tone used when synthesizing Hindi TTS voice-overs in the Studio.
              </p>
            </div>
          </div>

          {/* Feature Switches */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                label: 'Auto-Render Clips',
                sub: `Export ${numberOfHighlights} MP4 shorts`,
                checked: autoRenderClips,
                toggle: () => setAutoRenderClips(!autoRenderClips),
              },
              {
                label: 'Smart Face Crop',
                sub: '9:16 subject framing',
                checked: smartCrop,
                toggle: () => setSmartCrop(!smartCrop),
              },
              {
                label: 'Hindi Subtitles',
                sub: 'Synchronized captions',
                checked: enableHindiTranslation,
                toggle: () => setEnableHindiTranslation(!enableHindiTranslation),
              },
              {
                label: 'Hindi Voice Studio',
                sub: 'TTS narration ready',
                checked: enableHindiVoice,
                toggle: () => setEnableHindiVoice(!enableHindiVoice),
              },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.toggle}
                className={`p-3.5 rounded-2xl border text-left flex items-center justify-between gap-2 transition ${
                  item.checked
                    ? 'bg-brand-500/10 border-brand-500/35'
                    : 'bg-black/25 border-white/[0.07] opacity-75'
                }`}
              >
                <div className="min-w-0">
                  <div className="font-semibold text-white text-xs truncate">{item.label}</div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{item.sub}</div>
                </div>
                <div
                  className={`w-9 h-5 rounded-full p-0.5 transition shrink-0 ${
                    item.checked ? 'bg-brand-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      item.checked ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Summary & Footer */}
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
          <span className="font-semibold text-white">Summary:</span>
          <span className="px-2 py-0.5 rounded-md bg-brand-500/15 border border-brand-500/30 text-brand-300 font-mono">
            {numberOfHighlights} Shorts
          </span>
          <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] font-mono">
            ~{clipDuration}s each
          </span>
          <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] font-mono">
            9:16 (1080×1920)
          </span>
          <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] capitalize">
            {subtitleStyle.replace('_', ' ')} Subtitles
          </span>
          {autoRenderClips && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold">
              Auto-Render ON
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="px-5 py-2.5 rounded-xl border border-white/[0.1] bg-white/[0.03] text-slate-300 hover:text-white font-semibold text-xs hover:bg-white/[0.07] transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting || !uploadedVideo}
            onClick={handleCreateAndAnalyze}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-45 text-white font-semibold text-xs shadow-lg shadow-brand-600/30 ring-1 ring-white/15 transition flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Launching Multi-Clip Engine...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Create Project & Generate {numberOfHighlights} Shorts
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
