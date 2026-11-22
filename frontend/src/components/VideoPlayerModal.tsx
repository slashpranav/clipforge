'use client';

import React from 'react';
import { Clip } from '@/lib/types';
import { api } from '@/lib/api';
import { X, Download, FileText, Languages, Mic, Sparkles } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-surface border border-surface-border rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Video Player Column (9:16 vertical aspect) */}
        <div className="w-full md:w-1/2 bg-black flex items-center justify-center p-4 min-h-[420px]">
          <div className="relative w-full max-w-[280px] aspect-[9/16] bg-slate-950 rounded-xl overflow-hidden border border-surface-border/60 shadow-xl flex items-center justify-center">
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

        {/* Clip Details & Export Tools */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto space-y-6">
          <div className="space-y-4">
            <div>
              <div className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold uppercase bg-brand-500/20 text-brand-300 mb-2">
                9:16 Shorts Export
              </div>
              <h3 className="text-xl font-bold text-white leading-snug">
                Rendered Clip ({Math.round(clip.duration_seconds)}s)
              </h3>
              <p className="text-xs text-surface-muted mt-1">
                Resolution: {clip.width} × {clip.height} @ {clip.fps} FPS
              </p>
            </div>

            {/* Subtitle language & status info */}
            <div className="p-3.5 rounded-xl bg-surface-card border border-surface-border space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span>Subtitles:</span>
                <span className="font-semibold text-brand-400 capitalize">
                  {clip.subtitle_language || 'Original'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Status:</span>
                <span className="font-semibold text-emerald-400 capitalize">
                  {clip.status}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Download Assets
              </div>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={downloadUrl}
                  download={`short_${clip.id}.mp4`}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs shadow-md transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  MP4 Video
                </a>
                <a
                  href={srtUrl}
                  download={`subtitles_${clip.id}.srt`}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-surface-card hover:bg-surface-cardHover border border-surface-border text-slate-200 font-medium text-xs transition"
                >
                  <FileText className="w-3.5 h-3.5 text-brand-400" />
                  SRT Subtitles
                </a>
              </div>
            </div>

            {/* Hindi Voice-Over Studio Action */}
            <div className="pt-2">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Voice & Translation
              </div>
              <button
                onClick={() => onVoiceRequest && onVoiceRequest(clip.id)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-medium text-xs transition"
              >
                <Mic className="w-3.5 h-3.5 text-indigo-400" />
                Generate Hindi Voice-Over
              </button>
            </div>
          </div>

          <div className="text-[11px] text-surface-muted text-center border-t border-surface-border pt-4">
            Aspect ratio 9:16 optimized for YouTube Shorts, Instagram Reels, and TikTok.
          </div>
        </div>
      </div>
    </div>
  );
}
