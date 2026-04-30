'use client';

import { Rocket } from 'lucide-react';

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gaming-purple/10">
        <Rocket className="h-8 w-8 text-gaming-purple" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">还没有发布任务</p>
        <p className="mt-1 text-xs text-muted-foreground">
          去创建一个？
        </p>
      </div>
      <button className="rounded-full gradient-gaming px-5 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90">
        前往剪辑工作台
      </button>
    </div>
  );
}
