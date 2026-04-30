'use client';

import { useEffect, useCallback } from 'react';
import { Lightbulb, RefreshCw } from 'lucide-react';
import { useStrategyStore } from '@/lib/strategy-store';
import HotspotTracker from '@/components/strategy/hotspot-tracker';
import TimeRecommender from '@/components/strategy/time-recommender';
import ABTesting from '@/components/strategy/ab-testing';
import TrendAnalyzer from '@/components/strategy/trend-analyzer';

const TABS = [
  { id: 'hotspots', label: '热点追踪', icon: '🔥' },
  { id: 'time', label: '发布时间推荐', icon: '⏰' },
  { id: 'abtest', label: 'AB 测试', icon: '🧪' },
  { id: 'trend', label: '趋势分析', icon: '📈' },
];

/* ── A9: Skeleton loading ── */
function StrategySkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card rounded-xl p-4">
            <div className="mb-2 h-3 w-16 rounded bg-white/5" />
            <div className="h-8 w-24 rounded bg-white/5" />
          </div>
        ))}
      </div>
      <div className="glass-card rounded-xl p-4">
        <div className="mb-3 h-4 w-32 rounded bg-white/5" />
        <div className="h-[320px] rounded bg-white/[0.02]" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="glass-card rounded-xl p-4">
          <div className="mb-3 h-4 w-32 rounded bg-white/5" />
          <div className="h-[200px] rounded bg-white/[0.02]" />
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="mb-3 h-4 w-32 rounded bg-white/5" />
          <div className="h-[200px] rounded bg-white/[0.02]" />
        </div>
      </div>
    </div>
  );
}

/* ── B1: Empty state ── */
function StrategyEmptyState({ onLoadDemo }: { onLoadDemo: () => void }) {
  return (
    <div className="glass-card rounded-xl p-12 text-center">
      <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground/30" />
      <h3 className="mt-4 text-sm font-semibold text-foreground">暂无策略数据</h3>
      <p className="mt-1 text-xs text-muted-foreground/55">
        连接 B站创作者账号后自动同步数据，或使用演示数据探索策略引擎
      </p>
      <div className="mt-4 flex items-center justify-center gap-3">
        <button className="rounded-lg border border-border bg-background/50 px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent">
          🔗 连接B站账号
        </button>
        <button
          onClick={onLoadDemo}
          className="rounded-lg gradient-gaming px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
        >
          加载演示数据
        </button>
      </div>
    </div>
  );
}

/* ── B4: Algorithm error banner ── */
function AlgorithmErrorBanner() {
  const { algorithmErrors, retryCompute } = useStrategyStore();
  const errorEntries = Object.entries(algorithmErrors).filter(([, v]) => v !== null);

  if (errorEntries.length === 0) return null;

  return (
    <div className="rounded-lg border border-gaming-warning/20 bg-gaming-warning/6 p-3">
      <p className="text-xs font-medium text-gaming-warning">
        ⚠ 部分计算出现异常（{errorEntries.length} 项）
      </p>
      <div className="mt-1.5 space-y-1">
        {errorEntries.map(([key, msg]) => (
          <div key={key} className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground/55 min-w-[60px]">{key}</span>
            <span className="flex-1 text-[9px] text-gaming-warning/80 truncate">{msg}</span>
            <button
              onClick={() => retryCompute(key)}
              className="shrink-0 text-[9px] font-medium text-gaming-warning hover:underline"
            >
              重新计算
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function StrategyPage() {
  const {
    selectedTab, setSelectedTab,
    loadMockData, loading,
    hotspots,
  } = useStrategyStore();

  const hasData = hotspots.length > 0;

  /* Auto-load demo data on mount */
  useEffect(() => {
    loadMockData();
  }, [loadMockData]);

  const handleRefresh = useCallback(() => {
    loadMockData();
  }, [loadMockData]);

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl gradient-gaming flex items-center justify-center">
            <Lightbulb className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">内容策略</h1>
            <p className="text-xs text-muted-foreground/55">热点追踪 · 时间推荐 · AB 测试 · 趋势分析</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground/55 rounded-lg border border-border bg-background/30 px-3 py-1.5">
            B站 · RSSHub · Google Trends
          </span>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1 rounded-lg border border-border bg-background/30 px-3 py-1.5 text-[10px] text-muted-foreground/55 transition-colors hover:text-foreground"
          >
            <RefreshCw className="h-3 w-3" />
            刷新
          </button>
        </div>
      </div>

      {/* B4: algorithm error banner */}
      <AlgorithmErrorBanner />

      {/* Tab bar */}
      {hasData && (
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-all ${
                selectedTab === tab.id
                  ? 'bg-gaming-purple/15 border border-gaming-purple/30 text-gaming-purple'
                  : 'bg-background/50 border border-transparent text-muted-foreground/55 hover:text-foreground'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Tab content */}
      <div className="min-h-[500px]">
        {loading ? (
          <StrategySkeleton />
        ) : !hasData ? (
          <StrategyEmptyState onLoadDemo={handleRefresh} />
        ) : (
          <>
            {selectedTab === 'hotspots' && <HotspotTracker />}
            {selectedTab === 'time' && <TimeRecommender />}
            {selectedTab === 'abtest' && <ABTesting />}
            {selectedTab === 'trend' && <TrendAnalyzer />}
          </>
        )}
      </div>
    </div>
  );
}
