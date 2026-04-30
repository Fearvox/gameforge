'use client';

import { AlertTriangle, Download } from 'lucide-react';
import { useCoverStore } from '@/lib/cover-store';

/* ── B3: Preview render failure banner ──
 * Shown when canvas preview rendering fails.
 * CTAs: "重新渲染" + "降低质量预览" + "下载原图"
 */

export default function PreviewErrorBanner() {
  const { retryPreview } = useCoverStore();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gaming-error/10">
        <AlertTriangle className="h-7 w-7 text-gaming-error/40" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">预览渲染失败</h3>
      <p className="max-w-[280px] text-center text-[11px] text-muted-foreground">
        画布内容渲染时出错，可能是元素过多或图片资源异常
      </p>

      <div className="mt-2 flex gap-2">
        <button
          onClick={retryPreview}
          className="rounded-lg bg-gaming-error/10 px-4 py-2 text-[11px] font-medium text-gaming-error transition-colors hover:bg-gaming-error/20"
        >
          重新渲染
        </button>
        <button
          onClick={retryPreview}
          className="rounded-lg border border-border px-4 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          降低质量预览
        </button>
        <button
          className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Download className="h-3 w-3" />
          下载原图
        </button>
      </div>
    </div>
  );
}
