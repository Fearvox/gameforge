'use client';

import { AlertTriangle } from 'lucide-react';
import { useCutStore } from '@/lib/cut-store';

/** B3: Multi-device editing conflict modal */
export default function ConflictModal() {
  const { draftConflict, resolveConflict, dismissConflict } = useCutStore();

  if (!draftConflict) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-card relative w-full max-w-md rounded-xl p-6">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-gaming-warning" />
          <h3 className="text-sm font-semibold text-foreground">编辑冲突</h3>
        </div>

        <p className="mb-4 text-xs text-muted-foreground">
          此项目在其他设备上有更新版本（{draftConflict.reason === 'modified' ? '内容已修改' : '项目已删除'}）。
          请选择如何处理：
        </p>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => resolveConflict(false)}
            className="w-full rounded-lg border border-gaming-blue/30 bg-gaming-blue/10 px-4 py-2 text-xs font-medium text-gaming-blue transition-colors hover:bg-gaming-blue/20"
          >
            加载最新版本
          </button>
          <button
            onClick={() => resolveConflict(true)}
            className="w-full rounded-lg border border-gaming-warning/30 bg-gaming-warning/10 px-4 py-2 text-xs font-medium text-gaming-warning transition-colors hover:bg-gaming-warning/20"
          >
            覆盖保存本地版本
          </button>
          <button
            onClick={dismissConflict}
            className="w-full rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent"
          >
            另存为副本
          </button>
        </div>
      </div>
    </div>
  );
}
