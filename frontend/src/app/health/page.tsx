'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { HealthStatus, ReadinessStatus } from '@/lib/types';
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Database,
  Cpu,
  RefreshCw,
  Sliders,
  Server
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
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sliders className="w-6 h-6 text-brand-400" />
            System Health & Diagnostics
          </h1>
          <p className="text-xs text-surface-muted mt-1">
            Real-time status probes for FastAPI server, SQLite database, FFmpeg binaries, and faster-whisper.
          </p>
        </div>

        <button
          onClick={checkStatus}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-card hover:bg-surface-cardHover border border-surface-border text-slate-300 text-xs font-medium transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-400' : ''}`} />
          Refresh
        </button>
      </div>

      {error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            Backend Connection Failed
          </div>
          <p className="leading-relaxed">
            Could not reach the ClipForge backend at <code>http://127.0.0.1:8000/api/v1</code>. Ensure the FastAPI development server is running in the <code>backend/</code> folder:
          </p>
          <pre className="p-3 rounded-lg bg-black/50 text-[11px] font-mono text-slate-200 overflow-x-auto">
            cd backend&#10;.\.venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8000 --reload
          </pre>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Liveness Card */}
          <div className="p-6 rounded-2xl bg-surface-card border border-surface-border space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-surface-border">
              <span className="font-semibold text-white text-sm flex items-center gap-2">
                <Server className="w-4 h-4 text-brand-400" />
                FastAPI Liveness Probe
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {health?.status || 'Active'}
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-surface-muted">Application:</span>
                <span className="font-semibold text-white">{health?.app_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-muted">Environment:</span>
                <span className="font-mono text-white capitalize">{health?.environment}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-muted">Target Host:</span>
                <span className="font-mono text-white">127.0.0.1:8000</span>
              </div>
            </div>
          </div>

          {/* Database Card */}
          <div className="p-6 rounded-2xl bg-surface-card border border-surface-border space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-surface-border">
              <span className="font-semibold text-white text-sm flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                SQLite Persistence
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  readiness?.database_connected
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}
              >
                {readiness?.database_connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-surface-muted">Driver:</span>
                <span className="font-semibold text-white">SQLite 3 / SQLAlchemy 2.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-muted">Migrations:</span>
                <span className="text-white">Alembic (Initial Schema Applied)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-muted">Location:</span>
                <span className="font-mono text-white">storage/clipforge.db</span>
              </div>
            </div>
          </div>

          {/* FFmpeg Video Engine Card */}
          <div className="p-6 rounded-2xl bg-surface-card border border-surface-border space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-surface-border">
              <span className="font-semibold text-white text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                FFmpeg Processing Engine
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  readiness?.ffmpeg_available
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}
              >
                {readiness?.ffmpeg_available ? 'Ready' : 'Not Found'}
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-surface-muted">Binary Version:</span>
                <span className="font-mono text-white truncate max-w-xs">{readiness?.ffmpeg_version || '9.0.2'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-muted">Smart Cropping:</span>
                <span className="text-white">9:16 Vertical (1080×1920)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-muted">Subtitle Hardcoding:</span>
                <span className="text-white">Supported (ASS/SRT filter)</span>
              </div>
            </div>
          </div>

          {/* AI Whisper & CPU Card */}
          <div className="p-6 rounded-2xl bg-surface-card border border-surface-border space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-surface-border">
              <span className="font-semibold text-white text-sm flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-400" />
                AI Inference Engine
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
                CPU Mode
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-surface-muted">Model:</span>
                <span className="font-mono text-white">faster-whisper ({readiness?.whisper_configured_model || 'small'})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-muted">Quantization:</span>
                <span className="font-semibold text-white">int8 (low CPU overhead)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-muted">Memory Strategy:</span>
                <span className="text-white">Lazy loaded on-demand</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
