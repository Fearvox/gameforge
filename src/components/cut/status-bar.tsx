'use client';

import { AlertTriangle, LogIn } from 'lucide-react';
import { useCutStore } from '@/lib/cut-store';

export default function StatusBar() {
  const {
    projectName, draftSaved,
    error, dismissError,
  } = useCutStore();

  return (
    <>
      {/* B6/D3: Error banner */}
      {error && (
        <div className="flex items-center justify-between border-b border-gaming-error/30 bg-gaming-error/10 px-4 py-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-gaming-error" />
            <span className="text-[10px] text-gaming-error">{error}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={dismissError}
              className="flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[9px] font-medium text-foreground hover:bg-accent"
            >
              <LogIn className="h-2.5 w-2.5" />
              重新登录
            </button>
            <button onClick={dismissError} className="text-[9px] text-muted-foreground hover:text-foreground">
              关闭
            </button>
          </div>
        </div>
      )}

      {/* Bottom status bar */}
      <div className="flex items-center justify-between border-t border-border bg-background/90 px-4 py-1">
        <span className="text-[9px] text-muted-foreground">
          项目: {projectName} · 分辨率: 1920x1080 · 帧率: 60fps · 编码: H.264
        </span>
        <span className="text-[9px] text-muted-foreground">
          {draftSaved ? '自动保存已开启' : '未保存'}
        </span>
      </div>
    </>
  );
}
