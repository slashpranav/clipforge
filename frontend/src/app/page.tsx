'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
import {
  AnimatedContent,
  BlurText,
  CountUp,
  Magnet,
  ShinyText,
  SpotlightCard,
  StarBorder,
} from '@/components/reactbits';

const HERO_SLIDES = [
  { src: '/hero/bg-1.jpg', alt: 'AI video editing timeline and audio waveform studio' },
  { src: '/hero/bg-2.jpg', alt: 'Podcast and creator recording studio setup' },
  { src: '/hero/bg-3.jpg', alt: 'Vertical 9:16 smartphone filming studio' },
  { src: '/hero/bg-4.jpg', alt: 'AI scene scoring frames and creative workspace' },
  { src: '/hero/bg-5.jpg', alt: 'Cinema production and color grading workstation' },
];

export default function DashboardPage() {
  const { isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [clipsCount, setClipsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const activeStep = hoveredStep !== null ? hoveredStep : activeSlide % 3;

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

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
    <div className="space-y-8">
      {/* Studio Hero Showcase */}
      <AnimatedContent distance={16} duration={0.45}>
        <StarBorder className="shadow-[0_14px_38px_-14px_rgba(225,29,72,0.22)]">
          <div className="relative p-7 md:p-9 hero-lavender overflow-hidden">
            {/* Rotating Studio Background Images (3s interval, smooth crossfade) */}
            <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
              {HERO_SLIDES.map((slide, idx) => {
                const isActive = idx === activeSlide;
                return (
                  <img
                    key={slide.src}
                    src={slide.src}
                    alt={slide.alt}
                    className={`absolute inset-0 w-full h-full object-cover object-center transition-[opacity,transform] duration-1000 ease-in-out will-change-[opacity,transform] ${
                      isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                    }`}
                  />
                );
              })}
              {/* Warm off-white & rose-coral frosted scrim for clear background visibility + crisp text readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#f7f2f4]/90 via-[#f8ecee]/75 to-[#f5e3e0]/35 backdrop-blur-[1px]" />
              <div className="absolute inset-0 bg-gradient-to-b from-[#f8f3f5]/25 via-transparent to-[#f3eff1]/40" />
            </div>

            <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-brand-400/20 blur-3xl pointer-events-none" />
            <div className="absolute right-12 -bottom-24 w-64 h-64 rounded-full bg-orange-300/20 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold bg-surface-card/95 border border-brand-200/80 shadow-sm backdrop-blur-sm">
                  <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                  <ShinyText text="AI-Powered Multi-Clip Shorts Studio" speed={3.6} />
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.15] drop-shadow-[0_1px_2px_rgba(244,245,248,0.9)]">
                  <BlurText text="Turn Long Videos into Ready-to-Post" delay={40} />{' '}
                  <span className="bg-gradient-to-r from-brand-600 to-orange-500 bg-clip-text text-transparent">
                    9:16 Multi-Clips
                  </span>
                </h1>
                <p className="text-sm font-medium text-slate-700 leading-relaxed max-w-xl drop-shadow-[0_1px_1px_rgba(244,245,248,0.85)]">
                  Intelligent speech recognition, smart scene scoring, face-aware vertical framing, and automatic 9:16 multi-clip generation in one studio.
                </p>
                <div className="pt-1 flex flex-wrap gap-3">
                  <Magnet magnetStrength={5} padding={16}>
                    <Link
                      href="/projects/new"
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-orange-500 hover:from-brand-500 hover:to-orange-400 text-white font-semibold text-xs shadow-md shadow-brand-600/25 transition"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Create Multi-Clip Project
                    </Link>
                  </Magnet>
                  <Link
                    href="/projects"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-card/95 hover:bg-surface-card border border-surface-border text-slate-700 hover:text-slate-900 font-semibold text-xs shadow-sm backdrop-blur-sm transition"
                  >
                    <FolderKanban className="w-4 h-4 text-slate-500" />
                    Browse History
                  </Link>
                </div>
              </div>

              {/* 3-Step Creative Connected Workflow Rail */}
              <div
                onMouseLeave={() => setHoveredStep(null)}
                className="hidden lg:block relative w-[310px] shrink-0"
              >
                {/* Vertical Timeline Connector Line + Animated Energy Pulse */}
                <div className="absolute left-[18px] top-7 bottom-7 w-[2px] rounded-full bg-gradient-to-b from-orange-300 via-brand-400 to-emerald-400/80 opacity-65 overflow-hidden pointer-events-none">
                  <motion.div
                    animate={{ y: ['-100%', '220%'] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-full h-1/2 bg-gradient-to-b from-transparent via-brand-600 to-transparent"
                  />
                </div>

                <div className="space-y-3 relative z-10">
                  {[
                    {
                      num: '01',
                      tag: 'Input',
                      icon: UploadCloud,
                      title: 'Upload Source',
                      sub: 'MP4, MOV, MKV or YouTube Ref',
                      badge: 'bg-orange-50 text-orange-600 border-orange-200',
                      activeNode: 'from-orange-500 to-amber-500 shadow-orange-500/30',
                      tagStyle: 'bg-orange-50 text-orange-700 border-orange-200/80',
                      branchClass: 'w-2 bg-orange-300',
                    },
                    {
                      num: '02',
                      tag: 'AI Engine',
                      icon: Wand2,
                      title: 'AI Scene Ranking',
                      sub: 'Select 5, 10, 15 or 20 clips',
                      badge: 'bg-brand-50 text-brand-600 border-brand-200',
                      activeNode: 'from-brand-600 to-rose-500 shadow-brand-600/30',
                      tagStyle: 'bg-brand-50 text-brand-700 border-brand-200/80',
                      branchClass: 'w-4 bg-brand-400',
                    },
                    {
                      num: '03',
                      tag: '9:16 Ready',
                      icon: Smartphone,
                      title: 'Auto 9:16 Export',
                      sub: '1080×1920 MP4 + Subtitles',
                      badge: 'bg-emerald-50 text-emerald-600 border-emerald-200',
                      activeNode: 'from-emerald-500 to-teal-500 shadow-emerald-500/30',
                      tagStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
                      branchClass: 'w-6 bg-emerald-400',
                    },
                  ].map((step, idx) => {
                    const StepIcon = step.icon;
                    const isActive = activeStep === idx;

                    return (
                      <AnimatedContent key={step.num} delay={0.12 + idx * 0.08} distance={14}>
                        <div
                          onMouseEnter={() => setHoveredStep(idx)}
                          className="flex items-center transition-all duration-300"
                        >
                          {/* Step Node Circle on Connected Rail */}
                          <motion.div
                            animate={{ scale: isActive ? 1.08 : 0.96 }}
                            transition={{ type: 'spring', stiffness: 360, damping: 24 }}
                            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-mono text-[11px] font-extrabold border transition-all duration-300 ${
                              isActive
                                ? `bg-gradient-to-br ${step.activeNode} text-white border-transparent shadow-md`
                                : 'bg-surface-card text-slate-600 border-surface-border shadow-sm'
                            }`}
                          >
                            {step.num}
                          </motion.div>

                          {/* Stepped Horizontal Connector Arm */}
                          <div
                            className={`h-[2px] shrink-0 transition-opacity duration-300 ${step.branchClass} ${
                              isActive ? 'opacity-100' : 'opacity-45'
                            }`}
                          />

                          {/* Stepped Creative Glass Card */}
                          <SpotlightCard
                            className={`flex-1 min-w-0 rounded-2xl border backdrop-blur-md transition-all duration-300 ${
                              isActive
                                ? 'bg-surface-card/95 border-brand-300/90 shadow-glow -translate-y-0.5'
                                : 'bg-surface-card/80 border-surface-border shadow-sm hover:border-brand-200'
                            }`}
                          >
                            <div className="relative px-3.5 py-2.5 flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${step.badge}`}>
                                <StepIcon className="w-4 h-4" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1.5">
                                  <span className="text-xs font-bold text-slate-900 truncate">
                                    {step.title}
                                  </span>
                                  <span
                                    className={`text-[9px] px-1.5 py-0.5 rounded-md border font-semibold uppercase tracking-wide shrink-0 ${step.tagStyle}`}
                                  >
                                    {step.tag}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-500 truncate mt-0.5">
                                  {step.sub}
                                </div>
                              </div>
                            </div>
                          </SpotlightCard>
                        </div>
                      </AnimatedContent>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </StarBorder>
      </AnimatedContent>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatedContent delay={0.05} distance={16}>
          <SpotlightCard className="p-5 rounded-2xl studio-card studio-card-hover space-y-3 h-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Source Videos
              </span>
              <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center">
                <Film className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
              <CountUp to={videos.length} duration={0.85} />
            </div>
            <div className="text-[11px] text-slate-500">Uploaded media assets</div>
          </SpotlightCard>
        </AnimatedContent>

        <AnimatedContent delay={0.11} distance={16}>
          <SpotlightCard className="p-5 rounded-2xl studio-card studio-card-hover space-y-3 h-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Projects
              </span>
              <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
              <CountUp to={projects.length} duration={0.85} />
            </div>
            <div className="text-[11px] text-slate-500">
              {activeProjects.length > 0 ? `${activeProjects.length} processing live` : 'All pipelines idle'}
            </div>
          </SpotlightCard>
        </AnimatedContent>

        <AnimatedContent delay={0.17} distance={16}>
          <SpotlightCard className="p-5 rounded-2xl studio-card studio-card-hover space-y-3 h-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Generated Shorts
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                <Scissors className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
              <CountUp to={clipsCount} duration={0.95} />
            </div>
            <div className="text-[11px] text-slate-500">9:16 vertical MP4 exports</div>
          </SpotlightCard>
        </AnimatedContent>

        <AnimatedContent delay={0.23} distance={16}>
          <SpotlightCard className="p-5 rounded-2xl studio-card studio-card-hover space-y-3 h-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Ready to Publish
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
              <CountUp
                to={projects.filter((p) => p.status === 'completed' || p.status === 'ready' || p.status === 'ready_for_review').length}
                duration={0.85}
              />
            </div>
            <div className="text-[11px] text-slate-500">Projects ready for export</div>
          </SpotlightCard>
        </AnimatedContent>
      </div>

      {/* Active Processing Jobs */}
      {activeProjects.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-600 animate-pulse" />
            Active Processing Queue
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeProjects.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-2xl studio-card border-brand-200 space-y-3"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm truncate">{p.title}</h3>
                    <p className="text-xs text-slate-500 capitalize">Status: {p.status}</p>
                  </div>
                  <Link
                    href={`/projects/${p.id}`}
                    className="text-xs text-brand-700 hover:text-brand-600 font-semibold flex items-center gap-1 shrink-0"
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
      <AnimatedContent delay={0.26} distance={16} className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Recent Projects</h2>
            <p className="text-xs text-slate-500">Jump back into scene review, editing, and clip export</p>
          </div>
          <Link
            href="/projects"
            className="text-xs text-brand-700 hover:text-brand-600 font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-card hover:bg-surface-elevated border border-surface-border shadow-sm transition"
          >
            View All ({projects.length}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500 rounded-2xl studio-card">
            Loading workspace analytics...
          </div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center rounded-3xl studio-card space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center mx-auto">
              <UploadCloud className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">No clipping projects yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Upload a video file and select 10 or 15 clips to automatically build ready-to-post vertical shorts.
              </p>
            </div>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-orange-500 hover:from-brand-500 hover:to-orange-400 text-white font-semibold text-xs shadow-md shadow-brand-600/20 transition"
            >
              <PlusCircle className="w-4 h-4" />
              Create First Project
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl studio-card">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-elevated/80 border-b border-surface-border text-slate-600 uppercase tracking-wider font-bold text-[11px]">
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
              <tbody className="divide-y divide-surface-border/70">
                {projects.slice(0, 6).map((p) => (
                  <tr key={p.id} className="hover:bg-surface-cardHover transition">
                    <td className="py-3.5 px-5 font-semibold text-slate-900 max-w-xs truncate">
                      {p.title}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {p.settings?.number_of_highlights || 10} clips
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {p.settings?.clip_duration_seconds || 30}s
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[11px]">
                        {p.settings?.aspect_ratio || '9:16'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                          p.status === 'ready' || p.status === 'ready_for_review' || p.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : p.status === 'analyzing' || p.status === 'processing'
                            ? 'bg-brand-50 text-brand-700 border border-brand-200'
                            : p.status === 'failed'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {p.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Link
                        href={`/projects/${p.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold text-xs border border-brand-200 transition"
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
      </AnimatedContent>
    </div>
  );
}
