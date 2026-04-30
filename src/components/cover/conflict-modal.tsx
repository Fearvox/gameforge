'use client';

import { useCoverStore } from '@/lib/cover-store';

/* ── B5: Conflict resolution modal ──
 * Shown when another user has made changes to the same project.
 * Three options: load latest, overwrite with local, save as copy.
 */

export default function ConflictModal() {
  const { showConflictModal, conflict, resolveConflict } = useCoverStore();

  if (!showConflictModal || !conflict) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[380px] rounded-xl border border-gaming-warning/20 bg-sidebar p-5 shadow-xl">
        <h2 className="text-sm font-semibold text-gaming-warning">⚠ 编辑冲突</h2>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          {conflict.otherUser} 在 {new Date(conflict.conflictAt).toLocaleTimeString()} 做了修改：
        </p>
        <p className="mt-1 rounded-md bg-background/30 px-2 py-1.5 text-[10px] text-foreground/70">
          {conflict.theirVersion}
        </p>

        <div className="mt-4 space-y-1.5">
          <button
            onClick={() => resolveConflict('load')}
            className="w-full rounded-lg border border-border py-2 text-left text-[11px] font-medium text-foreground transition-colors hover:bg-accent"
          >
            加载最新版本
          </button>
          <button
            onClick={() => resolveConflict('overwrite')}
            className="w-full rounded-lg border border-border py-2 text-left text-[11px] font-medium text-foreground transition-colors hover:bg-accent"
          >
            覆盖保存本地版本
          </button>
          <button
            onClick={() => resolveConflict('duplicate')}
            className="w-full rounded-lg border border-gaming-blue/20 bg-gaming-blue/6 py-2 text-left text-[11px] font-medium text-gaming-blue transition-colors hover:bg-gaming-blue/12"
          >
            另存为副本
          </button>
        </div>
      </div>
    </div>
  );
}
