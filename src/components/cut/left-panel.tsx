'use client';

import { Loader2, AlertTriangle, Play, Music, Image as ImageIcon } from 'lucide-react';
import { useCutStore, type AIMarker } from '@/lib/cut-store';

/* ── AI Highlight Card ── */

function HighlightCard({ marker }: { marker: AIMarker }) {
  const { acceptMarker, ignoreMarker } = useCutStore();

  if (marker.ignored) return null;

  const start = marker.adjustedStart ?? marker.start;
  const end = marker.adjustedEnd ?? marker.end;

  return (
    <div
      className={`rounded-lg border p-2 transition-colors ${
        marker.accepted
          ? 'border-gaming-success/30 bg-gaming-success/8'
          : 'border-gaming-purple/20 bg-gaming-purple/6'
      }`}
    >
      <div className="flex gap-2">
        {/* Thumbnail placeholder */}
        <div className="flex h-9 w-14 shrink-0 items-center justify-center rounded bg-gaming-purple/15">
          <Play className="h-3 w-3 text-muted-foreground/40" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium text-foreground">{marker.name}</p>
          <p className="text-[10px] text-muted-foreground">
            {formatTime(start)} - {formatTime(end)} · 置信度 {marker.confidence}%
          </p>
          {marker.accepted ? (
            <span className="text-[10px] text-gaming-success">已加入时间线</span>
          ) : (
            <div className="mt-0.5 flex gap-2">
              <button
                onClick={() => acceptMarker(marker.id)}
                className="text-[10px] font-medium text-gaming-purple hover:underline"
              >
                + 加入时间线
              </button>
              <button
                onClick={() => ignoreMarker(marker.id)}
                className="text-[10px] text-muted-foreground hover:text-foreground"
              >
                忽略
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── B1: AI Error Banner ── */

function AIErrorBanner() {
  const { aiError, triggerAIAnalysis } = useCutStore();
  if (!aiError) return null;

  return (
    <div className="mb-2 rounded-lg border border-gaming-error/30 bg-gaming-error/10 p-2">
      <div className="flex items-start gap-1.5">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gaming-error" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium text-gaming-error">{aiError}</p>
          <div className="mt-1 flex gap-2">
            <button
              onClick={triggerAIAnalysis}
              className="text-[10px] font-medium text-gaming-error hover:underline"
            >
              重新分析
            </button>
            <button className="text-[10px] text-muted-foreground hover:text-foreground">
              手动添加
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── A1: Media Library — reads from /assets store ── */

import { useAssetsStore, type Asset } from '@/lib/assets-store';

function MediaItem({ asset }: { asset: Asset }) {
  const { addClipToTrack } = useCutStore();

  const iconMap = {
    video: <Play className="h-3 w-3 text-muted-foreground/30" />,
    audio: <Music className="h-3 w-3 text-muted-foreground/30" />,
    image: <ImageIcon className="h-3 w-3 text-muted-foreground/30" />,
    unknown: <Play className="h-3 w-3 text-muted-foreground/30" />,
  };
  const bgMap = {
    video: 'bg-gaming-purple/10',
    audio: 'bg-gaming-cyan/10',
    image: 'bg-gaming-warning/10',
    unknown: 'bg-muted/30',
  };

  const durationLabel = asset.duration
    ? `${Math.floor(asset.duration / 60)}:${String(Math.floor(asset.duration % 60)).padStart(2, '0')}`
    : asset.resolution ?? '';

  const sizeLabel = asset.size > 1_073_741_824
    ? `${(asset.size / 1_073_741_824).toFixed(1)} GB`
    : asset.size > 1_048_576
    ? `${(asset.size / 1_048_576).toFixed(1)} MB`
    : `${asset.size} B`;

  /** A1: Import asset → add clip to appropriate track */
  function handleImport() {
    const trackMap: Record<string, string> = {
      video: 'track-video',
      image: 'track-broll',
      audio: 'track-audio',
    };
    const trackId = trackMap[asset.type] ?? 'track-video';
    const now = Date.now();
    addClipToTrack(trackId, {
      id: `c-${now}-${Math.random().toString(36).slice(2, 6)}`,
      trackId,
      name: asset.name,
      start: 0,
      duration: asset.duration ?? 10,
      inPoint: 0,
      outPoint: asset.duration ?? 10,
      volume: 100,
      opacity: 100,
      speed: 1,
      assetId: asset.id,
    });
  }

  return (
    <div
      onClick={handleImport}
      className="flex items-center gap-2 rounded-md bg-background/30 px-2 py-1.5 hover:bg-accent transition-colors cursor-pointer"
      title={`点击导入 ${asset.name}`}
    >
      <div className={`flex h-8 w-11 shrink-0 items-center justify-center rounded ${bgMap[asset.type]}`}>
        {iconMap[asset.type]}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] font-medium text-foreground">{asset.name}</p>
        <p className="text-[9px] text-muted-foreground">{sizeLabel} · {durationLabel}</p>
      </div>
    </div>
  );
}

/* ── Main Left Panel ── */

export default function LeftPanel() {
  const {
    leftPanelTab, setLeftPanelTab,
    markers, aiAnalyzing, triggerAIAnalysis,
    mediaFilter, setMediaFilter,
  } = useCutStore();

  /* A1: Get assets from /assets store */
  const assets = useAssetsStore((s) => s.assets);
  const allMedia = assets.filter((a) => a.type !== 'unknown');
  /* A7: Filter media by search query */
  const mediaItems = mediaFilter
    ? allMedia.filter((a) => a.name.toLowerCase().includes(mediaFilter.toLowerCase()))
    : allMedia;

  const visibleMarkers = markers.filter((m) => !m.ignored);
  const activeCount = visibleMarkers.filter((m) => !m.accepted).length;

  return (
    <div className="flex h-full flex-col border-r border-border bg-sidebar overflow-hidden">
      {/* Tab switcher */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setLeftPanelTab('highlights')}
          className={`flex-1 py-2 text-[11px] font-semibold transition-colors ${
            leftPanelTab === 'highlights'
              ? 'border-b-2 border-gaming-purple text-gaming-purple'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          AI 高光
        </button>
        <button
          onClick={() => setLeftPanelTab('media')}
          className={`flex-1 py-2 text-[11px] font-semibold transition-colors ${
            leftPanelTab === 'media'
              ? 'border-b-2 border-gaming-purple text-gaming-purple'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          素材库
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {leftPanelTab === 'highlights' ? (
          <>
            {/* AI header */}
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold text-foreground">AI 高光标记</h3>
              <span className="text-[10px] text-muted-foreground">
                {aiAnalyzing ? '分析中...' : `已识别 ${visibleMarkers.length} 处`}
              </span>
            </div>

            {/* B1: AI error */}
            <AIErrorBanner />

            {/* AI analyzing state (C2) */}
            {aiAnalyzing && (
              <div className="rounded-lg border border-gaming-blue/20 bg-gaming-blue/8 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-gaming-blue" />
                  <span className="text-[10px] font-medium text-gaming-blue">AI 分析中... 65%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted">
                  <div className="h-full w-[65%] rounded-full bg-gaming-blue transition-all" />
                </div>
                <p className="mt-1.5 text-[9px] text-muted-foreground">已识别的结果可提前使用</p>
              </div>
            )}

            {/* Marker list */}
            {visibleMarkers.map((m) => (
              <HighlightCard key={m.id} marker={m} />
            ))}

            {activeCount > 3 && (
              <p className="text-center text-[10px] text-muted-foreground">
                还有 {activeCount - 3} 处高光 ↓
              </p>
            )}

            {/* Trigger AI analysis button */}
            {!aiAnalyzing && (
              <button
                onClick={triggerAIAnalysis}
                className="w-full rounded-lg border border-dashed border-border py-2 text-[10px] font-medium text-muted-foreground transition-colors hover:border-gaming-purple hover:text-gaming-purple"
              >
                重新 AI 分析
              </button>
            )}
          </>
        ) : (
          <>
            {/* Media library header */}
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold text-foreground">素材库</h3>
              <span className="text-[10px] text-muted-foreground">{allMedia.length} 个</span>
            </div>

            {/* A7: Search input for media filter */}
            <input
              value={mediaFilter}
              onChange={(e) => setMediaFilter(e.target.value)}
              placeholder="搜索素材..."
              className="w-full rounded-md border border-border bg-background/50 px-2 py-1 text-[10px] text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-gaming-purple"
            />

            {/* A1: Media items from /assets store, filtered */}
            {mediaItems.length > 0 ? mediaItems.map((asset) => (
              <MediaItem key={asset.id} asset={asset} />
            )) : (
              /* A7-2: No filter results */
              <div className="py-4 text-center">
                <p className="text-[10px] text-muted-foreground">未找到匹配素材</p>
                <button
                  onClick={() => setMediaFilter('')}
                  className="mt-1 text-[10px] text-gaming-purple hover:underline"
                >
                  清除筛选
                </button>
              </div>
            )}

            {/* Import button (A1) */}
            <button className="w-full rounded-lg border border-dashed border-border py-2.5 text-[10px] font-medium text-muted-foreground transition-colors hover:border-gaming-purple hover:text-gaming-purple">
              + 从素材库导入
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ── helpers ── */

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
