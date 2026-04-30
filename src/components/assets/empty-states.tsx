'use client';

import { FolderOpen, SearchX } from 'lucide-react';
import { useAssetsStore } from '@/lib/assets-store';

/** A8-1: No assets at all */
export function EmptyAssets() {
  const { openUpload } = useAssetsStore();
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gaming-purple/10">
        <FolderOpen className="h-8 w-8 text-gaming-purple" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">还没有素材</p>
        <p className="mt-1 text-xs text-muted-foreground">上传你的第一个素材开始使用</p>
      </div>
      <button
        onClick={openUpload}
        className="rounded-full gradient-gaming px-5 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
      >
        上传素材
      </button>
    </div>
  );
}

/** A8-2: Filter returns no results */
export function NoFilterResults() {
  const { setSearchQuery, setTypeFilter, setTagFilter } = useAssetsStore();
  function clearAll() {
    setSearchQuery('');
    setTypeFilter('all');
    setTagFilter(null);
  }
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
      <SearchX className="h-10 w-10 text-muted-foreground/40" />
      <div>
        <p className="text-sm font-semibold text-foreground">没有匹配的素材</p>
        <p className="mt-1 text-xs text-muted-foreground">尝试调整筛选条件</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={clearAll}
          className="rounded-lg border border-border px-4 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
        >
          清除筛选
        </button>
        <button
          onClick={() => useAssetsStore.getState().openUpload()}
          className="rounded-lg gradient-gaming px-4 py-1.5 text-xs font-semibold text-white"
        >
          上传素材
        </button>
      </div>
    </div>
  );
}

/** A8-3: Skeleton loading state */
export function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-2 rounded-lg bg-background/30 p-2"
          style={{ opacity: 1 - i * 0.08 }}
        >
          <div className="h-24 animate-pulse rounded-lg bg-muted/50" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-muted/50" />
          <div className="h-2 w-1/2 animate-pulse rounded bg-muted/30" />
        </div>
      ))}
    </div>
  );
}
