import { Video, Scissors, Send, Eye } from 'lucide-react';
import MetricCard from '@/components/dashboard/metric-card';
import PublishQueue from '@/components/dashboard/publish-queue';
import RecentActivity from '@/components/dashboard/recent-activity';
import QuickActions from '@/components/dashboard/quick-actions';
import DataOverview from '@/components/dashboard/data-overview';
import PublishCalendar from '@/components/dashboard/publish-calendar';

export default function DashboardPage() {
  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Welcome back, Player One
        </p>
      </div>

      {/* 4 Metric Cards with sparklines */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          title="To Record"
          value="3"
          change="+1 new idea"
          changeType="positive"
          icon={Video}
          sparkline={[2, 3, 2, 4, 3, 5, 3]}
        />
        <MetricCard
          title="To Edit"
          value="5"
          change="2 AI ready"
          changeType="positive"
          icon={Scissors}
          sparkline={[1, 3, 2, 4, 5, 6, 5]}
        />
        <MetricCard
          title="To Publish"
          value="3"
          change="1 needs action"
          changeType="negative"
          icon={Send}
          sparkline={[4, 3, 5, 3, 4, 2, 3]}
        />
        <MetricCard
          title="Weekly Views"
          value="128.5K"
          change="+12.3%"
          changeType="positive"
          icon={Eye}
          sparkline={[8, 12, 10, 15, 14, 19, 17]}
        />
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Main Grid: Queue + Data Overview + Activity + Calendar */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[1fr_1fr_340px]">
        <PublishQueue />
        <DataOverview />
        <div className="flex flex-col gap-4 lg:col-span-2 xl:col-span-1">
          <RecentActivity />
          <PublishCalendar />
        </div>
      </div>
    </div>
  );
}
