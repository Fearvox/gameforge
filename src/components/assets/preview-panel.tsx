'use client';

import { useMemo } from 'react';
import { X, Play, Download, Scissors, Trash2, Film, Image as ImageIcon, Music, FileQuestion, RotateCw } from 'lucide-react';
import { useAssetsStore, type Asset } from '@/lib/assets-store';

function formatSize(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(0)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function formatDuration(sec?: number): string {
  if (!sec) return '-';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const TYPE_ICONS: Record<string, typeof Film> = {
  video: Film, image: ImageIcon, audio: Music, unknown: FileQuestion,
};

/* ── B3 Preview Failure ── */
function PreviewFailure({ asset }: { asset: Asset }) {
  const { retryAsset } = useAssetsStore();
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-gaming-error/30 bg-gaming-error/10 p-6 text-center">
      <FileQuestion className="h-8 w-8 text-gaming-error" />
      <p className="text-sm font-medium text-gaming-error">视频编码格式不支持在线预览</p>
      <p className="text-xs text-muted-foreground">文件仍可下载使用</p>
      <div className="flex gap-2">
        <button
          onClick={() => retryAsset(asset.id)}
          className="flex items-center gap-1 rounded-md border border-gaming-error/40 px-3 py-1.5 text-xs font-medium text-gaming-error transition-colors hover:bg-gaming-error/10"
        >
          <RotateCw className="h-3 w-3" />
          重试预览
        </button>
        <button className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent">
          <Download className="h-3 w-3" />
          下载原文件
        </button>
      </div>
    </div>
  );
}

/* ── Main Panel ── */
export default function PreviewPanel() {
  const { assets, tags, previewAssetId, setPreviewAsset, addTagToAssets, openConfirm } = useAssetsStore();
  const asset = useMemo(() => assets.find((a) => a.id === previewAssetId), [assets, previewAssetId]);

  if (!asset) {
    return (
      <div className="glass-card flex flex-col items-center justify-center gap-3 rounded-xl p-6 text-center">
        <Film className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-xs text-muted-foreground">选择素材查看详情</p>
      </div>
    );
  }

  const Icon = TYPE_ICONS[asset.type] ?? FileQuestion;
  const assetTags = tags.filter((t) => asset.tagIds.includes(t.id));
  const availableTags = tags.filter((t) => t.id !== 'tag-all' && !asset.tagIds.includes(t.id));
  const showFailure = asset.status === 'failed' || asset.type === 'unknown';

  return (
    <div className="glass-card flex flex-col gap-4 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <h3 className="text-sm font-semibold text-foreground truncate flex-1 pr-2">{asset.name}</h3>
        <button onClick={() => setPreviewAsset(null)} className="shrink-0 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Preview area or failure */}
      {showFailure ? (
        <PreviewFailure asset={asset} />
      ) : (
        <div className="relative flex h-40 items-center justify-center rounded-lg bg-muted/30">
          <Icon className="h-12 w-12 text-muted-foreground/40" />
          {asset.type === 'video' && (
            <button className="absolute flex h-10 w-10 items-center justify-center rounded-full bg-gaming-purple/80 text-white transition-colors hover:bg-gaming-purple">
              <Play className="h-5 w-5 ml-0.5" />
            </button>
          )}
        </div>
      )}

      {/* Metadata */}
      <div className="space-y-1.5 text-xs">
        {[
          ['类型', asset.type.toUpperCase()],
          ['大小', formatSize(asset.size)],
          ['分辨率', asset.resolution ?? '-'],
          ['时长', formatDuration(asset.duration)],
          ['上传时间', new Date(asset.uploadedAt).toLocaleDateString('zh-CN')],
          ['状态', asset.status === 'ready' ? '就绪' : asset.status === 'uploading' ? '上传中' : asset.status === 'failed' ? '失败' : asset.status === 'pending-review' ? '待审核' : '处理中'],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-foreground font-mono">{value}</span>
          </div>
        ))}
      </div>

      {/* Tags */}
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">标签</p>
        <div className="flex flex-wrap gap-1">
          {assetTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-foreground"
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tag.color }} />
              {tag.name}
            </span>
          ))}
          {availableTags.length > 0 && (
            <select
              onChange={(e) => {
                if (e.target.value) addTagToAssets(e.target.value, [asset.id]);
                e.target.value = '';
              }}
              defaultValue=""
              className="rounded-full border border-dashed border-border px-2 py-0.5 text-[10px] text-muted-foreground bg-transparent focus:outline-none"
            >
              <option value="">+ 添加</option>
              {availableTags.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-border py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent">
          <Download className="h-3.5 w-3.5" />
          下载
        </button>
        <button className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-border py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent">
          <Scissors className="h-3.5 w-3.5" />
          发送到剪辑
        </button>
        <button
          onClick={() => openConfirm('delete', [asset.id])}
          className="flex items-center justify-center rounded-lg border border-gaming-error/30 px-3 py-2 text-xs text-gaming-error transition-colors hover:bg-gaming-error/10"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
