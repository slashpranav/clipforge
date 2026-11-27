import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        bar: 'bg-emerald-500',
        label: 'High Potential',
      };
    } else if (score >= 50) {
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        bar: 'bg-amber-500',
        label: 'Strong Scene',
      };
    } else {
      return {
        bg: 'bg-brand-50',
        border: 'border-brand-200',
        text: 'text-brand-700',
        bar: 'bg-brand-500',
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

      <AnimatePresence>
        {showTooltip && breakdown && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute z-40 bottom-full right-0 mb-2 w-72 p-4 rounded-2xl glass-panel shadow-xl text-xs space-y-3 pointer-events-none"
          >
            <div className="font-semibold text-slate-900 flex items-center justify-between pb-2 border-b border-slate-200">
              <span>Heuristic Score Breakdown</span>
              <span className={`text-[11px] font-semibold ${colors.text}`}>{colors.label}</span>
            </div>
            <div className="space-y-2.5">
              {factors.map((f, idx) => {
                const pct = Math.min(100, Math.round((f.val / f.max) * 100));
                return (
                  <div key={f.label} className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-600">{f.label}</span>
                      <span className="font-mono text-slate-900 font-semibold tabular-nums">
                        {f.val.toFixed(1)} <span className="text-slate-400 font-normal">/ {f.max}</span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-elevated overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.45, delay: idx * 0.04, ease: [0.22, 1, 0.36, 1] }}
                        className={`h-full rounded-full ${colors.bar}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
