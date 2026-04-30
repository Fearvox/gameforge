'use client';

import { useEffect, useMemo, useState } from 'react';
import AssetToolbar from '@/components/assets/asset-toolbar';
import TagPanel from '@/components/assets/tag-panel';
import AssetCard from '@/components/assets/asset-card';
import PreviewPanel from '@/components/assets/preview-panel';
import UploadDialog from '@/components/assets/upload-dialog';
import ConfirmDialog from '@/components/assets/confirm-dialog';
import ConflictToast from '@/components/assets/conflict-toast';
import PartialFailure from '@/components/assets/partial-failure';
import BatchActions from '@/components/assets/batch-actions';
import { EmptyAssets, NoFilterResults, SkeletonGrid } from '@/components/assets/empty-states';
import { useAssetsStore } from '@/lib/assets-store';
import { AlertTriangle, LogIn } from 'lucide-react';

export default function AssetsPage() {
  const {
    assets,
    viewMode,
    page, pageSize, setPage,
    getFilteredAssets,
    searchQuery, typeFilter, tagFilter,
    simulateConflict,
    error, dismissError,
  } = useAssetsStore();

  // A8: loading state for skeleton display
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => getFilteredAssets(), [getFilteredAssets]);
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const isFiltered = searchQuery || typeFilter !== 'all' || tagFilter;
  const isEmpty = assets.length === 0;
  const isFilterEmpty = filtered.length === 0 && isFiltered;

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">素材库</h1>
          <p className="text-sm text-muted-foreground">
            管理你的视频、图片、音频素材
          </p>
        </div>
        {/* B5 demo trigger */}
        <button
          onClick={simulateConflict}
          className="flex items-center gap-1 rounded-lg border border-gaming-warning/30 px-3 py-1.5 text-[10px] font-medium text-gaming-warning transition-colors hover:bg-gaming-warning/10"
        >
          <AlertTriangle className="h-3 w-3" />
          模拟冲突
        </button>
      </div>

      {/* B6: Permission/session error banner */}
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-gaming-error/30 bg-gaming-error/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-gaming-error" />
            <span className="text-sm text-gaming-error">{error}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={dismissError}
              className="flex items-center gap-1 rounded-md border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-accent"
            >
              <LogIn className="h-3 w-3" />
              重新登录
            </button>
            <button
              onClick={dismissError}
              className="rounded-md px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <AssetToolbar />

      {/* B4 partial failure */}
      <PartialFailure />

      {/* Main layout: tag panel + grid + preview */}
      <div className="grid gap-4 xl:grid-cols-[200px_1fr_300px] lg:grid-cols-[200px_1fr]">
        {/* Left: tags */}
        <div className="hidden lg:block">
          <TagPanel />
        </div>

        {/* Center: grid/list (A8: skeleton → content → empty) */}
        <div className="min-w-0">
          {loading ? (
            <SkeletonGrid />
          ) : isEmpty && !isFiltered ? (
            <EmptyAssets />
          ) : isFilterEmpty ? (
            <NoFilterResults />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {paged.map((asset) => (
                <AssetCard key={asset.id} asset={asset} />
              ))}
            </div>
          ) : (
            <div className="space-y-1.5">
              {paged.map((asset) => (
                <AssetCard key={asset.id} asset={asset} isListView />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-7 w-7 rounded-md text-xs font-medium transition-colors ${
                    p === page
                      ? 'bg-gaming-purple/15 text-gaming-purple'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: preview */}
        <div className="hidden xl:block">
          <PreviewPanel />
        </div>
      </div>

      {/* Bottom batch actions */}
      <div className="hidden md:block">
        <BatchActions />
      </div>

      {/* Modals & overlays */}
      <UploadDialog />
      <ConfirmDialog />
      <ConflictToast />
    </div>
  );
}
