'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Clip,
  Highlight,
  Job,
  Project,
  Video
} from '@/lib/types';
import {
  Film,
  Sparkles,
  Scissors,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Sliders,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Languages,
  Mic,
  Eye,
  Check,
  Edit2,
  Save,
  X
} from 'lucide-react';
import { ProgressBar } from '@/components/ProgressBar';
import { ScoreBadge } from '@/components/ScoreBadge';
import { VideoPlayerModal } from '@/components/VideoPlayerModal';

export default function ProjectStudioPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  // Active studio tab
  const [activeTab, setActiveTab] = useState<'highlights' | 'pipeline' | 'clips' | 'voice' | 'export'>('highlights');

  // Core Data
  const [project, setProject] = useState<Project | null>(null);
  const [video, setVideo] = useState<Video | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [clips, setClips] = useState<Clip[]>([]);
  const [activeJob, setActiveJob] = useState<Job | null>(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Video preview modal
  const [selectedClipForModal, setSelectedClipForModal] = useState<Clip | null>(null);

  // In-place highlight edit state
  const [editingHighlightId, setEditingHighlightId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStart, setEditStart] = useState<number>(0);
  const [editEnd, setEditEnd] = useState<number>(0);

  // Fetch full project state
  const refreshProjectData = async () => {
    try {
      const proj = await api.getProject(projectId);
      setProject(proj);

      const [vid, hls, cls, jobsList] = await Promise.allSettled([
        api.getVideo(proj.video_id),
        api.listHighlights(projectId),
        api.listClips(projectId),
        api.listProjectJobs(projectId),
      ]);

      if (vid.status === 'fulfilled') setVideo(vid.value);
      if (hls.status === 'fulfilled') setHighlights(hls.value);
      if (cls.status === 'fulfilled') setClips(cls.value);
      if (jobsList.status === 'fulfilled' && jobsList.value.length > 0) {
        const latestJob = jobsList.value[0];
        setActiveJob(latestJob);
        if (latestJob.status === 'queued' || latestJob.status === 'running') {
          setActiveTab('pipeline');
        } else if (cls.status === 'fulfilled' && cls.value.length > 0 && proj.status === 'completed') {
          setActiveTab('clips');
        }
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to load project details.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProjectData();
  }, [projectId]);

  // Real-time Job Polling (every 2.5 seconds when a job is active or project status is analyzing)
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const poll = async () => {
      if (project?.status === 'analyzing' || project?.status === 'processing' || (activeJob && (activeJob.status === 'queued' || activeJob.status === 'running'))) {
        try {
          if (activeJob) {
            const updatedJob = await api.getJob(activeJob.id);
            setActiveJob(updatedJob);
            if (updatedJob.status === 'completed' || updatedJob.status === 'failed') {
              await refreshProjectData();
              if (updatedJob.status === 'completed') {
                const latestClips = await api.listClips(projectId).catch(() => []);
                setActiveTab(latestClips.length > 0 ? 'clips' : 'highlights');
              }
            }
          } else {
            // Refresh project status
            const proj = await api.getProject(projectId);
            setProject(proj);
            if (proj.status === 'ready' || proj.status === 'ready_for_review' || proj.status === 'completed') {
              await refreshProjectData();
              setActiveTab(proj.status === 'completed' ? 'clips' : 'highlights');
            }
          }
        } catch (e) {
          console.warn('Job poll error:', e);
        }
      }
    };

    timer = setInterval(poll, 2500);
    return () => clearInterval(timer);
  }, [project?.status, activeJob]);

  // Action: Launch / Re-run Analysis
  const handleStartAnalysis = async () => {
    try {
      setActionLoading(true);
      const enq = await api.startAnalysis(projectId);
      const job = await api.getJob(enq.job_id);
      setActiveJob(job);
      setActiveTab('pipeline');
      setNotification({ type: 'success', message: 'AI Analysis pipeline started successfully.' });
      setProject((p) => (p ? { ...p, status: 'analyzing' } : p));
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to start AI analysis.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Toggle Highlight Selection
  const handleToggleHighlight = async (highlight: Highlight) => {
    try {
      const updated = await api.updateHighlight(highlight.id, {
        selected: !highlight.selected,
      });
      setHighlights((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to update highlight.' });
    }
  };

  // Action: Save In-place Highlight Edit
  const handleSaveHighlightEdit = async (highlightId: string) => {
    try {
      const updated = await api.updateHighlight(highlightId, {
        title: editTitle,
        start_seconds: editStart,
        end_seconds: editEnd,
      });
      setHighlights((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
      setEditingHighlightId(null);
      setNotification({ type: 'success', message: 'Highlight timestamps updated.' });
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to save highlight edit.' });
    }
  };

  // Action: Generate 9:16 Vertical Clips
  const handleRenderClips = async () => {
    const selectedHighlights = highlights.filter((h) => h.selected);
    if (selectedHighlights.length === 0) {
      setNotification({ type: 'error', message: 'Please select at least one highlight to render.' });
      return;
    }

    try {
      setActionLoading(true);
      setNotification({ type: 'success', message: `Rendering ${selectedHighlights.length} vertical 9:16 short(s)...` });
      const rendered = await api.generateClips(projectId, {
        highlight_ids: selectedHighlights.map((h) => h.id),
        smart_crop: project?.settings?.smart_crop ?? true,
        burn_subtitles: true,
      });
      setClips(rendered);
      setActiveTab('clips');
      setNotification({ type: 'success', message: 'Clips rendered successfully!' });
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to render clips.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Voice-Over Request
  const handleVoiceOverRequest = async (clipId: string) => {
    try {
      setActionLoading(true);
      await api.requestVoiceOver(clipId, 'hi', project?.settings?.voice?.style || 'energetic');
      setNotification({ type: 'success', message: 'Hindi voice-over narration synthesized for clip.' });
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to generate voice-over.' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
        <p className="text-xs text-surface-muted">Loading project studio...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center rounded-2xl bg-surface-card border border-surface-border space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Project Not Found</h2>
        <button
          onClick={() => router.push('/projects')}
          className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-medium"
        >
          Return to Projects
        </button>
      </div>
    );
  }

  const selectedCount = highlights.filter((h) => h.selected).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-surface-muted">
            <button
              onClick={() => router.push('/projects')}
              className="hover:text-slate-200 transition flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Projects
            </button>
            <span>/</span>
            <span className="text-slate-400 truncate max-w-xs">{project.title}</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              {project.title}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                project.status === 'ready' || project.status === 'completed'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : project.status === 'analyzing'
                  ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                  : 'bg-slate-700/30 text-slate-300 border border-slate-600/30'
              }`}
            >
              {project.status}
            </span>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={handleStartAnalysis}
            disabled={actionLoading || project.status === 'analyzing'}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-card hover:bg-surface-cardHover border border-surface-border text-slate-200 hover:text-white text-xs font-semibold disabled:opacity-50 transition"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-brand-400 ${project.status === 'analyzing' ? 'animate-spin' : ''}`} />
            {project.status === 'analyzing' ? 'Analyzing...' : 'Re-run Analysis'}
          </button>

          <button
            onClick={handleRenderClips}
            disabled={actionLoading || selectedCount === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-brand-600/30 transition"
          >
            <Scissors className="w-3.5 h-3.5" />
            Render {selectedCount} Short{selectedCount === 1 ? '' : 's'} (9:16)
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between transition ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Studio Tab Navigation */}
      <div className="flex border-b border-surface-border overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('highlights')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'highlights'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Best Scene Detection ({highlights.length})
        </button>

        <button
          onClick={() => setActiveTab('pipeline')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'pipeline'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Pipeline Monitor {project.status === 'analyzing' && <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse"></span>}
        </button>

        <button
          onClick={() => setActiveTab('clips')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'clips'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scissors className="w-3.5 h-3.5" />
          Clip Editor & Studio ({clips.length})
        </button>

        <button
          onClick={() => setActiveTab('voice')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'voice'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Mic className="w-3.5 h-3.5" />
          Voice-over Studio
        </button>

        <button
          onClick={() => setActiveTab('export')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'export'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          Export Center
        </button>
      </div>

      {/* ================= TAB 1: BEST SCENE DETECTION (HIGHLIGHTS) ================= */}
      {activeTab === 'highlights' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-white">Ranked Candidate Moments</h2>
              <p className="text-xs text-surface-muted">
                Sentences and dialogues preserved. Moments scored using explainable heuristic evaluation (0–100).
              </p>
            </div>
            <div className="text-xs text-slate-300">
              <span className="font-semibold text-brand-400">{selectedCount}</span> of {highlights.length} selected for export
            </div>
          </div>

          {highlights.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-surface-card border border-surface-border space-y-4">
              <Sparkles className="w-8 h-8 text-brand-400 mx-auto" />
              <div>
                <h3 className="font-bold text-white text-base">No candidate moments generated yet</h3>
                <p className="text-xs text-surface-muted max-w-sm mx-auto mt-1">
                  Run the AI analysis pipeline to automatically detect scenes, transcribe speech, and score the best clipping opportunities.
                </p>
              </div>
              <button
                onClick={handleStartAnalysis}
                disabled={actionLoading || project.status === 'analyzing'}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Start AI Scene Analysis
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {highlights.map((h, idx) => {
                const isEditing = editingHighlightId === h.id;

                return (
                  <div
                    key={h.id}
                    className={`p-5 rounded-2xl border transition space-y-3 ${
                      h.selected
                        ? 'bg-surface-card border-brand-500/40 shadow-sm shadow-brand-500/5'
                        : 'bg-surface-card/60 border-surface-border opacity-80'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={() => handleToggleHighlight(h)}
                          className={`w-5 h-5 mt-0.5 rounded-md border flex items-center justify-center transition shrink-0 ${
                            h.selected
                              ? 'bg-brand-600 border-brand-500 text-white'
                              : 'bg-surface border-surface-border text-transparent hover:border-brand-500/50'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-surface border border-surface-border text-slate-300">
                              #{idx + 1}
                            </span>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="py-1 px-2 text-sm rounded bg-surface border border-brand-500 text-white focus:outline-none"
                              />
                            ) : (
                              <h3 className="font-bold text-white text-sm">{h.title}</h3>
                            )}
                          </div>

                          <p className="text-xs text-brand-300/90 font-medium">
                            Why this works: {h.reason}
                          </p>
                        </div>
                      </div>

                      {/* Score Badge */}
                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                        <ScoreBadge score={h.score} breakdown={h.score_breakdown} size="md" />
                      </div>
                    </div>

                    {/* Excerpt transcript */}
                    <div className="p-3 rounded-xl bg-surface/70 border border-surface-border/60 text-xs text-slate-300 italic leading-relaxed">
                      "{h.transcript_excerpt || 'Dialogue moment from speech transcript...'}"
                    </div>

                    {/* Timestamps & Fine-Tuning Controls */}
                    <div className="flex flex-wrap items-center justify-between text-xs pt-1 border-t border-surface-border/40 gap-2">
                      <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <span>Start:</span>
                            <input
                              type="number"
                              step="0.1"
                              value={editStart}
                              onChange={(e) => setEditStart(Number(e.target.value))}
                              className="w-16 py-0.5 px-1.5 rounded bg-surface border border-surface-border text-white text-xs"
                            />
                            <span>End:</span>
                            <input
                              type="number"
                              step="0.1"
                              value={editEnd}
                              onChange={(e) => setEditEnd(Number(e.target.value))}
                              className="w-16 py-0.5 px-1.5 rounded bg-surface border border-surface-border text-white text-xs"
                            />
                            <button
                              onClick={() => handleSaveHighlightEdit(h.id)}
                              className="p-1 rounded bg-brand-600 text-white hover:bg-brand-500"
                              title="Save Timestamps"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingHighlightId(null)}
                              className="p-1 rounded bg-surface text-slate-400 hover:text-white"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span>
                              {Math.floor(h.start_seconds / 60)}:{(h.start_seconds % 60).toFixed(1).padStart(4, '0')} →{' '}
                              {Math.floor(h.end_seconds / 60)}:{(h.end_seconds % 60).toFixed(1).padStart(4, '0')}
                            </span>
                            <span>({Math.round(h.duration_seconds)}s duration)</span>
                            <button
                              onClick={() => {
                                setEditingHighlightId(h.id);
                                setEditTitle(h.title);
                                setEditStart(h.start_seconds);
                                setEditEnd(h.end_seconds);
                              }}
                              className="text-slate-400 hover:text-brand-300 font-sans text-xs inline-flex items-center gap-1"
                            >
                              <Edit2 className="w-3 h-3" />
                              Edit
                            </button>
                          </>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400">
                        Target format: 1080×1920 (9:16 Shorts)
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: PIPELINE MONITOR ================= */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-surface-card border border-surface-border space-y-6">
            <div>
              <h2 className="text-base font-bold text-white">Pipeline Execution Status</h2>
              <p className="text-xs text-surface-muted mt-1">
                Monitors stage-by-stage local CPU analysis from audio extraction to final highlight ranking.
              </p>
            </div>

            {/* Stages Flow */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-center text-xs">
              {[
                { stage: 'extracting_audio', label: '1. Audio Extract' },
                { stage: 'transcribing', label: '2. Whisper' },
                { stage: 'detecting_scenes', label: '3. Scene Cuts' },
                { stage: 'analyzing_highlights', label: '4. AI Ranking' },
                { stage: 'rendering_clips', label: '5. Render Clips' },
                { stage: 'completed', label: '6. Complete' },
              ].map((s) => {
                const isCurrent = activeJob?.stage?.toLowerCase() === s.stage;
                return (
                  <div
                    key={s.stage}
                    className={`p-3 rounded-xl border text-xs font-semibold ${
                      isCurrent
                        ? 'bg-brand-600/20 border-brand-500 text-brand-300'
                        : 'bg-surface border-surface-border text-slate-400'
                    }`}
                  >
                    {s.label}
                  </div>
                );
              })}
            </div>

            {activeJob ? (
              <div className="space-y-3 pt-2">
                <ProgressBar
                  progress={activeJob.progress}
                  stage={activeJob.stage}
                  message={activeJob.message}
                />
                <div className="flex justify-between items-center text-xs text-surface-muted pt-2">
                  <span>Job ID: {activeJob.id}</span>
                  <span>Attempts: {activeJob.attempt_count}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-surface border border-surface-border text-xs text-slate-300 flex items-center justify-between">
                <span>Current project status: <strong>{project.status}</strong></span>
                <button
                  onClick={handleStartAnalysis}
                  disabled={actionLoading}
                  className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs shadow"
                >
                  Trigger Pipeline Job
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 3: CLIP EDITOR & 9:16 SHORTS ================= */}
      {activeTab === 'clips' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-white">Rendered 9:16 Vertical Shorts</h2>
              <p className="text-xs text-surface-muted">
                1080×1920 MP4 clips with smart face tracking and burned-in Hindi subtitles.
              </p>
            </div>
            <button
              onClick={handleRenderClips}
              disabled={actionLoading || selectedCount === 0}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold shadow"
            >
              <Scissors className="w-3.5 h-3.5" />
              Render Selected ({selectedCount})
            </button>
          </div>

          {clips.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-surface-card border border-surface-border space-y-4">
              <Scissors className="w-8 h-8 text-emerald-400 mx-auto" />
              <div>
                <h3 className="font-bold text-white text-base">No vertical clips rendered yet</h3>
                <p className="text-xs text-surface-muted max-w-sm mx-auto mt-1">
                  Select candidate moments from the Best Scene Detection tab and click "Render Selected Shorts".
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {clips.map((clip) => {
                const downloadUrl = api.getClipDownloadUrl(clip.id);

                return (
                  <div
                    key={clip.id}
                    className="p-4 rounded-2xl bg-surface-card border border-surface-border space-y-3 flex flex-col justify-between hover:border-brand-500/40 transition"
                  >
                    {/* 9:16 Vertical Thumbnail Preview */}
                    <div
                      onClick={() => setSelectedClipForModal(clip)}
                      className="relative w-full aspect-[9/16] bg-black rounded-xl overflow-hidden cursor-pointer group border border-surface-border/60 shadow-md flex items-center justify-center"
                    >
                      <video
                        src={downloadUrl}
                        preload="metadata"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition">
                        <div className="w-10 h-10 rounded-full bg-brand-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                          <Play className="w-5 h-5 ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-white">
                        {Math.round(clip.duration_seconds)}s
                      </div>
                    </div>

                    {/* Clip Info */}
                    <div className="space-y-1">
                      <div className="font-semibold text-white text-xs truncate">
                        Short #{clip.id.slice(0, 6)}
                      </div>
                      <div className="text-[11px] text-surface-muted">
                        {clip.width}x{clip.height} • {clip.fps} FPS
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-surface-border grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSelectedClipForModal(clip)}
                        className="py-1.5 px-2 rounded-lg bg-surface hover:bg-surface-cardHover border border-surface-border text-slate-200 text-xs font-medium flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3 h-3 text-brand-400" />
                        Preview
                      </button>
                      <a
                        href={downloadUrl}
                        download={`clip_${clip.id}.mp4`}
                        className="py-1.5 px-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium flex items-center justify-center gap-1 shadow"
                      >
                        <Download className="w-3 h-3" />
                        Export
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 4: VOICE-OVER STUDIO ================= */}
      {activeTab === 'voice' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-surface-card border border-surface-border space-y-5">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Mic className="w-4 h-4 text-indigo-400" />
                Hindi Voice-over & Narration Studio
              </h2>
              <p className="text-xs text-surface-muted mt-1">
                Synthesize expressive Hindi voice narration aligned with scenes without hallucinating or altering meaning.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {[
                { name: 'Energetic', desc: 'Punchy, fast-paced YouTube Shorts delivery' },
                { name: 'Storytelling', desc: 'Narrative and contextual cadence' },
                { name: 'Motivational', desc: 'Inspiring, high-energy tone' },
                { name: 'Suspenseful', desc: 'Dramatic twists and revelations' },
                { name: 'Emotional', desc: 'Reflective and heartfelt pacing' },
                { name: 'Funny', desc: 'Lighthearted comedic timing' },
              ].map((style) => (
                <div
                  key={style.name}
                  className="p-3.5 rounded-xl bg-surface border border-surface-border space-y-1"
                >
                  <div className="font-semibold text-white">{style.name}</div>
                  <div className="text-[11px] text-surface-muted">{style.desc}</div>
                </div>
              ))}
            </div>

            {clips.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-surface-border">
                <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Apply Voice-over to Rendered Short
                </h3>
                <div className="flex flex-wrap gap-2">
                  {clips.map((clip) => (
                    <button
                      key={clip.id}
                      onClick={() => handleVoiceOverRequest(clip.id)}
                      disabled={actionLoading}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-medium flex items-center gap-1.5 transition"
                    >
                      <Mic className="w-3.5 h-3.5 text-indigo-400" />
                      Synthesize Short #{clip.id.slice(0, 6)} ({Math.round(clip.duration_seconds)}s)
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 5: EXPORT CENTER ================= */}
      {activeTab === 'export' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-surface-card border border-surface-border space-y-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-400" />
                Export Center
              </h2>
              <p className="text-xs text-surface-muted mt-1">
                Download your production-ready vertical videos, subtitles, and media metadata.
              </p>
            </div>

            {clips.length === 0 ? (
              <div className="p-8 text-center text-xs text-surface-muted">
                No clips exported yet. Use the "Clip Editor" tab to render your vertical shorts.
              </div>
            ) : (
              <div className="space-y-3">
                {clips.map((clip) => {
                  const downloadUrl = api.getClipDownloadUrl(clip.id);
                  const srtUrl = api.getClipSubtitlesUrl(clip.id, 'srt');
                  const vttUrl = api.getClipSubtitlesUrl(clip.id, 'vtt');

                  return (
                    <div
                      key={clip.id}
                      className="p-4 rounded-xl bg-surface border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="font-semibold text-white">
                          Clip #{clip.id} ({Math.round(clip.duration_seconds)} seconds)
                        </div>
                        <div className="text-surface-muted text-[11px]">
                          1080×1920 • 30 FPS • H.264 MP4 • AAC Audio
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={downloadUrl}
                          download={`short_${clip.id}.mp4`}
                          className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-medium shadow flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          MP4 Video
                        </a>
                        <a
                          href={srtUrl}
                          download={`subtitles_${clip.id}.srt`}
                          className="px-3 py-1.5 rounded-lg bg-surface-card hover:bg-surface-cardHover border border-surface-border text-slate-300 font-medium flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-brand-400" />
                          SRT Subtitles
                        </a>
                        <a
                          href={vttUrl}
                          download={`subtitles_${clip.id}.vtt`}
                          className="px-3 py-1.5 rounded-lg bg-surface-card hover:bg-surface-cardHover border border-surface-border text-slate-300 font-medium flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-indigo-400" />
                          VTT
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      <VideoPlayerModal
        clip={selectedClipForModal}
        onClose={() => setSelectedClipForModal(null)}
        onVoiceRequest={(clipId) => handleVoiceOverRequest(clipId)}
      />
    </div>
  );
}
