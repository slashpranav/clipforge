import React from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface ProgressBarProps {
  progress: number;
  stage?: string;
  message?: string;
}

export function ProgressBar({ progress, stage, message }: ProgressBarProps) {
  const formatStage = (s?: string) => {
    if (!s) return 'Processing';
    return s.replace(/_/g, ' ');
  };

  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div className="w-full space-y-2.5">
      <div className="flex justify-between items-center text-xs gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {clamped < 100 ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          )}
          <span className="font-semibold text-white uppercase tracking-wider text-[11px] shrink-0">
            {formatStage(stage)}
          </span>
          {message && (
            <span className="text-slate-400 truncate">{message}</span>
          )}
        </div>
        <span className="font-mono font-semibold text-brand-300 tabular-nums shrink-0">
          {Math.round(clamped)}%
        </span>
      </div>

      <div className="relative w-full h-2.5 rounded-full bg-white/[0.06] overflow-hidden border border-white/[0.08]">
        <div
          className="relative h-full bg-gradient-to-r from-brand-600 via-indigo-500 to-cyan-400 rounded-full transition-all duration-500 ease-out overflow-hidden"
          style={{ width: `${clamped}%` }}
        >
          {clamped < 100 && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer" />
          )}
        </div>
      </div>
    </div>
  );
}
