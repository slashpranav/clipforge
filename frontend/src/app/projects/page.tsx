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
  Sparkles,
  AlertCircle
} from 'lucide-react';

export default function ProjectsHistoryPage() {
  const { isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
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

  const filtered = projects.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Title & New Project button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-brand-400" />
            Project History & Workspace
          </h1>
          <p className="text-xs text-surface-muted mt-1">
            Browse, manage, and edit all long-form video clipping projects.
          </p>
        </div>

        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md shadow-brand-600/30 transition self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          New Project
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects by name..."
          className="w-full py-2.5 pl-9 pr-4 rounded-xl bg-surface-card border border-surface-border text-white text-xs focus:outline-none focus:border-brand-500 transition"
        />
      </div>

      {/* Projects Grid / List */}
      {loading ? (
        <div className="p-12 text-center text-sm text-surface-muted rounded-2xl bg-surface-card border border-surface-border">
          Loading your projects...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-surface-card border border-surface-border space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-600/15 text-brand-400 flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-base">
              {search ? 'No projects match your search' : 'No projects found'}
            </h3>
            <p className="text-xs text-surface-muted max-w-sm mx-auto mt-1">
              {search
                ? 'Try a different search keyword.'
                : 'Upload a video to create your first 9:16 vertical shorts project.'}
            </p>
          </div>
          {!search && (
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Create Project
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <div
              key={project.id}
              className="group p-5 rounded-2xl bg-surface-card hover:bg-surface-cardHover border border-surface-border hover:border-brand-500/30 transition flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                      project.status === 'ready' || project.status === 'completed'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : project.status === 'analyzing'
                        ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                        : 'bg-slate-700/30 text-slate-300 border border-slate-600/30'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    {project.status}
                  </span>

                  <button
                    onClick={(e) => handleDelete(project.id, e)}
                    disabled={deletingId === project.id}
                    title="Delete Project"
                    className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-surface transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h3 className="font-bold text-white text-base group-hover:text-brand-300 transition line-clamp-1">
                    {project.title}
                  </h3>
                  <p className="text-xs text-surface-muted mt-1 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    Created {new Date(project.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-surface/70 border border-surface-border/60 grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                  <div>
                    <span className="text-surface-muted block text-[10px]">Target Duration</span>
                    <span className="font-semibold text-white">
                      {project.settings?.clip_duration_seconds || 30}s
                    </span>
                  </div>
                  <div>
                    <span className="text-surface-muted block text-[10px]">Aspect Ratio</span>
                    <span className="font-semibold text-white">
                      {project.settings?.aspect_ratio || '9:16'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-surface-border/60 flex items-center justify-between">
                <span className="text-[11px] text-surface-muted">
                  ID: {project.id.slice(0, 8)}...
                </span>
                <Link
                  href={`/projects/${project.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-400 hover:text-brand-300 transition"
                >
                  Enter Studio
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
