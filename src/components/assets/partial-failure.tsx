'use client';

import { X, RotateCw, AlertTriangle } from 'lucide-react';
import { useAssetsStore } from '@/lib/assets-store';

/** B4: Batch partial failure display */
export default function PartialFailure() {
  const { batchResult, dismissBatchResult, retryAsset } = useAssetsStore();

  if (!batchResult || batchResult.failed.length === 0) return null;

  /** Retry all failed items */
  function retryAllFailed() {
    batchResult!.failed.forEach((f) => retryAsset(f.id));
    dismissBatchResult();
  }

  return (
    <div className="glass-card rounded-xl border border-gaming-warning/30 p-4">
      {/* Summary banner */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-gaming-warning" />
          <span className="text-sm font-semibold text-foreground">
            成功 {batchResult.success.length} · 失败 {batchResult.failed.length}
          </span>
        </div>
        <button onClick={dismissBatchResult} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Failed items */}
      <div className="space-y-1.5">
        {batchResult.failed.map((f) => (
          <div
            key={f.id}
            className="flex items-center justify-between rounded-lg bg-gaming-error/10 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-foreground">{f.name}</p>
              <p className="text-[10px] text-gaming-error/80">{f.reason}</p>
            </div>
            <button
              onClick={() => retryAsset(f.id)}
              className="shrink-0 flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-gaming-error transition-colors hover:bg-gaming-error/15"
            >
              <RotateCw className="h-3 w-3" />
              重试
            </button>
          </div>
        ))}
      </div>

      {/* Batch actions */}
      <div className="mt-3 flex gap-2">
        <button
          onClick={retryAllFailed}
          className="flex items-center gap-1 rounded-lg border border-gaming-error/40 px-3 py-1.5 text-xs font-medium text-gaming-error transition-colors hover:bg-gaming-error/10"
        >
          <RotateCw className="h-3 w-3" />
          全部重试
        </button>
        <button
          onClick={dismissBatchResult}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent"
        >
          忽略失败
        </button>
      </div>
    </div>
  );
}
