'use client';

import { FileText } from 'lucide-react';
import { useCutStore } from '@/lib/cut-store';

/** A6: Draft restore dialog — shown on page load if a draft exists */
export default function DraftRestore() {
  const { showDraftRestore, restoreDraft, discardDraft } = useCutStore();

  if (!showDraftRestore) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-card relative w-full max-w-sm rounded-xl p-6">
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-5 w-5 text-gaming-blue" />
          <h3 className="text-sm font-semibold text-foreground">检测到未保存草稿</h3>
        </div>

        <p className="mb-4 text-xs text-muted-foreground">
          系统检测到此项目有未保存的编辑草稿。是否恢复上次编辑内容？
        </p>

        <div className="flex gap-2">
          <button
            onClick={restoreDraft}
            className="flex-1 rounded-lg gradient-gaming py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          >
            恢复草稿
          </button>
          <button
            onClick={discardDraft}
            className="flex-1 rounded-lg border border-border py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent"
          >
            放弃
          </button>
        </div>
      </div>
    </div>
  );
}
