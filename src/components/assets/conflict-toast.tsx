'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useAssetsStore } from '@/lib/assets-store';

/** B5: Concurrent conflict toast with auto-refresh countdown */
export default function ConflictToast() {
  const { conflict, dismissConflict } = useAssetsStore();

  if (!conflict) return null;

  return (
    <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 md:bottom-4">
      <div className="glass-card flex items-center gap-3 rounded-lg border border-gaming-warning/30 px-4 py-3 shadow-lg">
        <AlertTriangle className="h-4 w-4 shrink-0 text-gaming-warning" />
        <div className="min-w-0">
          <p className="text-xs font-medium text-foreground">
            素材已变更 — {conflict.assetName} 已被{conflict.reason === 'deleted' ? '其他端删除' : '其他端移动'}
          </p>
          <p className="text-[10px] text-muted-foreground">列表将在 3 秒后自动刷新</p>
        </div>
        <button
          onClick={dismissConflict}
          className="shrink-0 flex items-center gap-1 rounded-md bg-gaming-blue/15 px-2.5 py-1 text-xs font-medium text-gaming-blue transition-colors hover:bg-gaming-blue/25"
        >
          <RefreshCw className="h-3 w-3" />
          刷新
        </button>
      </div>
    </div>
  );
}
