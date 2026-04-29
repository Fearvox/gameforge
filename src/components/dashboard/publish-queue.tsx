import StatusBadge from './status-badge';

interface QueueItem {
  id: string;
  title: string;
  platform: string;
  status: 'scheduled' | 'draft' | 'needs-action';
  statusLabel: string;
  scheduledTime?: string;
  cta?: string;
}

const MOCK_QUEUE: QueueItem[] = [
  {
    id: '1',
    title: '原神 4.5 深渊攻略',
    platform: 'Bilibili',
    status: 'scheduled',
    statusLabel: 'Scheduled',
    scheduledTime: 'Today 18:00',
  },
  {
    id: '2',
    title: '崩铁 2.3 新角色测评',
    platform: 'Douyin',
    status: 'draft',
    statusLabel: 'Draft',
  },
  {
    id: '3',
    title: 'ZZZ First Day Experience',
    platform: 'YouTube',
    status: 'needs-action',
    statusLabel: 'Needs Action',
    cta: 'Re-authorize',
  },
];

export default function PublishQueue() {
  const completed = MOCK_QUEUE.filter((q) => q.status === 'scheduled').length;

  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Publish Queue</h3>
        <span className="text-xs text-muted-foreground font-mono">
          {completed}/{MOCK_QUEUE.length} done
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-1.5 w-full rounded-full bg-muted">
        <div
          className="h-full rounded-full gradient-gaming transition-all"
          style={{ width: `${(completed / MOCK_QUEUE.length) * 100}%` }}
        />
      </div>

      {/* Queue items */}
      <div className="space-y-2">
        {MOCK_QUEUE.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-lg bg-background/50 px-3 py-2.5"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {item.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {item.platform}
                {item.scheduledTime && ` · ${item.scheduledTime}`}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={item.status} label={item.statusLabel} />
              {item.cta && (
                <button className="text-xs font-medium text-gaming-error hover:underline">
                  {item.cta}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
