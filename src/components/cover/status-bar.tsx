'use client';

import { AlertTriangle } from 'lucide-react';
import { useCoverStore } from '@/lib/cover-store';

export default function StatusBar() {
  const {
    error, errorType,
    activeTemplateId, templates,
    canvasSize, elements,
    lastSavedAt,
  } = useCoverStore();

  const tpl = templates.find((t) => t.id === activeTemplateId);
  const timeAgo = lastSavedAt ? formatTimeAgo(new Date(lastSavedAt)) : '';

  return (
    <>
      {/* B6/D3: Auth error banner */}
      {error && errorType === 'auth' && (
        <div className="flex items-center gap-2 border-b border-gaming-error/20 bg-gaming-error/8 px-4 py-1.5">
          <AlertTriangle className="h-3 w-3 shrink-0 text-gaming-error" />
          <span className="flex-1 text-[10px] font-medium text-gaming-error">{error}</span>
          <button
            onClick={() => useCoverStore.getState().verifySession()}
            className="rounded-md bg-gaming-error/15 px-2 py-0.5 text-[9px] font-medium text-gaming-error transition-colors hover:bg-gaming-error/25"
          >
            重新登录
          </button>
        </div>
      )}

      {/* Bottom status bar */}
      <div className="flex h-4 items-center justify-between border-t border-border bg-sidebar px-4 text-[9px] text-muted-foreground/55">
        <span>
          模板: {tpl?.name ?? '无'} · 画布: {canvasSize.w}×{canvasSize.h} · 元素: {elements.length} 个
        </span>
        <span>
          自动保存已开启 {timeAgo && `· 上次保存 ${timeAgo}`}
        </span>
        <span className="text-muted-foreground/35">
          Ctrl+S 手动保存 · Ctrl+E 导出
        </span>
      </div>
    </>
  );
}

function formatTimeAgo(date: Date): string {
  const now = Date.now();
  const diff = Math.floor((now - date.getTime()) / 1000);
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  return `${Math.floor(diff / 86400)} 天前`;
}
