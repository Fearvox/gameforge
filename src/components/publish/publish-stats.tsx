'use client';

import { useMemo } from 'react';
import { CalendarDays, BarChart3, AlertTriangle, RotateCw } from 'lucide-react';
import { usePublishStore } from '@/lib/publish-store';

/* ── Week calendar ── */
interface CalDay {
  day: string;
  date: number;
  events: { title: string; platform: string }[];
  isToday?: boolean;
}

const WEEK: CalDay[] = [
  { day: '一', date: 28, events: [{ title: '原神 4.5', platform: 'B站' }] },
  { day: '二', date: 29, events: [], isToday: true },
  { day: '三', date: 30, events: [{ title: 'ZZZ 测评', platform: 'YouTube' }] },
  { day: '四', date: 1, events: [] },
  { day: '五', date: 2, events: [{ title: '鸣潮', platform: 'B站' }] },
  { day: '六', date: 3, events: [] },
  { day: '日', date: 4, events: [] },
];

function MiniCalendar() {
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="mb-3 flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-gaming-purple" />
        <h3 className="text-sm font-semibold text-foreground">排程概览</h3>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {WEEK.map((d) => (
          <div key={d.day} className="text-center text-[10px] font-medium text-muted-foreground pb-1">
            {d.day}
          </div>
        ))}
        {WEEK.map((d) => (
          <div
            key={d.date}
            className={`flex flex-col items-center gap-0.5 rounded-lg p-1 min-h-[48px] ${
              d.isToday
                ? 'border border-gaming-purple/40 bg-gaming-purple/10'
                : 'bg-background/30'
            }`}
          >
            <span
              className={`text-xs font-mono ${
                d.isToday ? 'text-gaming-purple font-semibold' : 'text-muted-foreground'
              }`}
            >
              {d.date}
            </span>
            {d.events.map((ev) => (
              <div
                key={ev.title}
                className="w-full rounded bg-gaming-blue/15 px-1 py-0.5 text-[9px] font-medium text-gaming-blue text-center truncate"
                title={`${ev.title} → ${ev.platform}`}
              >
                {ev.platform.slice(0, 2)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Stats (live from store) ── */

function StatsPanel() {
  const { queue } = usePublishStore();

  const stats = useMemo(() => {
    const published = queue.filter((q) => q.status === 'success').length;
    const pending = queue.filter(
      (q) => q.status === 'scheduled' || q.status === 'pending' || q.status === 'publishing',
    ).length;
    const action = queue.filter(
      (q) => q.status === 'needs-action' || q.status === 'failed',
    ).length;
    return [
      { label: '已发布', value: published, color: 'text-gaming-success' },
      { label: '待发布', value: pending, color: 'text-gaming-blue' },
      { label: '需处理', value: action, color: 'text-gaming-error' },
    ];
  }, [queue]);

  return (
    <div className="glass-card rounded-xl p-4">
      <div className="mb-3 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-gaming-blue" />
        <h3 className="text-sm font-semibold text-foreground">发布统计</h3>
      </div>
      <div className="space-y-2">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{s.label}</span>
            <span className={`text-sm font-semibold font-mono ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Failure analysis (live from store) ── */

function FailureAnalysis() {
  const { queue, reauthorizeItem, retryItem } = usePublishStore();

  const failures = useMemo(
    () => queue.filter((q) => q.status === 'needs-action' || q.status === 'failed'),
    [queue],
  );

  if (failures.length === 0) return null;

  return (
    <div className="glass-card rounded-xl p-4">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-gaming-error" />
        <h3 className="text-sm font-semibold text-foreground">失败分析</h3>
      </div>
      <div className="space-y-2">
        {failures.map((f) => {
          // needs-action → reauthorize (OAuth recovery)
          // failed → retry (publish retry)
          const isOAuth = f.status === 'needs-action';
          const actionLabel = isOAuth ? (f.cta ?? '重新授权') : '重试';
          const handleClick = isOAuth
            ? () => reauthorizeItem(f.id)
            : () => retryItem(f.id);

          return (
            <div
              key={f.id}
              className="flex items-center justify-between rounded-lg bg-background/50 px-3 py-2"
            >
              <span className="text-xs text-muted-foreground">
                {f.failReason ?? f.statusReason}
              </span>
              <button
                onClick={handleClick}
                className="flex items-center gap-1 text-xs font-medium text-gaming-error hover:underline"
              >
                <RotateCw className="h-3 w-3" />
                {actionLabel}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Export ── */
export default function PublishStats() {
  return (
    <div className="flex flex-col gap-4">
      <MiniCalendar />
      <StatsPanel />
      <FailureAnalysis />
    </div>
  );
}
