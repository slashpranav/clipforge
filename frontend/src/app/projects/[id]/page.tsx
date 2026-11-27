'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Clip, Highlight, Job, Project, Video } from '@/lib/types';
import {
  Sparkles,
  Scissors,
  Play,
  RotateCcw,
  CheckCircle2,
  Download,
  FileText,
  Sliders,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Mic,
  Eye,
  Check,
  Edit2,
  Save,
  X,
  Clock,
  Captions,
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

  // Real-time Job Polling
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const poll = async () => {
      if (
        project?.status === 'analyzing' ||
        project?.status === 'processing' ||
        (activeJob && (activeJob.status === 'queued' || activeJob.status === 'running'))
      ) {
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
      setProject((p) => (p ? { ...p, status: 'processing' } : p));
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

  // Action: Bulk Select / Deselect Highlights
  const handleToggleAllHighlights = async (selectAll: boolean) => {
    const toUpdate = highlights.filter((h) => h.selected !== selectAll);
    if (toUpdate.length === 0) return;
    try {
      setActionLoading(true);
      const updatedList = await Promise.all(
        toUpdate.map((h) => api.updateHighlight(h.id, { selected: selectAll }))
      );
      const updatedMap = new Map(updatedList.map((u) => [u.id, u]));
      setHighlights((prev) => prev.map((h) => updatedMap.get(h.id) || h));
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to update highlights.' });
    } finally {
      setActionLoading(false);
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
      setNotification({
        type: 'success',
        message: `Rendering ${selectedHighlights.length} vertical 9:16 short(s)...`,
      });
      const rendered = await api.generateClips(projectId, {
        highlight_ids: selectedHighlights.map((h) => h.id),
        smart_crop: project?.settings?.smart_crop ?? true,
        burn_subtitles: true,
      });
      setClips(rendered);
      setActiveTab('clips');
      setNotification({ type: 'success', message: `Successfully rendered ${rendered.length} vertical clips!` });
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
        <p className="text-xs text-slate-400">Loading ClipForge Studio...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-10 text-center rounded-3xl studio-card space-y-4 max-w-md mx-auto mt-10">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Project Not Found</h2>
        <button
          onClick={() => router.push('/projects')}
          className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition"
        >
          Return to Projects
        </button>
      </div>
    );
  }

  const selectedCount = highlights.filter((h) => h.selected).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Studio Workspace Header */}
      <div className="p-6 rounded-3xl studio-card space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <button
                onClick={() => router.push('/projects')}
                className="hover:text-white transition inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Projects
              </button>
              <span className="text-slate-600">/</span>
              <span className="text-slate-300 truncate max-w-xs">{project.title}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight truncate">
                {project.title}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  project.status === 'ready' || project.status === 'ready_for_review' || project.status === 'completed'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : project.status === 'analyzing' || project.status === 'processing'
                    ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30'
                    : 'bg-slate-700/30 text-slate-300 border border-slate-600/30'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {project.status.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleStartAnalysis}
              disabled={actionLoading || project.status === 'analyzing' || project.status === 'processing'}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-slate-200 hover:text-white text-xs font-semibold disabled:opacity-45 transition"
            >
              <RotateCcw
                className={`w-3.5 h-3.5 text-brand-400 ${
                  project.status === 'analyzing' || project.status === 'processing' ? 'animate-spin' : ''
                }`}
              />
              {project.status === 'analyzing' || project.status === 'processing' ? 'Analyzing...' : 'Re-run Analysis'}
            </button>

            <button
              onClick={handleRenderClips}
              disabled={actionLoading || selectedCount === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-45 text-white text-xs font-semibold shadow-lg shadow-brand-600/25 ring-1 ring-white/15 transition"
            >
              <Scissors className="w-3.5 h-3.5" />
              Render {selectedCount} Short{selectedCount === 1 ? '' : 's'} (9:16)
            </button>
          </div>
        </div>

        {/* Studio Quick Stats Strip */}
        <div className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center gap-5 text-[11px] text-slate-400">
          {video && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Source: <strong className="text-slate-200 font-mono">{Math.round(video.duration_seconds)}s</strong> ({video.width}×{video.height})
            </span>
          )}
          <span>
            Detected Scenes: <strong className="text-white font-mono">{highlights.length}</strong>
          </span>
          <span>
            Rendered Shorts: <strong className="text-emerald-400 font-mono">{clips.length}</strong>
          </span>
          <span>
            Output Format: <strong className="text-brand-300 font-mono">1080×1920 (9:16)</strong>
          </span>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between transition ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Segmented Studio Navigation Bar */}
      <div className="p-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex overflow-x-auto gap-1.5">
        {[
          { key: 'highlights', label: `Best Scenes (${highlights.length})`, icon: Sparkles },
          {
            key: 'pipeline',
            label: 'Pipeline Monitor',
            icon: Sliders,
            pulse: project.status === 'analyzing' || project.status === 'processing',
          },
          { key: 'clips', label: `9:16 Multi-Clips (${clips.length})`, icon: Scissors },
          { key: 'voice', label: 'Voice-Over Studio', icon: Mic },
          { key: 'export', label: 'Export Center', icon: Download },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition whitespace-nowrap ${
                active
                  ? 'bg-gradient-to-r from-brand-600/90 to-indigo-600/90 text-white shadow-md ring-1 ring-white/15'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.pulse && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
            </button>
          );
        })}
      </div>

      {/* ================= TAB 1: BEST SCENE DETECTION ================= */}
      {activeTab === 'highlights' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-white">Ranked Clipping Opportunities</h2>
              <p className="text-xs text-slate-400">
                Sentence-aligned windows scored on hook energy, lexical density, and visual framing.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start">
              {highlights.length > 0 && (
                <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.07] text-[11px]">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleToggleAllHighlights(true)}
                    className="px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.06] transition font-medium"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleToggleAllHighlights(false)}
                    className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition font-medium"
                  >
                    Clear
                  </button>
                </div>
              )}
              <div className="text-xs px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-slate-300">
                <span className="font-bold text-brand-300 tabular-nums">{selectedCount}</span> of {highlights.length} selected for 9:16 render
              </div>
            </div>
          </div>

          {highlights.length === 0 ? (
            <div className="p-12 text-center rounded-3xl studio-card space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/15 border border-brand-500/25 text-brand-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">No scenes analyzed yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Run the AI pipeline to automatically extract audio, transcribe speech, and score top scenes.
                </p>
              </div>
              <button
                onClick={handleStartAnalysis}
                disabled={actionLoading || project.status === 'analyzing' || project.status === 'processing'}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-semibold text-xs shadow-lg transition"
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
                    className={`p-5 rounded-2xl border transition space-y-3.5 ${
                      h.selected
                        ? 'studio-card border-brand-500/40 shadow-glow'
                        : 'bg-[#0e111a] border-white/[0.06] opacity-75'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3.5 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleHighlight(h)}
                          className={`w-5 h-5 mt-0.5 rounded-md border flex items-center justify-center transition shrink-0 ${
                            h.selected
                              ? 'bg-brand-600 border-brand-400 text-white shadow-sm'
                              : 'bg-black/30 border-white/20 text-transparent hover:border-brand-400'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>

                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                                idx === 0
                                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                  : idx < 3
                                  ? 'bg-brand-500/15 text-brand-300 border-brand-500/30'
                                  : 'bg-white/[0.04] text-slate-300 border-white/[0.08]'
                              }`}
                            >
                              #{idx + 1}
                            </span>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="py-1 px-2.5 text-sm rounded-lg bg-black/40 border border-brand-500 text-white focus:outline-none"
                              />
                            ) : (
                              <h3 className="font-bold text-white text-sm">{h.title}</h3>
                            )}
                          </div>

                          <p className="text-xs text-brand-300/90 font-medium">{h.reason}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                        <ScoreBadge score={h.score} breakdown={h.score_breakdown} size="md" />
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-black/30 border border-white/[0.05] text-xs text-slate-300 italic leading-relaxed">
                      "{h.transcript_excerpt || 'Dialogue moment from speech transcript...'}"
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-xs pt-2 border-t border-white/[0.05] gap-2">
                      <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
                        {isEditing ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>Start:</span>
                            <input
                              type="number"
                              step="0.1"
                              value={editStart}
                              onChange={(e) => setEditStart(Number(e.target.value))}
                              className="w-16 py-1 px-2 rounded-lg bg-black/40 border border-white/15 text-white text-xs"
                            />
                            <span>End:</span>
                            <input
                              type="number"
                              step="0.1"
                              value={editEnd}
                              onChange={(e) => setEditEnd(Number(e.target.value))}
                              className="w-16 py-1 px-2 rounded-lg bg-black/40 border border-white/15 text-white text-xs"
                            />
                            <button
                              onClick={() => handleSaveHighlightEdit(h.id)}
                              className="p-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-500"
                              title="Save Timestamps"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingHighlightId(null)}
                              className="p-1.5 rounded-lg bg-white/[0.06] text-slate-300 hover:text-white"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="text-slate-200">
                              {Math.floor(h.start_seconds / 60)}:{(h.start_seconds % 60).toFixed(1).padStart(4, '0')} →{' '}
                              {Math.floor(h.end_seconds / 60)}:{(h.end_seconds % 60).toFixed(1).padStart(4, '0')}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-white/[0.04] text-slate-300">
                              {Math.round(h.duration_seconds)}s
                            </span>
                            <button
                              onClick={() => {
                                setEditingHighlightId(h.id);
                                setEditTitle(h.title);
                                setEditStart(h.start_seconds);
                                setEditEnd(h.end_seconds);
                              }}
                              className="text-slate-400 hover:text-brand-300 font-sans text-xs inline-flex items-center gap-1 transition"
                            >
                              <Edit2 className="w-3 h-3" />
                              Trim
                            </button>
                          </>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 font-mono">1080×1920 Vertical</div>
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
        <div className="p-6 md:p-7 rounded-3xl studio-card space-y-6">
          <div>
            <h2 className="text-base font-bold text-white">Pipeline Execution Monitor</h2>
            <p className="text-xs text-slate-400 mt-1">
              Real-time processing across audio extraction, speech recognition, scene scoring, and 9:16 encoding.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5 text-center text-xs">
            {[
              { stage: 'extracting_audio', label: '1. Audio Extract' },
              { stage: 'transcribing', label: '2. Transcribe' },
              { stage: 'detecting_scenes', label: '3. Scene Cuts' },
              { stage: 'analyzing_highlights', label: '4. AI Ranking' },
              { stage: 'rendering_clips', label: '5. Render Clips' },
              { stage: 'completed', label: '6. Complete' },
            ].map((s, idx, arr) => {
              const stageOrder = arr.map((x) => x.stage);
              const rawStage = (activeJob?.stage || '').toLowerCase();
              const normalizedStage = rawStage === 'ready_for_review' ? 'completed' : rawStage;
              const currentIndex = stageOrder.indexOf(normalizedStage);
              const isCompleted =
                activeJob?.status === 'completed' || (currentIndex !== -1 && idx < currentIndex);
              const isCurrent = activeJob?.status !== 'completed' && currentIndex === idx;

              return (
                <div
                  key={s.stage}
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    isCompleted
                      ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                      : isCurrent
                      ? 'bg-brand-500/20 border-brand-400 text-white shadow-sm'
                      : 'bg-black/25 border-white/[0.07] text-slate-500'
                  }`}
                >
                  {isCompleted && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  <span>{s.label}</span>
                </div>
              );
            })}
          </div>

          {activeJob ? (
            <div className="p-5 rounded-2xl bg-black/30 border border-white/[0.07] space-y-3">
              <ProgressBar
                progress={activeJob.progress}
                stage={activeJob.stage}
                message={activeJob.message}
              />
              <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono pt-1">
                <span>Job ID: {activeJob.id}</span>
                <span>Attempts: {activeJob.attempt_count}</span>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-black/30 border border-white/[0.07] text-xs text-slate-300 flex items-center justify-between">
              <span>
                Current project state: <strong className="text-white uppercase">{project.status}</strong>
              </span>
              <button
                onClick={handleStartAnalysis}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow"
              >
                Run Pipeline Job
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: CLIP EDITOR & 9:16 MULTI-CLIPS ================= */}
      {activeTab === 'clips' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">Rendered 9:16 Multi-Clips</h2>
              <p className="text-xs text-slate-400">
                1080×1920 vertical MP4 shorts with smart subject framing and burned-in subtitles.
              </p>
            </div>
            <button
              onClick={handleRenderClips}
              disabled={actionLoading || selectedCount === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-45 text-white text-xs font-semibold shadow-md self-start sm:self-auto"
            >
              <Scissors className="w-3.5 h-3.5" />
              Re-Render Selected ({selectedCount})
            </button>
          </div>

          {clips.length === 0 ? (
            <div className="p-12 text-center rounded-3xl studio-card space-y-3">
              <Scissors className="w-9 h-9 text-emerald-400 mx-auto" />
              <div>
                <h3 className="font-bold text-white text-base">No vertical clips rendered yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Select candidate scenes in Best Scenes and click "Render Shorts (9:16)".
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {clips.map((clip, i) => {
                const downloadUrl = api.getClipDownloadUrl(clip.id);
                const srtUrl = api.getClipSubtitlesUrl(clip.id, 'srt');

                return (
                  <div
                    key={clip.id}
                    className="p-3.5 rounded-2xl studio-card studio-card-hover space-y-3 flex flex-col justify-between"
                  >
                    {/* 9:16 Vertical Preview Card */}
                    <div
                      onClick={() => setSelectedClipForModal(clip)}
                      className="relative w-full aspect-[9/16] bg-black rounded-xl overflow-hidden cursor-pointer group border border-white/[0.08] shadow-inner"
                    >
                      <video
                        src={downloadUrl}
                        preload="metadata"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-brand-600/90 text-white flex items-center justify-center shadow-xl ring-2 ring-white/25 group-hover:scale-110 transition">
                          <Play className="w-5 h-5 ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-sm border border-white/10 text-[10px] font-mono font-bold text-white">
                        #{i + 1}
                      </div>
                      <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-brand-500/20 backdrop-blur-sm border border-brand-400/30 text-[10px] font-semibold uppercase text-brand-200">
                        {clip.subtitle_language || 'Auto'}
                      </div>
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-mono text-slate-200">
                        <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-sm border border-white/10">
                          {clip.width}×{clip.height}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-sm border border-white/10 text-white font-bold">
                          {Math.round(clip.duration_seconds)}s
                        </span>
                      </div>
                    </div>

                    <div className="space-y-0.5 px-0.5">
                      <div className="font-semibold text-white text-xs truncate">
                        Short #{i + 1} ({clip.id.slice(0, 6)})
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        9:16 MP4 • {clip.fps} FPS
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/[0.06] grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => setSelectedClipForModal(clip)}
                        className="py-2 px-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-200 text-[11px] font-semibold flex items-center justify-center gap-1 transition"
                      >
                        <Eye className="w-3.5 h-3.5 text-brand-400" />
                        Play
                      </button>
                      <a
                        href={downloadUrl}
                        download={`short_${i + 1}_${clip.id.slice(0, 6)}.mp4`}
                        className="py-2 px-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-[11px] font-semibold flex items-center justify-center gap-1 shadow transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        MP4
                      </a>
                      <a
                        href={srtUrl}
                        download={`subtitles_${clip.id}.srt`}
                        className="py-2 px-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-200 text-[11px] font-semibold flex items-center justify-center gap-1 transition"
                      >
                        <FileText className="w-3.5 h-3.5 text-cyan-400" />
                        SRT
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
        <div className="p-6 md:p-7 rounded-3xl studio-card space-y-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Mic className="w-4 h-4 text-indigo-400" />
              Hindi Voice-over Narration Studio
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Synthesize expressive Hindi narration aligned with your rendered clips without changing source facts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {[
              { name: 'Energetic', desc: 'Punchy, fast-paced Shorts delivery' },
              { name: 'Storytelling', desc: 'Smooth narrative & contextual pacing' },
              { name: 'Motivational', desc: 'Bold, high-conviction vocal tone' },
              { name: 'Suspenseful', desc: 'Dramatic tension & reveal cadence' },
              { name: 'Emotional', desc: 'Reflective and heartfelt expression' },
              { name: 'Funny', desc: 'Upbeat, lighthearted timing' },
            ].map((style) => (
              <div
                key={style.name}
                className="p-4 rounded-2xl bg-black/25 border border-white/[0.07] space-y-1"
              >
                <div className="font-bold text-white">{style.name}</div>
                <div className="text-[11px] text-slate-400">{style.desc}</div>
              </div>
            ))}
          </div>

          {clips.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-white/[0.07]">
              <h3 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Generate Hindi Narration for Rendered Clips
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {clips.map((clip, i) => (
                  <button
                    key={clip.id}
                    onClick={() => handleVoiceOverRequest(clip.id)}
                    disabled={actionLoading}
                    className="px-4 py-2.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-200 text-xs font-semibold flex items-center gap-2 transition"
                  >
                    <Mic className="w-3.5 h-3.5 text-indigo-400" />
                    Synthesize Short #{i + 1} ({Math.round(clip.duration_seconds)}s)
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 5: EXPORT CENTER ================= */}
      {activeTab === 'export' && (
        <div className="p-6 md:p-7 rounded-3xl studio-card space-y-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-400" />
              Export & Download Center
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Download production-ready 1080×1920 vertical MP4 files and subtitle sidecars (.SRT / .VTT).
            </p>
          </div>

          {clips.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400 bg-black/20 rounded-2xl border border-white/[0.06]">
              No clips exported yet. Render your selected moments in the 9:16 Multi-Clips tab.
            </div>
          ) : (
            <div className="space-y-3">
              {clips.map((clip, i) => {
                const downloadUrl = api.getClipDownloadUrl(clip.id);
                const srtUrl = api.getClipSubtitlesUrl(clip.id, 'srt');
                const vttUrl = api.getClipSubtitlesUrl(clip.id, 'vtt');

                return (
                  <div
                    key={clip.id}
                    className="p-4 rounded-2xl bg-black/25 border border-white/[0.07] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-white">
                        Short #{i + 1} — {Math.round(clip.duration_seconds)}s ({clip.id.slice(0, 8)})
                      </div>
                      <div className="text-slate-400 font-mono text-[11px]">
                        {clip.width}×{clip.height} • {clip.fps} FPS • H.264 MP4 + AAC Audio
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={downloadUrl}
                        download={`short_${i + 1}_${clip.id.slice(0, 6)}.mp4`}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold shadow flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        MP4 Video
                      </a>
                      <a
                        href={srtUrl}
                        download={`subtitles_${clip.id}.srt`}
                        className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-200 font-medium flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5 text-brand-400" />
                        .SRT
                      </a>
                      <a
                        href={vttUrl}
                        download={`subtitles_${clip.id}.vtt`}
                        className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-200 font-medium flex items-center gap-1.5"
                      >
                        <Captions className="w-3.5 h-3.5 text-cyan-400" />
                        .VTT
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
