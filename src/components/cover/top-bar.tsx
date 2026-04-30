'use client';

import { Redo2, Undo2, Download } from 'lucide-react';
import { useCoverStore, type AspectRatio } from '@/lib/cover-store';

const RATIOS: { label: string; value: AspectRatio }[] = [
  { label: '16:9', value: '16:9' },
  { label: '9:16', value: '9:16' },
  { label: '1:1', value: '1:1' },
];

export default function TopBar() {
  const {
    projectName, saveStatus, lastSavedAt,
    aspectRatio, setAspectRatio,
    undo, redo, _past, _future,
    startExport,
  } = useCoverStore();

  const timeAgo = lastSavedAt
    ? formatTimeAgo(new Date(lastSavedAt))
    : '未保存';

  return (
    <div className="flex h-12 items-center gap-3 border-b border-border bg-sidebar px-4">
      {/* Project name */}
      <input
        value={projectName}
        onChange={() => {}}
        className="min-w-0 max-w-[200px] truncate bg-transparent text-sm font-semibold text-foreground outline-none"
      />

      {/* Save status */}
      <span className="text-[10px] text-muted-foreground">
        {saveStatus === 'saved' && `已保存 · ${timeAgo}`}
        {saveStatus === 'saving' && '保存中...'}
        {saveStatus === 'unsaved' && '未保存'}
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Aspect ratio toggle (A5) */}
      <div className="flex items-center gap-1">
        {RATIOS.map((r) => (
          <button
            key={r.value}
            onClick={() => setAspectRatio(r.value)}
            className={`rounded-md px-2 py-1 text-[9px] font-semibold transition-colors ${
              aspectRatio === r.value
                ? 'bg-gaming-blue/12 text-gaming-blue'
                : 'text-muted-foreground/55 hover:text-foreground'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Undo/Redo (A2) */}
      <div className="flex items-center gap-1">
        <button
          onClick={undo}
          disabled={_past.length === 0}
          className="rounded-md p-1.5 text-muted-foreground/55 transition-colors hover:text-foreground disabled:opacity-30"
          title="撤销"
        >
          <Undo2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={redo}
          disabled={_future.length === 0}
          className="rounded-md p-1.5 text-muted-foreground/55 transition-colors hover:text-foreground disabled:opacity-30"
          title="重做"
        >
          <Redo2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Export CTA (A6) */}
      <button
        onClick={() => startExport()}
        className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-gaming-purple via-gaming-blue to-gaming-cyan px-4 py-1.5 text-[11px] font-semibold text-white transition-opacity hover:opacity-90"
      >
        <Download className="h-3 w-3" />
        导出封面
      </button>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = Date.now();
  const diff = Math.floor((now - date.getTime()) / 1000);
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  return `${Math.floor(diff / 86400)} 天前`;
}
