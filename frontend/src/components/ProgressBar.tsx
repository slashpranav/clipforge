import React from 'react';
import { Loader2 } from 'lucide-react';

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

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-center text-xs">
        <div className="flex items-center gap-2">
          {progress < 100 && <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" />}
          <span className="font-semibold text-slate-200 uppercase tracking-wide">
            {formatStage(stage)}
          </span>
          {message && <span className="text-surface-muted truncate max-w-xs">— {message}</span>}
        </div>
        <span className="font-mono font-medium text-brand-300">{Math.round(progress)}%</span>
      </div>

      <div className="w-full h-2 rounded-full bg-surface-card overflow-hidden border border-surface-border">
        <div
          className="h-full bg-gradient-to-r from-brand-600 to-indigo-500 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}
