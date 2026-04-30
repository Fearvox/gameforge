type Status =
  | 'scheduled'
  | 'draft'
  | 'pending'
  | 'publishing'
  | 'success'
  | 'failed'
  | 'needs-action';

interface StatusBadgeProps {
  status: Status;
  label: string;
}

const STYLES: Record<Status, string> = {
  scheduled: 'bg-gaming-success/15 text-gaming-success border-gaming-success/20',
  draft: 'bg-gaming-warning/15 text-gaming-warning border-gaming-warning/20',
  pending: 'bg-gaming-warning/15 text-gaming-warning border-gaming-warning/20',
  publishing:
    'bg-gaming-blue/15 text-gaming-blue border-gaming-blue/20 animate-pulse',
  success: 'bg-muted text-muted-foreground border-border',
  failed: 'bg-gaming-error/15 text-gaming-error border-gaming-error/20',
  'needs-action': 'bg-gaming-error/15 text-gaming-error border-gaming-error/20',
};

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {label}
    </span>
  );
}
