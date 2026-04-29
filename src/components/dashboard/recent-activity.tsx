import { CheckCircle, Cpu, Clock } from 'lucide-react';

interface Activity {
  id: string;
  title: string;
  time: string;
  type: 'published' | 'ai-complete' | 'pending';
}

const MOCK_ACTIVITIES: Activity[] = [
  { id: '1', title: '原神 4.4 全角色强度榜 已发布到 Bilibili', time: '2h ago', type: 'published' },
  { id: '2', title: 'AI 已完成: 鸣潮高光片段切割 (12 clips)', time: '4h ago', type: 'ai-complete' },
  { id: '3', title: '待确认: 绝区零封面模板 v3', time: '6h ago', type: 'pending' },
];

const TYPE_CONFIG = {
  published: { icon: CheckCircle, color: 'text-gaming-success', bg: 'bg-gaming-success/15' },
  'ai-complete': { icon: Cpu, color: 'text-gaming-blue', bg: 'bg-gaming-blue/15' },
  pending: { icon: Clock, color: 'text-gaming-warning', bg: 'bg-gaming-warning/15' },
};

export default function RecentActivity() {
  return (
    <div className="glass-card rounded-xl p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Recent Activity</h3>
      <div className="space-y-3">
        {MOCK_ACTIVITIES.map((act) => {
          const config = TYPE_CONFIG[act.type];
          const Icon = config.icon;
          return (
            <div key={act.id} className="flex items-start gap-3">
              <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${config.bg}`}>
                <Icon className={`h-3 w-3 ${config.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground leading-snug">{act.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{act.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
