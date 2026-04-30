'use client';

import PlatformStatus from '@/components/publish/platform-status';
import PublishList from '@/components/publish/publish-list';
import PublishStats from '@/components/publish/publish-stats';
import BatchActions from '@/components/publish/batch-actions';
import EmptyState from '@/components/publish/empty-state';
import ErrorBanner from '@/components/publish/error-banner';
import ConflictModal from '@/components/publish/conflict-modal';
import { usePublishStore } from '@/lib/publish-store';
import { Plus } from 'lucide-react';

export default function PublishPage() {
  const { queue, error, conflict, createSchedule, dismissError, dismissConflict, overrideConflict } =
    usePublishStore();

  /** Demo: schedule a new item — will trigger conflict if same platform+time as existing */
  function handleNewSchedule() {
    createSchedule({
      id: `new-${Date.now()}`,
      title: '鸣潮 1.2 新角色预告',
      platform: 'B站 18:00 + YouTube 20:00',
      status: 'scheduled',
      statusLabel: '已排程',
      scheduledTime: '今天 18:00',
    });
  }

  // Empty state: no items in queue at all
  const isEmpty = queue.length === 0;

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header + new schedule button */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            发布中心
          </h1>
          <p className="text-sm text-muted-foreground">
            管理跨平台发布队列、排程与状态
          </p>
        </div>
        <button
          onClick={handleNewSchedule}
          className="flex items-center gap-1.5 rounded-lg gradient-gaming px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" />
          新建排程
        </button>
      </div>

      {/* Error banner — driven by store.error (B2 rate-limit, B3 idempotency) */}
      {error && <ErrorBanner message={error} onRetry={dismissError} />}

      {/* Platform status bar */}
      <PlatformStatus />

      {/* Main grid: queue + sidebar */}
      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-4">
          <div className="glass-card rounded-xl p-4">
            {isEmpty ? <EmptyState /> : <PublishList />}
          </div>
        </div>

        {/* Right: stats sidebar */}
        <div className="hidden xl:block">
          <PublishStats />
        </div>
      </div>

      {/* Bottom batch actions (hidden when empty) */}
      {!isEmpty && (
        <div className="hidden md:block">
          <BatchActions />
        </div>
      )}

      {/* Conflict modal — driven by store.conflict (B4 race condition) */}
      {conflict && (
        <ConflictModal
          onClose={dismissConflict}
          onAdjust={dismissConflict}
          onOverride={overrideConflict}
        />
      )}
    </div>
  );
}
