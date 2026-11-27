import React, { useState } from 'react';
import { ScoreBreakdown } from '@/lib/types';
import { Sparkles } from 'lucide-react';

interface ScoreBadgeProps {
  score: number;
  breakdown?: ScoreBreakdown;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreBadge({ score, breakdown, size = 'md' }: ScoreBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const getColors = () => {
    if (score >= 75) {
      return {
        bg: 'bg-emerald-500/15',
        border: 'border-emerald-500/30',
        text: 'text-emerald-300',
        bar: 'bg-emerald-400',
        label: 'High Potential',
      };
    } else if (score >= 50) {
      return {
        bg: 'bg-amber-500/15',
        border: 'border-amber-500/30',
        text: 'text-amber-300',
        bar: 'bg-amber-400',
        label: 'Strong Scene',
      };
    } else {
      return {
        bg: 'bg-sky-500/15',
        border: 'border-sky-500/30',
        text: 'text-sky-300',
        bar: 'bg-sky-400',
        label: 'Good Moment',
      };
    }
  };

  const colors = getColors();

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1',
    md: 'text-xs px-3 py-1.5',
    lg: 'text-sm px-3.5 py-2 font-bold',
  };

  const factors = breakdown
    ? [
        { label: 'Hook Curiosity', max: 25, val: breakdown.hook_curiosity },
        { label: 'Lexical Density', max: 25, val: breakdown.semantic_informativeness },
        { label: 'Context Integrity', max: 20, val: breakdown.context_completeness },
        { label: 'Speech & Audio', max: 15, val: breakdown.speech_audio_activity },
        { label: 'Visual Framing', max: 10, val: breakdown.visual_framing_quality },
        { label: 'Scene Transitions', max: 5, val: breakdown.scene_change_context },
      ]
    : [];

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`flex items-center gap-1.5 rounded-xl font-semibold border ${colors.bg} ${colors.border} ${colors.text} ${sizeClasses[size]} cursor-help transition shadow-sm`}
      >
        <Sparkles className="w-3.5 h-3.5 shrink-0" />
        <span className="tabular-nums font-bold">{Math.round(score)}</span>
        <span className="text-[10px] opacity-70 font-normal">/ 100</span>
      </div>

      {showTooltip && breakdown && (
        <div className="absolute z-40 bottom-full right-0 mb-2 w-72 p-4 rounded-2xl glass-panel shadow-2xl text-xs space-y-3 pointer-events-none">
          <div className="font-semibold text-white flex items-center justify-between pb-2 border-b border-white/[0.08]">
            <span>Heuristic Score Breakdown</span>
            <span className={`text-[11px] font-semibold ${colors.text}`}>{colors.label}</span>
          </div>
          <div className="space-y-2.5">
            {factors.map((f) => {
              const pct = Math.min(100, Math.round((f.val / f.max) * 100));
              return (
                <div key={f.label} className="space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-300">{f.label}</span>
                    <span className="font-mono text-slate-200 tabular-nums">
                      {f.val.toFixed(1)} <span className="text-slate-500">/ {f.max}</span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colors.bar}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
