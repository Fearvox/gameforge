import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  sparkline?: number[];
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 20;
  const w = 60;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(' ');
  return (
    <svg width={w} height={h} className="opacity-60">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export default function MetricCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  sparkline,
}: MetricCardProps) {
  const changeColor =
    changeType === 'positive'
      ? 'text-gaming-success'
      : changeType === 'negative'
        ? 'text-gaming-error'
        : 'text-muted-foreground';

  const sparkColor =
    changeType === 'positive'
      ? '#22c55e'
      : changeType === 'negative'
        ? '#ef4444'
        : '#a855f7';

  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-2 flex items-end justify-between">
        <p className="text-2xl font-semibold font-mono tracking-tight text-foreground">
          {value}
        </p>
        {sparkline && <MiniSparkline data={sparkline} color={sparkColor} />}
      </div>
      {change && (
        <p className={`mt-1 text-xs font-medium ${changeColor}`}>{change}</p>
      )}
    </div>
  );
}
