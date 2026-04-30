'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { BarChart3, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAnalyticsStore } from '@/lib/analytics-store';
import FanAnalysis from '@/components/analytics/fan-analysis';
import ContentPerformance from '@/components/analytics/content-performance';
import EngagementMetrics from '@/components/analytics/engagement-metrics';
import PlatformComparison from '@/components/analytics/platform-comparison';
import CompetitorBenchmarking from '@/components/analytics/competitor-benchmarking';
import CreatorComparison from '@/components/analytics/creator-comparison';
import RevenueAnalysis from '@/components/analytics/revenue-analysis';

const TABS = [
  { id: 'fans', label: '粉丝分析', icon: '📈' },
  { id: 'content', label: '内容表现', icon: '🎬' },
  { id: 'engagement', label: '互动指标', icon: '💬' },
  { id: 'platform', label: '跨平台对比', icon: '🌐' },
  { id: 'competitor', label: '竞品对标', icon: '🏆' },
  { id: 'creator', label: '博主对比', icon: '📊' },
  { id: 'revenue', label: '收入分析', icon: '💰' },
];

const PLATFORM_OPTIONS = [
  { value: 'all', label: '全部平台' },
  { value: 'bilibili', label: 'B站' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'douyin', label: '抖音' },
];

/* ── A9: Skeleton loading ── */
function AnalyticsSkeleton() {
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
    </div>
  );
}

/* ── A9 + B1: Empty state when no data loaded ── */
function AnalyticsEmptyState({ onLoadDemo }: { onLoadDemo: () => void }) {
  return (
    <div className="glass-card rounded-xl p-12 text-center">
      <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground/30" />
      <h3 className="mt-4 text-sm font-semibold text-foreground">暂无分析数据</h3>
      <p className="mt-1 text-xs text-muted-foreground/55">
        连接 B站创作者账号后自动同步数据，或使用演示数据探索功能
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
  const { algorithmErrors, retryCompute } = useAnalyticsStore();
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

export default function AnalyticsPage() {
  const {
    selectedTab, setSelectedTab,
    selectedPlatform, setSelectedPlatform,
    loadMockData, loading,
    fanHistory, videoMetrics,
  } = useAnalyticsStore();

  const hasData = fanHistory.length > 0;

  // B5: check if current filter yields any results
  const filterHasResults = useMemo(() => {
    if (selectedPlatform === 'all') return true;
    return videoMetrics.some((v) => v.platform === selectedPlatform);
  }, [videoMetrics, selectedPlatform]);

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
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">数据分析</h1>
            <p className="text-xs text-muted-foreground/55">B站深度数据 · 7 维度分析</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Date range display */}
          <span className="text-[10px] text-muted-foreground/55 rounded-lg border border-border bg-background/30 px-3 py-1.5">
            2026-03-01 ~ 2026-04-30
          </span>
          {/* Platform filter */}
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="rounded-lg border border-border bg-background/30 px-3 py-1.5 text-[10px] text-foreground outline-none focus:border-gaming-purple/30"
          >
            {PLATFORM_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
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

      {/* B5: filter conflict — no results */}
      {hasData && !filterHasResults && (
        <div className="glass-card rounded-xl p-6 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-gaming-warning/40" />
          <p className="mt-2 text-sm font-medium text-gaming-warning">
            当前筛选无匹配结果
          </p>
          <p className="mt-1 text-xs text-muted-foreground/55">
            {selectedPlatform === 'bilibili' ? 'B站暂无数据' :
             selectedPlatform === 'youtube' ? 'YouTube暂无数据' :
             '抖音暂无数据'}
            ，请切换到其他平台或{'"全部平台"'}
          </p>
          <button
            onClick={() => setSelectedPlatform('all')}
            className="mt-3 rounded-lg border border-border bg-background/50 px-4 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"
          >
            清除筛选 · 查看全部
          </button>
        </div>
      )}

      {/* Tab content */}
      <div className="min-h-[500px]">
        {loading ? (
          <AnalyticsSkeleton />
        ) : !hasData ? (
          <AnalyticsEmptyState onLoadDemo={handleRefresh} />
        ) : !filterHasResults ? null : (
          <>
            {selectedTab === 'fans' && <FanAnalysis />}
            {selectedTab === 'content' && <ContentPerformance />}
            {selectedTab === 'engagement' && <EngagementMetrics />}
            {selectedTab === 'platform' && <PlatformComparison />}
            {selectedTab === 'competitor' && <CompetitorBenchmarking />}
            {selectedTab === 'creator' && <CreatorComparison />}
            {selectedTab === 'revenue' && <RevenueAnalysis />}
          </>
        )}
      </div>
    </div>
  );
}
