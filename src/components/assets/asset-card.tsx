'use client';

import { Film, Image as ImageIcon, Music, FileQuestion, Check, Loader2 } from 'lucide-react';
import { useAssetsStore, type Asset, type AssetType, type AssetStatus } from '@/lib/assets-store';

const TYPE_ICONS: Record<AssetType, typeof Film> = {
  video: Film,
  image: ImageIcon,
  audio: Music,
  unknown: FileQuestion,
};

const TYPE_COLORS: Record<AssetType, string> = {
  video: 'text-gaming-purple',
  image: 'text-gaming-cyan',
  audio: 'text-gaming-blue',
  unknown: 'text-muted-foreground',
};

function formatSize(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(0)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function StatusOverlay({ status, progress, failReason }: {
  status: AssetStatus; progress?: number; failReason?: string;
}) {
  if (status === 'uploading') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-lg">
        <Loader2 className="h-6 w-6 animate-spin text-gaming-blue mb-2" />
        <div className="w-3/4 h-1.5 rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-gaming-blue transition-all"
            style={{ width: `${progress ?? 0}%` }}
          />
        </div>
        <span className="mt-1 text-[10px] font-mono text-white">{progress ?? 0}%</span>
      </div>
    );
  }
  if (status === 'pending-review') {
    return (
      <div className="absolute top-2 right-2 rounded-md bg-gaming-warning/90 px-1.5 py-0.5 text-[10px] font-medium text-black">
        {failReason ?? '待审核'}
      </div>
    );
  }
  if (status === 'failed') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-lg">
        <span className="text-xs text-gaming-error font-medium">上传失败</span>
        {failReason && <span className="mt-1 text-[10px] text-gaming-error/70">{failReason}</span>}
      </div>
    );
  }
  return null;
}

export default function AssetCard({ asset, isListView }: { asset: Asset; isListView?: boolean }) {
  const { selectedIds, toggleSelect, setPreviewAsset } = useAssetsStore();
  const isSelected = selectedIds.has(asset.id);
  const Icon = TYPE_ICONS[asset.type];
  const iconColor = TYPE_COLORS[asset.type];

  const isPending = asset.status === 'pending-review';
  const borderColor = isSelected
    ? 'border-gaming-blue'
    : isPending
      ? 'border-gaming-warning/50'
      : 'border-transparent';

  if (isListView) {
    return (
      <button
        onClick={() => setPreviewAsset(asset.id)}
        className={`flex w-full items-center gap-3 rounded-lg border bg-background/50 px-3 py-2.5 text-left transition-colors hover:bg-accent/50 ${borderColor}`}
      >
        <button
          onClick={(e) => { e.stopPropagation(); toggleSelect(asset.id); }}
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
            isSelected ? 'border-gaming-blue bg-gaming-blue' : 'border-border'
          }`}
        >
          {isSelected && <Check className="h-3 w-3 text-white" />}
        </button>
        <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} />
        <span className="min-w-0 flex-1 truncate text-sm text-foreground">{asset.name}</span>
        <span className="shrink-0 text-xs text-muted-foreground">{formatSize(asset.size)}</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => setPreviewAsset(asset.id)}
      className={`group relative flex flex-col overflow-hidden rounded-lg border bg-background/50 transition-colors hover:bg-accent/50 ${borderColor} ${
        isSelected ? 'ring-1 ring-gaming-blue' : ''
      }`}
    >
      {/* Thumbnail / icon area */}
      <div className="relative flex h-28 items-center justify-center bg-muted/30">
        <Icon className={`h-10 w-10 ${iconColor}`} />
        <StatusOverlay status={asset.status} progress={asset.progress} failReason={asset.failReason} />

        {/* Selection checkbox */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleSelect(asset.id); }}
          className={`absolute top-2 left-2 flex h-5 w-5 items-center justify-center rounded border transition-opacity ${
            isSelected ? 'border-gaming-blue bg-gaming-blue opacity-100' : 'border-white/30 opacity-0 group-hover:opacity-100'
          }`}
        >
          {isSelected && <Check className="h-3 w-3 text-white" />}
        </button>

        {/* Duration badge */}
        {asset.duration && (
          <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1 py-0.5 text-[10px] font-mono text-white">
            {formatDuration(asset.duration)}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-0.5 px-3 py-2">
        <p className="truncate text-xs font-medium text-foreground">{asset.name}</p>
        <p className="text-[10px] text-muted-foreground">
          {asset.type.toUpperCase()} · {formatSize(asset.size)}
        </p>
      </div>
    </button>
  );
}
