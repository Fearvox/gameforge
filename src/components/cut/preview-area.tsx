'use client';

import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { useCutStore } from '@/lib/cut-store';
import { useState } from 'react';

export default function PreviewArea() {
  const {
    currentTime, totalDuration, playing, setPlaying, setCurrentTime, aspectRatio,
  } = useCutStore();
  const [muted, setMuted] = useState(false);

  /* A4: aspect ratio → container proportions */
  const ratioMap: Record<string, string> = {
    '16:9': 'aspect-video',
    '9:16': 'aspect-[9/16]',
    '1:1': 'aspect-square',
    '4:3': 'aspect-[4/3]',
  };
  const ratioClass = ratioMap[aspectRatio] ?? 'aspect-video';

  return (
    <div className="flex flex-col bg-[#0b0c10]">
      {/* Preview viewport */}
      <div className="flex flex-1 items-center justify-center p-3">
        <div className={`relative w-full max-w-[640px] ${ratioClass} rounded-lg overflow-hidden bg-gaming-purple/6 border border-border`}>
          {/* Placeholder play icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Play className="h-12 w-12 text-muted-foreground/15" />
          </div>

          {/* AI marker indicator (purple line on left edge) */}
          <div className="absolute left-0 top-0 h-full w-1 rounded-full bg-gaming-purple/60" />

          {/* Timecode overlay */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-md bg-black/60 px-3 py-1">
            <span className="font-mono text-xs text-foreground/85">
              {formatTime(currentTime)} / {formatTime(totalDuration)}
            </span>
          </div>
        </div>
      </div>

      {/* Playback controls */}
      <div className="flex items-center justify-between border-t border-border px-4 py-2">
        {/* Timecode */}
        <span className="font-mono text-xs text-foreground/70 min-w-[120px]">
          {formatTimePrecise(currentTime)} / {formatTimePrecise(totalDuration)}
        </span>

        {/* Transport controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentTime(Math.max(0, currentTime - 10))}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="后退 10 秒"
          >
            <SkipBack className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPlaying(!playing)}
            className="flex h-8 w-8 items-center justify-center rounded-full gradient-gaming text-white transition-opacity hover:opacity-90"
            aria-label={playing ? '暂停' : '播放'}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </button>
          <button
            onClick={() => setCurrentTime(Math.min(totalDuration, currentTime + 10))}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="前进 10 秒"
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2 min-w-[120px] justify-end">
          <button
            onClick={() => setMuted(!muted)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <div className="w-16 h-1 rounded-full bg-muted relative">
            <div className="absolute h-full rounded-full bg-muted-foreground/30" style={{ width: muted ? '0%' : '80%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function formatTimePrecise(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 100);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
}
