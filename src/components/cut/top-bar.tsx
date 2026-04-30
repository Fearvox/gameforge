'use client';

import { Redo, Undo, Save, Upload } from 'lucide-react';
import { useCutStore, type AspectRatio } from '@/lib/cut-store';

const RATIOS: { value: AspectRatio; label: string }[] = [
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '1:1', label: '1:1' },
  { value: '4:3', label: '4:3' },
];

export default function TopBar() {
  const {
    projectName, setProjectName,
    aspectRatio, setAspectRatio,
    draftSaved, draftSavedAt,
    undo, redo, canUndo, canRedo,
  } = useCutStore();

  const savedLabel = draftSaved
    ? `已保存${draftSavedAt ? ' · ' + timeAgo(draftSavedAt) : ''}`
    : '未保存';

  return (
    <div className="flex items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-sm"
      style={{ height: 48 }}
    >
      {/* Left: project name + save status */}
      <div className="flex items-center gap-3 min-w-0">
        <input
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="truncate bg-transparent text-sm font-semibold text-foreground outline-none max-w-[220px]"
          aria-label="项目名称"
        />
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Save className="h-3 w-3" />
          {savedLabel}
        </span>
      </div>

      {/* Center: aspect ratio toggle */}
      <div className="flex items-center gap-1">
        {RATIOS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setAspectRatio(value)}
            className={`rounded-md px-2.5 py-1 text-[10px] font-semibold transition-colors ${
              aspectRatio === value
                ? 'bg-gaming-blue/15 text-gaming-blue'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Right: undo/redo + export */}
      <div className="flex items-center gap-2">
        <button
          onClick={undo}
          disabled={!canUndo()}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
          aria-label="撤销"
        >
          <Undo className="h-4 w-4" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo()}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
          aria-label="重做"
        >
          <Redo className="h-4 w-4" />
        </button>
        <button
          className="flex items-center gap-1.5 rounded-full gradient-gaming px-4 py-1.5 text-[11px] font-semibold text-white transition-opacity hover:opacity-90"
          onClick={() => {
            const s = useCutStore.getState();
            s.createExport(`${s.projectName}_${s.aspectRatio.replace(':', 'x')}.mp4`, '1080p', s.aspectRatio);
          }}
        >
          <Upload className="h-3.5 w-3.5" />
          导出渲染
        </button>
      </div>
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  return `${Math.floor(mins / 60)} 小时前`;
}
