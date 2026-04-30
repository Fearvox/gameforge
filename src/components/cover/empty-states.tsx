'use client';

import { Palette, Search } from 'lucide-react';

/* ── A8-1: Empty state — no cover works ── */

export function EmptyCanvas() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gaming-purple/10">
        <Palette className="h-8 w-8 text-gaming-purple/30" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">开始创建封面</h3>
      <p className="max-w-[240px] text-center text-[11px] text-muted-foreground">
        从左侧选择一个模板开始，或点击工具栏添加文字和图片
      </p>
      <div className="mt-2 flex gap-2">
        <button className="rounded-lg bg-gaming-purple/10 px-4 py-2 text-[11px] font-medium text-gaming-purple transition-colors hover:bg-gaming-purple/20">
          选择模板
        </button>
        <button className="rounded-lg border border-border px-4 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground">
          空白画布
        </button>
      </div>
    </div>
  );
}

/* ── A8-2: No filter results ── */

export function NoTemplateResults() {
  return (
    <div className="flex flex-col items-center gap-2 py-8">
      <Search className="h-6 w-6 text-muted-foreground/20" />
      <p className="text-[10px] text-muted-foreground">未找到匹配模板</p>
    </div>
  );
}

/* ── A8-3: Skeleton loading ── */

export function SkeletonCanvas() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gaming-purple border-t-transparent" />
        <div className="h-3 w-32 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

export function SkeletonTemplates() {
  return (
    <div className="grid grid-cols-2 gap-2 p-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-20 animate-pulse rounded-lg bg-muted/20"
        />
      ))}
    </div>
  );
}
