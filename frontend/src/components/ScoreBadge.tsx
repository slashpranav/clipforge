import React, { useState } from 'react';
import { ScoreBreakdown } from '@/lib/types';
import { Info, Sparkles } from 'lucide-react';

interface ScoreBadgeProps {
  score: number;
  breakdown?: ScoreBreakdown;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreBadge({ score, breakdown, size = 'md' }: ScoreBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Determine color scheme based on score range
  const getColors = () => {
    if (score >= 80) {
      return {
        bg: 'bg-emerald-500/15',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        label: 'Exceptional Hook',
      };
    } else if (score >= 60) {
      return {
        bg: 'bg-amber-500/15',
        border: 'border-amber-500/30',
        text: 'text-amber-400',
        label: 'Strong Moment',
      };
    } else {
      return {
        bg: 'bg-blue-500/15',
        border: 'border-blue-500/30',
        text: 'text-blue-400',
        label: 'Standard Scene',
      };
    }
  };

  const colors = getColors();

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3.5 py-1.5 font-bold',
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`flex items-center gap-1.5 rounded-md font-semibold border ${colors.bg} ${colors.border} ${colors.text} ${sizeClasses[size]} cursor-help transition`}
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>{Math.round(score)}</span>
        <span className="text-[10px] opacity-75 font-normal">/ 100</span>
      </div>

      {showTooltip && breakdown && (
        <div className="absolute z-30 bottom-full left-0 mb-2 w-64 p-3 rounded-xl bg-surface-card border border-surface-border shadow-2xl backdrop-blur-md text-xs space-y-2 pointer-events-none">
          <div className="font-semibold text-slate-200 flex items-center justify-between pb-1 border-b border-surface-border">
            <span>Score Factors</span>
            <span className={colors.text}>{colors.label}</span>
          </div>
          <div className="space-y-1.5 text-slate-400">
            <div className="flex justify-between items-center">
              <span>Hook Curiosity (25%)</span>
              <span className="font-mono text-slate-200">{Math.round(breakdown.hook_curiosity)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Speech & Dialogue (20%)</span>
              <span className="font-mono text-slate-200">{Math.round(breakdown.speech_audio_activity)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Lexical Density (20%)</span>
              <span className="font-mono text-slate-200">{Math.round(breakdown.semantic_informativeness)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Context Completeness (15%)</span>
              <span className="font-mono text-slate-200">{Math.round(breakdown.context_completeness)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Visual Framing (10%)</span>
              <span className="font-mono text-slate-200">{Math.round(breakdown.visual_framing_quality)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Scene Transitions (10%)</span>
              <span className="font-mono text-slate-200">{Math.round(breakdown.scene_change_context)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
