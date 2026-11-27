'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Project, Video } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import {
  Film,
  Scissors,
  ArrowRight,
  PlusCircle,
  Sparkles,
  UploadCloud,
  Layers,
  Activity,
  FolderKanban,
  Wand2,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import { ProgressBar } from '@/components/ProgressBar';

export default function DashboardPage() {
  const { isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [clipsCount, setClipsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [projList, vidList] = await Promise.allSettled([
          api.listProjects(),
          api.listVideos(),
        ]);

        let loadedProjects: Project[] = [];
        if (projList.status === 'fulfilled') {
          loadedProjects = projList.value;
          setProjects(loadedProjects);
        }

        if (vidList.status === 'fulfilled') {
          setVideos(vidList.value);
        }

        if (loadedProjects.length > 0) {
          const clipResults = await Promise.allSettled(
            loadedProjects.slice(0, 10).map((p) => api.listClips(p.id))
          );
          let total = 0;
          clipResults.forEach((res) => {
            if (res.status === 'fulfilled') total += res.value.length;
          });
          setClipsCount(total);
        }
      } catch (err) {
        console.error('Error loading dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isAuthenticated]);

  const activeProjects = projects.filter(
    (p) => p.status === 'analyzing' || p.status === 'processing' || p.status === 'rendering'
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Studio Hero Showcase */}
      <div className="relative rounded-3xl p-7 md:p-9 studio-card overflow-hidden">
        <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-brand-600/20 blur-3xl pointer-events-none" />
        <div className="absolute right-10 -bottom-24 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold bg-brand-500/15 text-brand-300 border border-brand-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Multi-Clip Shorts Studio
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-[1.15]">
              Turn Long Videos into Ready-to-Post{' '}
              <span className="bg-gradient-to-r from-brand-300 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                9:16 Multi-Clips
              </span>
            </h1>
            <p className="text-sm text-slate-300/90 leading-relaxed max-w-xl">
              Intelligent speech recognition, smart scene scoring, face-aware vertical framing, and automatic 9:16 multi-clip generation in one studio.
            </p>
            <div className="pt-1 flex flex-wrap gap-3">
              <Link
                href="/projects/new"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-brand-600/25 ring-1 ring-white/15 transition"
              >
                <PlusCircle className="w-4 h-4" />
                Create Multi-Clip Project
              </Link>
              <Link
                href="/projects"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-slate-200 hover:text-white font-medium text-xs transition"
              >
                <FolderKanban className="w-4 h-4 text-slate-400" />
                Browse History
              </Link>
            </div>
          </div>

          {/* 3-Step Pipeline Mini Visual */}
          <div className="hidden lg:grid grid-cols-1 gap-2.5 w-64 shrink-0">
            {[
              { icon: UploadCloud, title: '1. Upload Source', sub: 'MP4, MOV, MKV or YouTube Ref', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
              { icon: Wand2, title: '2. AI Scene Ranking', sub: 'Select 5, 10, 15 or 20 clips', color: 'text-brand-400 bg-brand-500/10 border-brand-500/20' },
              { icon: Smartphone, title: '3. Auto 9:16 Export', sub: '1080×1920 MP4 + Subtitles', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
            ].map((step) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={step.title}
                  className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-center gap-3 backdrop-blur-sm"
                >
                  <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${step.color}`}>
                    <StepIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{step.title}</div>
                    <div className="text-[10px] text-slate-400 truncate">{step.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl studio-card studio-card-hover space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Source Videos
            </span>
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center">
              <Film className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tabular-nums">{videos.length}</div>
          <div className="text-[11px] text-slate-400">Uploaded media assets</div>
        </div>

        <div className="p-5 rounded-2xl studio-card studio-card-hover space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Projects
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tabular-nums">{projects.length}</div>
          <div className="text-[11px] text-slate-400">
            {activeProjects.length > 0 ? `${activeProjects.length} processing live` : 'All pipelines idle'}
          </div>
        </div>

        <div className="p-5 rounded-2xl studio-card studio-card-hover space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Generated Shorts
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Scissors className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tabular-nums">{clipsCount}</div>
          <div className="text-[11px] text-slate-400">9:16 vertical MP4 exports</div>
        </div>

        <div className="p-5 rounded-2xl studio-card studio-card-hover space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Ready to Publish
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tabular-nums">
            {projects.filter((p) => p.status === 'completed' || p.status === 'ready' || p.status === 'ready_for_review').length}
          </div>
          <div className="text-[11px] text-slate-400">Projects ready for export</div>
        </div>
      </div>

      {/* Active Processing Jobs */}
      {activeProjects.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-400 animate-pulse" />
            Active Processing Queue
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeProjects.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-2xl studio-card border-brand-500/30 space-y-3"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white text-sm truncate">{p.title}</h3>
                    <p className="text-xs text-slate-400 capitalize">Status: {p.status}</p>
                  </div>
                  <Link
                    href={`/projects/${p.id}`}
                    className="text-xs text-brand-300 hover:text-brand-200 font-semibold flex items-center gap-1 shrink-0"
                  >
                    Open Studio <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <ProgressBar progress={p.status === 'rendering' ? 85 : 45} stage={p.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Projects Table */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Recent Projects</h2>
            <p className="text-xs text-slate-400">Jump back into scene review, editing, and clip export</p>
          </div>
          <Link
            href="/projects"
            className="text-xs text-brand-300 hover:text-brand-200 font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.07] transition"
          >
            View All ({projects.length}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400 rounded-2xl studio-card">
            Loading workspace analytics...
          </div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center rounded-3xl studio-card space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-500/15 border border-brand-500/25 text-brand-400 flex items-center justify-center mx-auto">
              <UploadCloud className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">No clipping projects yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Upload a video file and select 10 or 15 clips to automatically build ready-to-post vertical shorts.
              </p>
            </div>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-brand-600/25 transition"
            >
              <PlusCircle className="w-4 h-4" />
              Create First Project
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl studio-card">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] border-b border-white/[0.06] text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                <tr>
                  <th className="py-3.5 px-5">Project</th>
                  <th className="py-3.5 px-4">Target Clips</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Format</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Created</th>
                  <th className="py-3.5 px-5 text-right">Studio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {projects.slice(0, 6).map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.025] transition">
                    <td className="py-3.5 px-5 font-semibold text-white max-w-xs truncate">
                      {p.title}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {p.settings?.number_of_highlights || 10} clips
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {p.settings?.clip_duration_seconds || 30}s
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-slate-300 font-mono text-[11px]">
                        {p.settings?.aspect_ratio || '9:16'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                          p.status === 'ready' || p.status === 'ready_for_review' || p.status === 'completed'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : p.status === 'analyzing' || p.status === 'processing'
                            ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30'
                            : p.status === 'failed'
                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            : 'bg-slate-700/30 text-slate-300 border border-slate-600/30'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {p.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Link
                        href={`/projects/${p.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600/20 hover:bg-brand-600/35 text-brand-200 font-semibold text-xs border border-brand-500/30 transition"
                      >
                        Open Studio
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
