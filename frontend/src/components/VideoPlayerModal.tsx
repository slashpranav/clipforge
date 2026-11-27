'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Clip } from '@/lib/types';
import { api } from '@/lib/api';
import { X, Download, FileText, Mic, MonitorPlay, Captions, CheckCircle2 } from 'lucide-react';
import { Magnet } from '@/components/reactbits';

interface VideoPlayerModalProps {
  clip: Clip | null;
  onClose: () => void;
  onVoiceRequest?: (clipId: string) => void;
}

export function VideoPlayerModal({ clip, onClose, onVoiceRequest }: VideoPlayerModalProps) {
  if (!clip) return null;

  const downloadUrl = api.getClipDownloadUrl(clip.id);
  const srtUrl = api.getClipSubtitlesUrl(clip.id, 'srt');
  const vttUrl = api.getClipSubtitlesUrl(clip.id, 'vtt');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-surface-card border border-surface-border rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[92vh]"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-surface-elevated hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-surface-border transition"
          aria-label="Close Preview"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left: Vertical 9:16 Phone Mockup Player */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-brand-50 via-orange-50/75 to-surface-elevated flex items-center justify-center p-6 md:p-8 border-b md:border-b-0 md:border-r border-surface-border">
          <div className="relative w-full max-w-[270px] aspect-[9/16] bg-slate-950 rounded-[2rem] p-1.5 ring-1 ring-slate-900/15 shadow-[0_20px_50px_-15px_rgba(225,29,72,0.28)]">
            <div className="w-full h-full rounded-[1.6rem] overflow-hidden bg-black relative">
              <video
                src={downloadUrl}
                controls
                autoPlay
                loop
                playsInline
                className="w-full h-full object-cover"
              >
                <track kind="captions" src={vttUrl} srcLang="hi" label="Subtitles" default />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>

        {/* Right: Clip Metadata & Export Controls */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto space-y-6 bg-surface-card">
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-700 border border-brand-200 mb-3">
                <MonitorPlay className="w-3 h-3" />
                9:16 Vertical Master
              </div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Short Clip Preview ({Math.round(clip.duration_seconds)}s)
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                ID: {clip.id}
              </p>
            </div>

            {/* Technical Specs Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-surface-elevated/80 border border-surface-border">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Resolution</div>
                <div className="font-mono font-semibold text-slate-900 mt-1">
                  {clip.width} × {clip.height}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-surface-elevated/80 border border-surface-border">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Frame Rate</div>
                <div className="font-mono font-semibold text-slate-900 mt-1">{clip.fps} FPS</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-surface-elevated/80 border border-surface-border">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Subtitles</div>
                <div className="font-semibold text-brand-700 mt-1 capitalize">
                  {clip.subtitle_language || 'Auto'}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-surface-elevated/80 border border-surface-border">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Render Status</div>
                <div className="font-semibold text-emerald-600 mt-1 flex items-center gap-1 capitalize">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {clip.status}
                </div>
              </div>
            </div>

            {/* Export Actions */}
            <div className="space-y-3">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Export & Subtitles
              </div>
              <Magnet magnetStrength={5} padding={16} className="w-full">
                <a
                  href={downloadUrl}
                  download={`short_${clip.id}.mp4`}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-orange-500 hover:from-brand-500 hover:to-orange-400 text-white font-semibold text-xs shadow-md shadow-brand-600/20 transition"
                >
                  <Download className="w-4 h-4" />
                  Download 1080×1920 MP4 Short
                </a>
              </Magnet>

              <div className="grid grid-cols-2 gap-2.5">
                <a
                  href={srtUrl}
                  download={`subtitles_${clip.id}.srt`}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-surface-elevated hover:bg-slate-200/70 border border-surface-border text-slate-700 font-semibold text-xs transition"
                >
                  <FileText className="w-3.5 h-3.5 text-brand-600" />
                  Download .SRT
                </a>
                <a
                  href={vttUrl}
                  download={`subtitles_${clip.id}.vtt`}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-surface-elevated hover:bg-slate-200/70 border border-surface-border text-slate-700 font-semibold text-xs transition"
                >
                  <Captions className="w-3.5 h-3.5 text-orange-600" />
                  Download .VTT
                </a>
              </div>
            </div>

            {/* Voice-Over Studio Trigger */}
            {onVoiceRequest && (
              <div className="space-y-2.5 pt-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Audio Enhancement
                </div>
                <button
                  onClick={() => onVoiceRequest(clip.id)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-50 hover:bg-brand-100 border border-brand-200 text-brand-700 font-semibold text-xs transition"
                >
                  <Mic className="w-4 h-4 text-brand-600" />
                  Synthesize Expressive Hindi Voice-Over
                </button>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-400 text-center border-t border-slate-100 pt-4">
            Formatted for YouTube Shorts, Instagram Reels & TikTok safe zones.
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
