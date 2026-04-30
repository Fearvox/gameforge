'use client';

import { AlertTriangle, X } from 'lucide-react';

interface ConflictModalProps {
  existingTitle?: string;
  existingTime?: string;
  newTime?: string;
  onAdjust?: () => void;
  onOverride?: () => void;
  onClose?: () => void;
}

export default function ConflictModal({
  existingTitle = '原神 4.5 深渊攻略',
  existingTime = 'B站 今天 18:00',
  newTime = 'B站 今天 18:00',
  onAdjust,
  onOverride,
  onClose,
}: ConflictModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-card relative w-full max-w-sm rounded-xl p-6">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gaming-warning/30 bg-gaming-warning/10">
            <AlertTriangle className="h-5 w-5 text-gaming-warning" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">排程冲突</h3>
            <p className="text-xs text-muted-foreground">同一平台同时段已有排程</p>
          </div>
        </div>

        {/* Conflict detail */}
        <div className="mb-4 space-y-2 rounded-lg bg-background/50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">已有排程</span>
            <span className="text-xs text-foreground">
              {existingTitle} · {existingTime}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">新排程</span>
            <span className="text-xs text-gaming-warning">{newTime}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onAdjust}
            className="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
          >
            调整时间
          </button>
          <button
            onClick={onOverride}
            className="flex-1 rounded-lg bg-gaming-warning/15 px-3 py-2 text-xs font-medium text-gaming-warning transition-colors hover:bg-gaming-warning/25"
          >
            覆盖排程
          </button>
        </div>
      </div>
    </div>
  );
}
