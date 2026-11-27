'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Project } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import {
  FolderKanban,
  Search,
  PlusCircle,
  Trash2,
  ArrowRight,
  Clock,
  Layers,
  Scissors,
} from 'lucide-react';

export default function ProjectsHistoryPage() {
  const { isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'processing' | 'created'>('all');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const list = await api.listProjects();
      setProjects(list);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [isAuthenticated]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this project and its generated assets?')) {
      return;
    }

    try {
      setDeletingId(id);
      await api.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete project');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = projects.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    if (statusFilter === 'completed') {
      return p.status === 'completed' || p.status === 'ready' || p.status === 'ready_for_review';
    }
    if (statusFilter === 'processing') {
      return p.status === 'processing' || p.status === 'analyzing' || p.status === 'rendering';
    }
    return p.status === statusFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <FolderKanban className="w-6 h-6 text-brand-400" />
            Project History & Library
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse, filter, and open any clipping project in the Studio.
          </p>
        </div>

        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-brand-600/25 ring-1 ring-white/15 transition self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          New Multi-Clip Project
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects by title..."
            className="w-full py-2.5 pl-10 pr-4 rounded-xl studio-card text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/[0.07] text-xs font-medium self-start">
          {[
            { key: 'all', label: 'All' },
            { key: 'completed', label: 'Ready / Done' },
            { key: 'processing', label: 'Processing' },
            { key: 'created', label: 'Drafts' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key as any)}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === tab.key
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="p-12 text-center text-sm text-slate-400 rounded-2xl studio-card">
          Loading your projects...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-3xl studio-card space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/15 border border-brand-500/25 text-brand-400 flex items-center justify-center mx-auto">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">
              {search ? 'No projects match your filter' : 'No projects found'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              {search
                ? 'Try clearing your search or switching status filter.'
                : 'Upload a video to create your first multi-clip shorts project.'}
            </p>
          </div>
          {!search && (
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-semibold text-xs shadow-lg transition"
            >
              <PlusCircle className="w-4 h-4" />
              Create Project
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <div
              key={project.id}
              className="group p-5 rounded-2xl studio-card studio-card-hover flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                      project.status === 'ready' || project.status === 'ready_for_review' || project.status === 'completed'
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : project.status === 'analyzing' || project.status === 'processing'
                        ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30'
                        : project.status === 'failed'
                        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        : 'bg-slate-700/30 text-slate-300 border border-slate-600/30'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {project.status.replace(/_/g, ' ')}
                  </span>

                  <button
                    onClick={(e) => handleDelete(project.id, e)}
                    disabled={deletingId === project.id}
                    title="Delete Project"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h3 className="font-bold text-white text-base group-hover:text-brand-300 transition line-clamp-1">
                    {project.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(project.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-black/25 border border-white/[0.06] grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Clips</span>
                    <span className="font-semibold text-brand-300 flex items-center gap-1">
                      <Scissors className="w-3 h-3" />
                      {project.settings?.number_of_highlights || 10}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Length</span>
                    <span className="font-mono font-semibold text-white">
                      {project.settings?.clip_duration_seconds || 30}s
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Format</span>
                    <span className="font-mono font-semibold text-white">
                      {project.settings?.aspect_ratio || '9:16'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-500">
                  #{project.id.slice(0, 8)}
                </span>
                <Link
                  href={`/projects/${project.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600/20 hover:bg-brand-600/35 text-brand-200 border border-brand-500/30 text-xs font-semibold transition"
                >
                  Open Studio
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
