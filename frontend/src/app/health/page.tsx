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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Sliders className="w-6 h-6 text-brand-600" />
            System Health & Telemetry
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Internal service checks for FastAPI, SQLite persistence, FFmpeg binary, and Whisper inference.
          </p>
        </div>

        <button
          onClick={checkStatus}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-card hover:bg-surface-elevated border border-surface-border text-slate-700 text-xs font-semibold shadow-sm transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-600' : ''}`} />
          Re-run Probes
        </button>
      </div>

      {error ? (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            Service Unreachable
          </div>
          <p className="leading-relaxed">
            Unable to connect to <code>http://127.0.0.1:8000/api/v1</code>. Start the FastAPI server from <code>backend/</code>:
          </p>
          <pre className="p-3.5 rounded-xl bg-slate-900 text-[11px] font-mono text-slate-100 overflow-x-auto">
            cd backend&#10;.\.venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8000 --reload
          </pre>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl studio-card space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-sm flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600">
                  <Server className="w-4 h-4" />
                </div>
                FastAPI Service
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                {health?.status || 'Healthy'}
              </span>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Application</span>
                <span className="font-semibold text-slate-900">{health?.app_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Environment</span>
                <span className="font-mono text-slate-800 capitalize">{health?.environment}</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl studio-card space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-sm flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                  <Database className="w-4 h-4" />
                </div>
                SQLite Database
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  readiness?.database_connected
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {readiness?.database_connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">ORM Layer</span>
                <span className="font-semibold text-slate-900">SQLAlchemy 2.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Store Path</span>
                <span className="font-mono text-slate-800">storage/clipforge.db</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl studio-card space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-sm flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <Activity className="w-4 h-4" />
                </div>
                FFmpeg Video Engine
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  readiness?.ffmpeg_available
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {readiness?.ffmpeg_available ? 'Ready' : 'Not Found'}
              </span>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500 shrink-0">Binary</span>
                <span className="font-mono text-slate-800 truncate">{readiness?.ffmpeg_version || '9.0.2'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Output Format</span>
                <span className="text-slate-800">9:16 Vertical (1080×1920 MP4)</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl studio-card space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-sm flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <Cpu className="w-4 h-4" />
                </div>
                AI Inference Runtime
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                CPU Mode
              </span>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Speech Model</span>
                <span className="font-mono text-slate-900">
                  faster-whisper ({readiness?.whisper_configured_model || 'base'})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Precision</span>
                <span className="font-semibold text-slate-800">int8 CPU Quantized</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
