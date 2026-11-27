'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Project } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { AnimatedContent, BlurText, Magnet, SpotlightCard } from '@/components/reactbits';
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
    <div className="space-y-6">
      {/* Header */}
      <AnimatedContent distance={14} duration={0.4}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <FolderKanban className="w-6 h-6 text-brand-600" />
              <BlurText text="Project History & Library" delay={40} />
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Browse, filter, and open any clipping project in the Studio.
            </p>
          </div>

          <Magnet magnetStrength={5} padding={14}>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-orange-500 hover:from-brand-500 hover:to-orange-400 text-white font-semibold text-xs shadow-md shadow-brand-600/20 transition self-start sm:self-auto"
            >
              <PlusCircle className="w-4 h-4" />
              New Multi-Clip Project
            </Link>
          </Magnet>
        </div>
      </AnimatedContent>

      {/* Filter & Search Bar */}
      <AnimatedContent delay={0.08} distance={14}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects by title..."
              className="w-full py-2.5 pl-10 pr-4 rounded-xl bg-surface-card border border-surface-border text-slate-900 text-xs placeholder:text-slate-400 shadow-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition"
            />
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-card border border-surface-border shadow-sm text-xs font-semibold self-start">
            {[
              { key: 'all', label: 'All' },
              { key: 'completed', label: 'Ready / Done' },
              { key: 'processing', label: 'Processing' },
              { key: 'created', label: 'Drafts' },
            ].map((tab) => {
              const active = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key as any)}
                  className={`relative px-3 py-1.5 rounded-lg transition-colors ${
                    active
                      ? 'text-white'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="history-filter-pill"
                      transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                      className="absolute inset-0 rounded-lg bg-brand-600 shadow-sm"
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </AnimatedContent>

      {/* Projects Grid */}
      {loading ? (
        <div className="p-12 text-center text-sm text-slate-500 rounded-2xl studio-card">
          Loading your projects...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-3xl studio-card space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center mx-auto">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              {search ? 'No projects match your filter' : 'No projects found'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {search
                ? 'Try clearing your search or switching status filter.'
                : 'Upload a video to create your first multi-clip shorts project.'}
            </p>
          </div>
          {!search && (
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-orange-500 text-white font-semibold text-xs shadow-md transition"
            >
              <PlusCircle className="w-4 h-4" />
              Create Project
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project, idx) => (
            <AnimatedContent key={project.id} delay={Math.min(idx * 0.04, 0.32)} distance={16}>
              <SpotlightCard className="group p-5 rounded-2xl studio-card studio-card-hover flex flex-col justify-between h-full space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      project.status === 'ready' || project.status === 'ready_for_review' || project.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : project.status === 'analyzing' || project.status === 'processing'
                        ? 'bg-brand-50 text-brand-700 border border-brand-200'
                        : project.status === 'failed'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {project.status.replace(/_/g, ' ')}
                  </span>

                  <button
                    onClick={(e) => handleDelete(project.id, e)}
                    disabled={deletingId === project.id}
                    title="Delete Project"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-brand-700 transition line-clamp-1">
                    {project.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(project.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-surface-elevated/70 border border-surface-border grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Clips</span>
                    <span className="font-bold text-brand-700 flex items-center gap-1">
                      <Scissors className="w-3 h-3" />
                      {project.settings?.number_of_highlights || 10}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Length</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {project.settings?.clip_duration_seconds || 30}s
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Format</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {project.settings?.aspect_ratio || '9:16'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">
                  #{project.id.slice(0, 8)}
                </span>
                <Link
                  href={`/projects/${project.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 text-xs font-semibold transition"
                >
                  Open Studio
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              </SpotlightCard>
            </AnimatedContent>
          ))}
        </div>
      )}
    </div>
  );
}
