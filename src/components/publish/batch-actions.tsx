'use client';

import { CalendarClock, Trash2, Download } from 'lucide-react';

interface Action {
  label: string;
  icon: typeof CalendarClock;
  variant: 'default' | 'danger';
}

const ACTIONS: Action[] = [
  { label: '批量排程', icon: CalendarClock, variant: 'default' },
  { label: '批量删除', icon: Trash2, variant: 'danger' },
  { label: '导出 CSV', icon: Download, variant: 'default' },
];

export default function BatchActions() {
  return (
    <div className="glass-card flex items-center justify-between rounded-xl px-4 py-3">
      <span className="text-xs text-muted-foreground">已选 0 项</span>
      <div className="flex gap-2">
        {ACTIONS.map(({ label, icon: Icon, variant }) => (
          <button
            key={label}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              variant === 'danger'
                ? 'text-gaming-error hover:bg-gaming-error/10'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
