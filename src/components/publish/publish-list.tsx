'use client';

import { RotateCw, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import StatusBadge from '@/components/dashboard/status-badge';
import { usePublishStore, type QueueItem, type FilterKey } from '@/lib/publish-store';

/* ── filter config ── */

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待发布' },
  { key: 'published', label: '已发布' },
  { key: 'action', label: '需处理' },
];

function filterQueue(items: QueueItem[], filter: FilterKey): QueueItem[] {
  switch (filter) {
    case 'pending':
      return items.filter((i) => i.status === 'scheduled' || i.status === 'pending');
    case 'published':
      return items.filter((i) => i.status === 'success');
    case 'action':
      return items.filter((i) => i.status === 'needs-action');
    default:
      return items;
  }
}

/* ── sub-components ── */

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="mt-1.5 flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gaming-blue transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-[10px] font-mono text-gaming-blue">{value}%</span>
    </div>
  );
}

function QueueRow({
  item,
  onReauthorize,
  onRetry,
}: {
  item: QueueItem;
  onReauthorize: (id: string) => void;
  onRetry: (id: string) => void;
}) {
  const isDim = item.status === 'success';

  return (
    <div
      className={`flex items-start justify-between rounded-lg px-3 py-3 transition-colors ${
        isDim ? 'bg-background/30 opacity-60' : 'bg-background/50 hover:bg-accent/50'
      }`}
    >
      {/* Left: title + meta */}
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-medium ${
            isDim ? 'text-muted-foreground' : 'text-foreground'
          }`}
        >
          {item.title}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{item.platform}</p>

        {/* Publishing progress bar */}
        {item.status === 'publishing' && item.progress !== undefined && (
          <ProgressBar value={item.progress} />
        )}

        {/* Failure reason hint */}
        {item.failReason && (
          <p className="mt-1 text-xs text-gaming-error/80">{item.failReason}</p>
        )}

        {/* Completed ago */}
        {item.completedAgo && (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground/70">
            <Clock className="h-3 w-3" />
            {item.completedAgo}
          </p>
        )}
      </div>

      {/* Right: badge + CTA */}
      <div className="flex shrink-0 flex-col items-end gap-1.5 pl-3">
        <StatusBadge status={item.status} label={item.statusLabel} />

        {/* needs-action: reauthorize CTA */}
        {item.status === 'needs-action' && item.cta && (
          <button
            onClick={() => onReauthorize(item.id)}
            className="flex items-center gap-1 rounded-md bg-gaming-error/10 px-2.5 py-1 text-xs font-medium text-gaming-error transition-colors hover:bg-gaming-error/20"
          >
            <RotateCw className="h-3 w-3" />
            {item.cta}
          </button>
        )}

        {/* failed: retry CTA */}
        {item.status === 'failed' && (
          <button
            onClick={() => onRetry(item.id)}
            className="flex items-center gap-1 rounded-md bg-gaming-error/10 px-2.5 py-1 text-xs font-medium text-gaming-error transition-colors hover:bg-gaming-error/20"
          >
            <RotateCw className="h-3 w-3" />
            重试
          </button>
        )}

        {item.status === 'publishing' && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-gaming-blue" />
        )}

        {item.status === 'success' && (
          <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground/50" />
        )}
      </div>
    </div>
  );
}

/* ── main ── */

export default function PublishList() {
  const { queue, activeFilter, setFilter, reauthorizeItem, retryItem } =
    usePublishStore();
  const items = filterQueue(queue, activeFilter);

  return (
    <div className="flex flex-col gap-3">
      {/* Filter tabs — interactive via store */}
      <div className="flex gap-1">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              key === activeFilter
                ? 'bg-gaming-purple/15 text-gaming-purple'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Queue list */}
      {items.length === 0 ? (
        <div className="py-6 text-center text-xs text-muted-foreground">
          当前筛选条件下暂无任务
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <QueueRow
              key={item.id}
              item={item}
              onReauthorize={reauthorizeItem}
              onRetry={retryItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}
