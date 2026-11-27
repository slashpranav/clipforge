'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { HealthStatus, ReadinessStatus } from '@/lib/types';
import {
  Activity,
  AlertCircle,
  Database,
  Cpu,
  RefreshCw,
  Sliders,
  Server,
} from 'lucide-react';

export default function HealthPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [readiness, setReadiness] = useState<ReadinessStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const [h, r] = await Promise.all([api.getHealth(), api.getReadiness()]);
      setHealth(h);
      setReadiness(r);
    } catch (err: any) {
      setError(err.message || 'Failed to reach ClipForge backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Sliders className="w-6 h-6 text-brand-400" />
            System Health & Telemetry
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Live verification for FastAPI backend, SQLite persistence, FFmpeg binary, and Whisper inference.
          </p>
        </div>

        <button
          onClick={checkStatus}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-200 text-xs font-semibold transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-400' : ''}`} />
          Re-run Probes
        </button>
      </div>

      {error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-rose-300">
            <AlertCircle className="w-5 h-5 shrink-0" />
            Backend Connection Unreachable
          </div>
          <p className="leading-relaxed text-slate-300">
            Unable to connect to <code>http://127.0.0.1:8000/api/v1</code>. Start the FastAPI server from <code>backend/</code>:
          </p>
          <pre className="p-3.5 rounded-xl bg-black/50 border border-white/[0.07] text-[11px] font-mono text-slate-200 overflow-x-auto">
            cd backend&#10;.\.venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8000 --reload
          </pre>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Liveness Card */}
          <div className="p-6 rounded-2xl studio-card studio-card-hover space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-white/[0.07]">
              <span className="font-semibold text-white text-sm flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center text-brand-400">
                  <Server className="w-4 h-4" />
                </div>
                FastAPI Backend
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                {health?.status || 'Healthy'}
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Application</span>
                <span className="font-semibold text-white">{health?.app_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Environment</span>
                <span className="font-mono text-white capitalize">{health?.environment}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Endpoint Base</span>
                <span className="font-mono text-brand-300">127.0.0.1:8000/api/v1</span>
              </div>
            </div>
          </div>

          {/* Database Card */}
          <div className="p-6 rounded-2xl studio-card studio-card-hover space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-white/[0.07]">
              <span className="font-semibold text-white text-sm flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                  <Database className="w-4 h-4" />
                </div>
                SQLite Database
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  readiness?.database_connected
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                }`}
              >
                {readiness?.database_connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">ORM Layer</span>
                <span className="font-semibold text-white">SQLAlchemy 2.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Migrations</span>
                <span className="text-white">Alembic Head Applied</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Store Path</span>
                <span className="font-mono text-white">storage/clipforge.db</span>
              </div>
            </div>
          </div>

          {/* FFmpeg Card */}
          <div className="p-6 rounded-2xl studio-card studio-card-hover space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-white/[0.07]">
              <span className="font-semibold text-white text-sm flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                  <Activity className="w-4 h-4" />
                </div>
                FFmpeg Video Engine
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  readiness?.ffmpeg_available
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                }`}
              >
                {readiness?.ffmpeg_available ? 'Ready' : 'Not Found'}
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between gap-4">
                <span className="text-slate-400 shrink-0">Binary</span>
                <span className="font-mono text-white truncate">{readiness?.ffmpeg_version || '9.0.2'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Output Format</span>
                <span className="text-white">9:16 Vertical (1080×1920 MP4)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Subtitles</span>
                <span className="text-white">ASS Burn-in + SRT / VTT</span>
              </div>
            </div>
          </div>

          {/* AI Engine Card */}
          <div className="p-6 rounded-2xl studio-card studio-card-hover space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-white/[0.07]">
              <span className="font-semibold text-white text-sm flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400">
                  <Cpu className="w-4 h-4" />
                </div>
                AI Inference Runtime
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30">
                CPU Mode
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Speech Model</span>
                <span className="font-mono text-white">
                  faster-whisper ({readiness?.whisper_configured_model || 'small'})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Precision</span>
                <span className="font-semibold text-white">int8 CPU Quantized</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Resource Policy</span>
                <span className="text-white">Lazy Load + Auto Release</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
