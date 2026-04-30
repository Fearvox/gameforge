'use client';

import { AlertTriangle, RotateCw } from 'lucide-react';

interface ErrorBannerProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorBanner({
  message = '网络异常，无法拉取发布队列',
  onRetry,
}: ErrorBannerProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gaming-error/30 bg-gaming-error/10 px-4 py-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-gaming-error" />
        <span className="text-sm text-gaming-error">{message}</span>
      </div>
      <button
        onClick={onRetry}
        className="flex items-center gap-1 rounded-md bg-gaming-error/15 px-3 py-1 text-xs font-medium text-gaming-error transition-colors hover:bg-gaming-error/25"
      >
        <RotateCw className="h-3 w-3" />
        重试
      </button>
    </div>
  );
}
