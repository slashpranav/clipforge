'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Video, YouTubeReference } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { AnimatedContent, BlurText, Magnet, ShinyText, SpotlightCard } from '@/components/reactbits';
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
    <div className="max-w-4xl mx-auto space-y-7">
      {/* Page Header */}
      <AnimatedContent distance={14} duration={0.4}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-700 mb-1">
              <Wand2 className="w-3.5 h-3.5" />
              <ShinyText text="Project Setup Wizard" speed={3.5} />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <BlurText text="Create Multi-Clip Project" delay={40} />
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Upload your source video, pick how many 9:16 shorts to generate, and customize Hindi captions & voice.
            </p>
          </div>
        </div>
      </AnimatedContent>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Source Media */}
      <AnimatedContent delay={0.07} distance={16}>
        <SpotlightCard className="p-6 md:p-7 rounded-3xl studio-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-border/70">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-brand-600 to-orange-500 text-white text-xs flex items-center justify-center font-bold shadow-sm">
                1
              </span>
              <div>
                <h2 className="font-bold text-slate-900 text-sm">Source Video Input</h2>
                <p className="text-[11px] text-slate-500">Upload local video or validate YouTube metadata</p>
              </div>
            </div>

            <div className="flex rounded-xl bg-surface-elevated border border-surface-border p-1 text-xs font-semibold self-start">
              {[
                { key: 'upload', label: 'Local File', icon: UploadCloud, activeBg: 'bg-brand-600' },
                { key: 'youtube', label: 'YouTube Ref', icon: Youtube, activeBg: 'bg-red-600' },
              ].map((m) => {
                const MIcon = m.icon;
                const active = inputMode === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setInputMode(m.key as any)}
                    className={`relative px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                      active ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="input-mode-pill"
                        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                        className={`absolute inset-0 rounded-lg shadow-sm ${m.activeBg}`}
                      />
                    )}
                    <MIcon className="relative z-10 w-3.5 h-3.5" />
                    <span className="relative z-10">{m.label}</span>
                  </button>
                );
              })}
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
                className={`border-2 border-dashed rounded-2xl p-8 md:p-10 text-center transition bg-surface-elevated/70 ${
                  isDragging
                    ? 'border-brand-500 bg-brand-50/70'
                    : selectedFile
                    ? 'border-brand-300 bg-brand-50/30'
                    : 'border-slate-300 hover:border-brand-400'
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
                  <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center shadow-sm">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900 hover:text-brand-700 transition block">
                      {selectedFile ? selectedFile.name : 'Drop your video here or click to browse'}
                    </span>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedFile
                        ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB ready to upload`
                        : 'Supports MP4, MOV, MKV, WebM • Up to 2 GB'}
                    </p>
                  </div>
                </label>

                {selectedFile && uploadProgress === 0 && (
                  <div className="mt-5 pt-5 border-t border-slate-200/70">
                    <button
                      type="button"
                      onClick={handleStartUpload}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-orange-500 hover:from-brand-500 hover:to-orange-400 text-white font-semibold text-xs shadow-md shadow-brand-600/20 transition inline-flex items-center gap-2"
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
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">{uploadedVideo.original_filename}</div>
                    <div className="text-emerald-700 text-[11px] font-mono mt-0.5">
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
                  className="px-3 py-1.5 rounded-lg bg-surface-card hover:bg-rose-50 border border-surface-border text-slate-600 hover:text-rose-700 font-semibold transition shrink-0 shadow-sm"
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
                className="flex-1 py-2.5 px-4 rounded-xl bg-surface-elevated/80 border border-surface-border text-slate-900 text-xs placeholder:text-slate-400 focus:bg-surface-card focus:outline-none focus:border-red-500 transition"
              />
              <button
                type="button"
                disabled={youtubeLoading || !youtubeUrl}
                onClick={handleCheckYouTube}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5 shrink-0"
              >
                {youtubeLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Youtube className="w-3.5 h-3.5" />}
                Validate URL
              </button>
            </div>

            {youtubeRef && (
              <div className="p-4 rounded-2xl bg-surface-elevated/80 border border-surface-border space-y-4">
                <div className="flex gap-4 items-start">
                  {youtubeRef.thumbnail_url && (
                    <img
                      src={youtubeRef.thumbnail_url}
                      alt="Thumbnail"
                      className="w-32 rounded-xl aspect-video object-cover border border-slate-200 shadow-sm"
                    />
                  )}
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-slate-900 text-sm">{youtubeRef.title || 'YouTube Video'}</div>
                    <div className="text-slate-600">{youtubeRef.author}</div>
                    <div className="text-[11px] font-mono text-slate-400">Video ID: {youtubeRef.video_id}</div>
                  </div>
                </div>

                {youtubeRef.embed_url && (
                  <div className="aspect-video w-full max-w-md rounded-xl overflow-hidden border border-slate-200 bg-black shadow-sm">
                    <iframe
                      src={youtubeRef.embed_url}
                      title={youtubeRef.title || 'YouTube Preview'}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  </div>
                )}

                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 leading-relaxed space-y-2.5">
                  <div>
                    <strong>Platform & Rights Policy:</strong> {youtubeRef.policy_notice}
                  </div>
                  <button
                    type="button"
                    onClick={() => setInputMode('upload')}
                    className="px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    Switch to Local File Upload
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        </SpotlightCard>
      </AnimatedContent>

      {/* Step 2: Configuration Studio */}
      <AnimatedContent delay={0.14} distance={16}>
        <SpotlightCard className="p-6 md:p-7 rounded-3xl studio-card space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-surface-border/70">
          <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-brand-600 to-orange-500 text-white text-xs flex items-center justify-center font-bold shadow-sm">
            2
          </span>
          <div>
            <h2 className="font-bold text-slate-900 text-sm">Multi-Clip & AI Preferences</h2>
            <p className="text-[11px] text-slate-500">Configure clip count, target length, captions, and voice style</p>
          </div>
        </div>

        <div className="space-y-6 text-xs">
          {/* Project Title */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-brand-600" />
              Project Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Tech Podcast Viral Moments"
              className="w-full py-3 px-4 rounded-xl bg-surface-elevated/80 border border-surface-border text-slate-900 text-sm placeholder:text-slate-400 focus:bg-surface-card focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition"
            />
          </div>

          {/* Number of Multi-Clips + Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <label className="font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-brand-600" />
                  Number of Clips (Multi-Clip)
                </span>
                <span className="px-2 py-0.5 rounded-md bg-brand-50 border border-brand-200 font-mono text-[11px] font-bold text-brand-700">
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
                        ? 'bg-gradient-to-br from-brand-600 to-orange-500 border-brand-600 text-white shadow-md shadow-brand-600/20'
                        : 'bg-surface-elevated/80 border-surface-border text-slate-700 hover:border-brand-300 hover:bg-brand-50/40'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500">
                Choose 10 or 15 to automatically generate multiple ranked vertical shorts.
              </p>
            </div>

            <div className="space-y-2.5">
              <label className="font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-orange-600" />
                  Target Clip Length
                </span>
                <span className="px-2 py-0.5 rounded-md bg-orange-50 border border-orange-200 font-mono text-[11px] font-bold text-orange-700">
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
                        ? 'bg-gradient-to-br from-orange-500 to-brand-600 border-orange-500 text-white shadow-md shadow-orange-500/20'
                        : 'bg-surface-elevated/80 border-surface-border text-slate-700 hover:border-orange-300 hover:bg-orange-50/40'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500">
                Adapts automatically if source video is shorter than target length.
              </p>
            </div>
          </div>

          {/* Subtitle Style Swatches & Voice Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2.5">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-brand-600" />
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
                        ? 'bg-brand-50 border-brand-400 text-brand-900 shadow-sm'
                        : 'bg-surface-elevated/80 border-surface-border text-slate-600 hover:bg-surface-elevated'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-xs ${st.sampleClass}`}>
                      {st.sample}
                    </span>
                    <span className="font-semibold text-xs">{st.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-orange-600" />
                Hindi Voice-Over Tone
              </label>
              <select
                value={voiceStyle}
                disabled={!enableHindiVoice}
                onChange={(e) => setVoiceStyle(e.target.value as any)}
                className="w-full py-3 px-3.5 rounded-xl bg-surface-elevated/80 border border-surface-border text-slate-900 text-xs font-medium focus:bg-surface-card focus:outline-none focus:border-brand-500 disabled:opacity-45"
              >
                <option value="energetic">Energetic (High Pacing Shorts)</option>
                <option value="storytelling">Storytelling & Narrative</option>
                <option value="emotional">Emotional & Inspiring</option>
                <option value="suspenseful">Suspenseful Twist</option>
                <option value="motivational">Powerful Motivational</option>
                <option value="funny">Humorous & Entertaining</option>
              </select>
              <p className="text-[11px] text-slate-500">
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
                    ? 'bg-brand-50/70 border-brand-300 shadow-sm'
                    : 'bg-surface-elevated/80 border-surface-border opacity-80'
                }`}
              >
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 text-xs truncate">{item.label}</div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">{item.sub}</div>
                </div>
                <div
                  className={`w-9 h-5 rounded-full p-0.5 transition shrink-0 ${
                    item.checked ? 'bg-brand-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-surface-card shadow transition-transform ${
                      item.checked ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
        </SpotlightCard>
      </AnimatedContent>

      {/* Action Summary & Footer */}
      <AnimatedContent delay={0.2} distance={16}>
        <div className="p-4 rounded-2xl studio-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
          <span className="font-bold text-slate-900">Summary:</span>
          <span className="px-2 py-0.5 rounded-md bg-brand-50 border border-brand-200 text-brand-700 font-mono font-semibold">
            {numberOfHighlights} Shorts
          </span>
          <span className="px-2 py-0.5 rounded-md bg-surface-elevated border border-surface-border font-mono">
            ~{clipDuration}s each
          </span>
          <span className="px-2 py-0.5 rounded-md bg-surface-elevated border border-surface-border font-mono">
            9:16 (1080×1920)
          </span>
          <span className="px-2 py-0.5 rounded-md bg-surface-elevated border border-surface-border capitalize">
            {subtitleStyle.replace('_', ' ')} Subtitles
          </span>
          {autoRenderClips && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
              Auto-Render ON
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="px-5 py-2.5 rounded-xl border border-surface-border bg-surface-card text-slate-600 hover:text-slate-900 font-semibold text-xs hover:bg-surface-elevated transition shadow-sm"
          >
            Cancel
          </button>
          <Magnet magnetStrength={5} padding={14}>
            <button
              type="button"
              disabled={submitting || !uploadedVideo}
              onClick={handleCreateAndAnalyze}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-orange-500 hover:from-brand-500 hover:to-orange-400 disabled:opacity-45 text-white font-semibold text-xs shadow-md shadow-brand-600/25 transition flex items-center justify-center gap-2"
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
          </Magnet>
        </div>
        </div>
      </AnimatedContent>
    </div>
  );
}
