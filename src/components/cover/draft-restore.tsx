'use client';

import { X } from 'lucide-react';
import { useCoverStore } from '@/lib/cover-store';

/* ── A6: Draft restore modal (design补稿 Row 3c)
 * Shown when user returns to editor and a draft is detected.
 * Shows: last edit time + element count + auto-save timestamp
 * CTAs: gradient "恢复草稿" + red "放弃草稿" + close ✕
 */

export default function DraftRestore() {
  const { showDraftRestore, draftState, restoreDraft, discardDraft, setShowDraftRestore } = useCoverStore();

  if (!showDraftRestore || !draftState) return null;

  const lastEditTime = draftState.savedAt
    ? formatRelativeTime(new Date(draftState.savedAt))
    : '未知';
  const elementCount = draftState.elements.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[380px] rounded-xl border border-border bg-sidebar p-5 shadow-xl">
        {/* Close button */}
        <button
          onClick={() => setShowDraftRestore(false)}
          className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground/40 transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-sm font-semibold text-foreground">检测到未保存草稿</h2>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          发现上次编辑的未保存内容，是否恢复？
        </p>

        {/* Draft metadata */}
        <div className="mt-3 space-y-1 rounded-lg bg-background/30 px-3 py-2">
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground/60">上次编辑</span>
            <span className="text-foreground/70">{lastEditTime}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground/60">元素数量</span>
            <span className="text-foreground/70">{elementCount} 个</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground/60">自动保存</span>
            <span className="text-foreground/70">{draftState.savedAt ? new Date(draftState.savedAt).toLocaleString() : '—'}</span>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={restoreDraft}
            className="flex-1 rounded-lg bg-gradient-to-r from-gaming-purple to-gaming-blue py-2 text-[11px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            恢复草稿
          </button>
          <button
            onClick={discardDraft}
            className="flex-1 rounded-lg border border-gaming-error/20 bg-gaming-error/8 py-2 text-[11px] font-medium text-gaming-error transition-colors hover:bg-gaming-error/15"
          >
            放弃草稿
          </button>
        </div>
      </div>
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = Math.floor((now - date.getTime()) / 1000);
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  return `${Math.floor(diff / 86400)} 天前`;
}
