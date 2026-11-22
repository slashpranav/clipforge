'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Project, Video, Clip } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import {
  Film,
  Scissors,
  CheckCircle2,
  Clock,
  ArrowRight,
  PlusCircle,
  Sparkles,
  Play,
  UploadCloud,
  Layers,
  Activity
} from 'lucide-react';
import { ProgressBar } from '@/components/ProgressBar';

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
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

        // Count all clips across projects
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
    (p) => p.status === 'analyzing' || p.status === 'rendering'
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / Hero */}
      <div className="relative rounded-2xl p-6 md:p-8 bg-gradient-to-r from-brand-900/40 via-surface-card to-surface-card border border-brand-500/20 overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered YouTube to 9:16 Shorts
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Transform Long Videos into High-Impact Shorts
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Automatic scene detection, face-aware smart cropping, explainable highlight scoring, and synchronized Hindi captions with zero manual hassle.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href="/projects/new"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-lg shadow-brand-600/30 transition"
            >
              <PlusCircle className="w-4 h-4" />
              Create New Project
            </Link>
            <Link
              href="/projects"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface hover:bg-surface-card border border-surface-border text-slate-300 hover:text-white font-medium text-sm transition"
            >
              <FolderKanban className="w-4 h-4 text-slate-400" />
              View All Projects
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-surface-card border border-surface-border space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total Videos</span>
            <Film className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-2xl font-bold text-white">{videos.length}</div>
          <div className="text-[11px] text-surface-muted">Uploaded source media</div>
        </div>

        <div className="p-5 rounded-xl bg-surface-card border border-surface-border space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Active Projects</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{projects.length}</div>
          <div className="text-[11px] text-surface-muted">
            {activeProjects.length > 0 ? `${activeProjects.length} processing now` : 'All projects up to date'}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-surface-card border border-surface-border space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Rendered Clips</span>
            <Scissors className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{clipsCount}</div>
          <div className="text-[11px] text-surface-muted">9:16 vertical shorts generated</div>
        </div>

        <div className="p-5 rounded-xl bg-surface-card border border-surface-border space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Processing Engine</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-base font-bold text-emerald-400 flex items-center gap-1.5 pt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            CPU Optimized (int8)
          </div>
          <div className="text-[11px] text-surface-muted">faster-whisper + PySceneDetect</div>
        </div>
      </div>

      {/* Active Processing Jobs (if any) */}
      {activeProjects.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-400 animate-spin" />
            Active Video Analysis in Progress
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeProjects.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-xl bg-surface-card border border-brand-500/30 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-white text-sm">{p.title}</h3>
                    <p className="text-xs text-surface-muted">Status: {p.status}</p>
                  </div>
                  <Link
                    href={`/projects/${p.id}`}
                    className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1"
                  >
                    View Studio <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <ProgressBar progress={p.status === 'analyzing' ? 45 : 85} stage={p.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Projects Table */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Recent Projects</h2>
          <Link
            href="/projects"
            className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1"
          >
            View All ({projects.length}) <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-surface-muted rounded-xl bg-surface-card border border-surface-border">
            Loading project statistics...
          </div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-surface-card border border-surface-border space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-600/10 text-brand-400 flex items-center justify-center mx-auto">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">No clipping projects yet</h3>
              <p className="text-xs text-surface-muted max-w-sm mx-auto mt-1">
                Upload your first long-form video or enter a YouTube reference link to start auto-generating vertical shorts.
              </p>
            </div>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Create First Project
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-surface-border bg-surface-card">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface/60 border-b border-surface-border text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Project Name</th>
                  <th className="py-3 px-4">Aspect</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {projects.slice(0, 5).map((p) => (
                  <tr key={p.id} className="hover:bg-surface-cardHover transition">
                    <td className="py-3.5 px-4 font-medium text-white max-w-xs truncate">
                      {p.title}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-surface border border-surface-border text-slate-300 font-mono">
                        {p.settings?.aspect_ratio || '9:16'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {p.settings?.clip_duration_seconds || 30}s
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                          p.status === 'ready' || p.status === 'completed'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : p.status === 'analyzing'
                            ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                            : 'bg-slate-700/30 text-slate-300 border border-slate-600/30'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-surface-muted">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/projects/${p.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 font-semibold text-xs border border-brand-500/30 transition"
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

function FolderKanban(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
      <path d="M8 10v4" />
      <path d="M12 10v2" />
      <path d="M16 10v6" />
    </svg>
  );
}
