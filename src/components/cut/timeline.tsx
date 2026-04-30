'use client';

import { ZoomIn, ZoomOut, Magnet, Scissors, Trash2, Lock } from 'lucide-react';
import { useCutStore, type Track, type Clip } from '@/lib/cut-store';

/* ── Timeline Toolbar ── */

function TimelineToolbar() {
  const { zoom, setZoom, snapEnabled, toggleSnap, selectedClipId, removeClip, splitClip, currentTime } = useCutStore();

  return (
    <div className="flex items-center gap-2 border-b border-border px-3 py-1.5">
      <span className="text-[11px] font-semibold text-foreground">时间线</span>

      {/* Zoom */}
      <div className="ml-auto flex items-center gap-1">
        <button
          onClick={() => setZoom(zoom - 10)}
          className="rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <span className="w-8 text-center text-[10px] text-muted-foreground">{zoom}%</span>
        <button
          onClick={() => setZoom(zoom + 10)}
          className="rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Snap toggle */}
      <button
        onClick={toggleSnap}
        className={`flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium transition-colors ${
          snapEnabled ? 'bg-gaming-blue/10 text-gaming-blue' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Magnet className="h-3 w-3" />
        吸附
      </button>

      {/* Split */}
      <button
        onClick={() => selectedClipId && splitClip(selectedClipId, currentTime)}
        disabled={!selectedClipId}
        className="flex items-center gap-1 rounded px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
      >
        <Scissors className="h-3 w-3" />
        分割
      </button>

      {/* Delete */}
      <button
        onClick={() => selectedClipId && removeClip(selectedClipId)}
        disabled={!selectedClipId}
        className="flex items-center gap-1 rounded px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
      >
        <Trash2 className="h-3 w-3" />
        删除
      </button>
    </div>
  );
}

/* ── Time Ruler ── */

function TimeRuler({ duration, zoom }: { duration: number; zoom: number }) {
  const pixelsPerSecond = (zoom / 100) * 2;
  const totalWidth = duration * pixelsPerSecond;
  const interval = duration > 600 ? 120 : duration > 300 ? 60 : 30;

  const marks: number[] = [];
  for (let t = 0; t <= duration; t += interval) marks.push(t);

  return (
    <div className="relative h-6 border-b border-border overflow-hidden" style={{ minWidth: totalWidth }}>
      {marks.map((t) => (
        <div
          key={t}
          className="absolute top-0 flex flex-col items-center"
          style={{ left: t * pixelsPerSecond }}
        >
          <span className="text-[8px] font-mono text-muted-foreground/40">{formatTime(t)}</span>
          <div className="h-1 w-px bg-muted-foreground/15" />
        </div>
      ))}
    </div>
  );
}

/* ── Playhead ── */

function Playhead({ currentTime, zoom }: { currentTime: number; zoom: number }) {
  const pixelsPerSecond = (zoom / 100) * 2;
  const left = currentTime * pixelsPerSecond;

  return (
    <div className="absolute top-0 z-20" style={{ left }}>
      {/* Triangle handle */}
      <div className="h-2 w-3 -translate-x-1.5 bg-gaming-error" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
      {/* Red line */}
      <div className="w-px bg-gaming-error/80" style={{ height: '100%', position: 'absolute', top: 8 }} />
    </div>
  );
}

/* ── Clip Block ── */

function ClipBlock({ clip, zoom }: { clip: Clip; zoom: number }) {
  const { selectedClipId, setSelectedClip } = useCutStore();
  const pixelsPerSecond = (zoom / 100) * 2;
  const isSelected = selectedClipId === clip.id;

  const colorMap: Record<string, string> = {
    video: 'border-gaming-purple/30 bg-gaming-purple/12',
    broll: 'border-gaming-blue/20 bg-gaming-blue/10',
    audio: clip.name.includes('BGM')
      ? 'border-gaming-cyan/20 bg-gaming-cyan/8'
      : 'border-gaming-success/20 bg-gaming-success/8',
    subtitle: 'border-white/10 bg-white/6',
  };

  const trackType = clip.trackId.includes('video') ? 'video'
    : clip.trackId.includes('broll') ? 'broll'
    : clip.trackId.includes('audio') ? 'audio'
    : 'subtitle';

  return (
    <div
      onClick={(e) => { e.stopPropagation(); setSelectedClip(clip.id); }}
      className={`absolute top-0.5 bottom-0.5 rounded cursor-pointer border transition-all ${
        colorMap[trackType]
      } ${isSelected ? 'ring-1 ring-gaming-blue ring-offset-1 ring-offset-[#0c0d12]' : ''}`}
      style={{
        left: clip.start * pixelsPerSecond,
        width: Math.max(clip.duration * pixelsPerSecond, 40),
      }}
    >
      <div className="flex h-full flex-col justify-between overflow-hidden px-1.5 py-0.5">
        <p className="truncate text-[9px] font-medium text-foreground/80">
          {clip.locked ? '🔒 ' : ''}{clip.name}
        </p>
        <p className="truncate text-[8px] text-muted-foreground">
          {formatTime(clip.start)} - {formatTime(clip.start + clip.duration)}
        </p>
      </div>

      {/* AI marker indicators on video clips */}
      {trackType === 'video' && clip.markerIds?.map((markerId) => {
        const markers = useCutStore.getState().markers;
        const marker = markers.find((m) => m.id === markerId);
        if (!marker) return null;
        const markerLeft = (marker.adjustedStart ?? marker.start) - clip.start;
        if (markerLeft < 0 || markerLeft > clip.duration) return null;
        return (
          <div
            key={markerId}
            className="absolute top-0 h-full w-0.5 bg-gaming-purple/60"
            style={{ left: markerLeft * pixelsPerSecond }}
          />
        );
      })}
    </div>
  );
}

/* ── Track Row ── */

function TrackRow({ track, zoom }: { track: Track; zoom: number }) {
  const pixelsPerSecond = (zoom / 100) * 2;
  const { tracks } = useCutStore();
  const maxDuration = Math.max(
    ...tracks.flatMap((t) => t.clips.map((c) => c.start + c.duration)),
    600,
  );
  const trackWidth = maxDuration * pixelsPerSecond;

  const iconMap: Record<string, string> = {
    video: '🎬',
    broll: '🖼',
    audio: '🎵',
    subtitle: '💬',
  };

  return (
    <div className="flex border-b border-border/50">
      {/* Track label gutter */}
      <div className="flex w-16 shrink-0 items-center gap-1 border-r border-border bg-muted/20 px-2 py-1">
        <span className="text-[10px]">{iconMap[track.type]}</span>
        <span className="truncate text-[9px] text-muted-foreground">{track.name}</span>
        {track.locked && <Lock className="h-2.5 w-2.5 text-muted-foreground/40" />}
      </div>

      {/* Clip area */}
      <div
        className="relative h-12 overflow-hidden"
        style={{ minWidth: trackWidth }}
      >
        {track.clips.map((clip) => (
          <ClipBlock key={clip.id} clip={clip} zoom={zoom} />
        ))}
      </div>
    </div>
  );
}

/* ── Main Timeline ── */

export default function Timeline() {
  const { tracks, zoom, currentTime, totalDuration, setCurrentTime } = useCutStore();

  const pixelsPerSecond = (zoom / 100) * 2;
  const maxDuration = Math.max(
    ...tracks.flatMap((t) => t.clips.map((c) => c.start + c.duration)),
    totalDuration,
  );
  const contentWidth = maxDuration * pixelsPerSecond;

  /* Click on ruler area to seek */
  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + e.currentTarget.scrollLeft;
    const time = x / pixelsPerSecond;
    setCurrentTime(Math.max(0, Math.min(maxDuration, time)));
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden border-t border-border bg-[#0c0d12]">
      <TimelineToolbar />

      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="relative" style={{ minWidth: contentWidth + 64 }}>
          {/* Ruler */}
          <div onClick={handleSeek} className="cursor-pointer">
            <TimeRuler duration={maxDuration} zoom={zoom} />
          </div>

          {/* Playhead */}
          <Playhead currentTime={currentTime} zoom={zoom} />

          {/* Tracks */}
          {tracks.map((track) => (
            <TrackRow key={track.id} track={track} zoom={zoom} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── helpers ── */

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
