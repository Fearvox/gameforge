'use client';

import { Scissors } from 'lucide-react';

/* ── A7-1: Empty project (no clips) ── */

export function EmptyProject() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gaming-purple/15">
        <Scissors className="h-6 w-6 text-gaming-purple" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">开始你的剪辑</h3>
      <p className="mt-1 text-xs text-muted-foreground">导入素材到时间线开始创作</p>
      <div className="mt-4 flex gap-2">
        <button className="rounded-lg gradient-gaming px-4 py-1.5 text-xs font-semibold text-white">
          从素材库导入
        </button>
        <button className="rounded-lg border border-border px-4 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
          拖拽上传
        </button>
      </div>
    </div>
  );
}

/* ── A7-2: No filter results ── */

export function NoFilterResults() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <p className="text-xs text-muted-foreground">未找到匹配结果</p>
      <p className="mt-1 text-[10px] text-muted-foreground/60">尝试清除筛选条件</p>
    </div>
  );
}

/* ── A7-3: Skeleton loading ── */

export function SkeletonTimeline() {
  return (
    <div className="space-y-2 p-3 animate-pulse">
      {['video', 'broll', 'audio', 'subtitle'].map((type) => (
        <div key={type} className="flex items-center gap-2">
          <div className="h-8 w-16 rounded bg-muted/30" />
          <div className="flex-1 flex gap-1">
            <div className="h-8 w-32 rounded bg-muted/20" />
            <div className="h-8 w-20 rounded bg-muted/15" />
          </div>
        </div>
      ))}
    </div>
  );
}
