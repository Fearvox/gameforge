'use client';

import { useMemo, useState } from 'react';
import { Users, BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';
import { useAnalyticsStore } from '@/lib/analytics-store';

export default function CreatorComparison() {
  const { percentileBuckets, competitors, algorithmErrors } = useAnalyticsStore();
  const [mode, setMode] = useState<'vertical' | 'horizontal'>('vertical');
  const percentileError = algorithmErrors.percentile;

  /* Split competitors by vertical/horizontal */
  const vertical = useMemo(
    () => competitors.filter((c) => c.isVertical),
    [competitors],
  );
  const horizontal = useMemo(
    () => competitors.filter((c) => !c.isVertical),
    [competitors],
  );
  const activeList = mode === 'vertical' ? vertical : horizontal;

  const youAreHereBucket = percentileBuckets.find((b) => b.youAreHere);
  const totalCompetitors = activeList.length;

  const bucketColors = [
    'border-gaming-cyan/30 bg-gaming-cyan/10',
    'border-gaming-purple/30 bg-gaming-purple/10',
    'border-gaming-blue/20 bg-gaming-blue/10',
    'border-white/5 bg-white/[0.02]',
  ];

  return (
    <div className="space-y-4">
      {/* B3/B4: error handling */}
      {percentileError && (
        <div className="rounded-lg border border-gaming-warning/20 bg-gaming-warning/6 p-2 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-gaming-warning" />
          <p className="text-[10px] text-gaming-warning">{percentileError}</p>
        </div>
      )}

      {/* Mode toggle */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground/55">对比模式:</span>
        <button
          onClick={() => setMode('vertical')}
          className={`rounded-full px-3 py-1 text-[10px] font-medium transition-all ${
            mode === 'vertical'
              ? 'bg-gaming-purple/15 border border-gaming-purple/30 text-gaming-purple'
              : 'bg-background/50 border border-transparent text-muted-foreground/55 hover:text-foreground'
          }`}
        >
          <TrendingUp className="inline h-3 w-3 mr-1" />
          垂直对比（同品类）
        </button>
        <button
          onClick={() => setMode('horizontal')}
          className={`rounded-full px-3 py-1 text-[10px] font-medium transition-all ${
            mode === 'horizontal'
              ? 'bg-gaming-blue/15 border border-gaming-blue/30 text-gaming-blue'
              : 'bg-background/50 border border-transparent text-muted-foreground/55 hover:text-foreground'
          }`}
        >
          <BarChart3 className="inline h-3 w-3 mr-1" />
          水平对比（同量级）
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground/55" />
            <p className="text-xs font-medium text-muted-foreground/55">
              {mode === 'vertical' ? '同品类博主' : '同量级博主'}
            </p>
          </div>
          <p className="mt-2 text-2xl font-semibold font-mono text-foreground">{totalCompetitors} 人</p>
        </div>
        <div className="glass-card rounded-xl p-4 border border-gaming-cyan/20">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gaming-cyan" />
            <p className="text-xs font-medium text-gaming-cyan">你的位置</p>
          </div>
          <p className="mt-2 text-2xl font-semibold font-mono text-gaming-cyan">
            {youAreHereBucket ? youAreHereBucket.label : '未归类'}
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-gaming-purple" />
            <p className="text-xs font-medium text-muted-foreground/55">自有粉丝</p>
          </div>
          <p className="mt-2 text-2xl font-semibold font-mono text-gaming-purple">
            128.5K
          </p>
        </div>
      </div>

      {/* Percentile buckets */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {percentileBuckets.map((bucket, i) => (
          <div
            key={bucket.label}
            className={`glass-card rounded-xl p-4 border ${bucketColors[i] || bucketColors[3]} ${
              bucket.youAreHere ? 'ring-1 ring-gaming-cyan/40' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-foreground">{bucket.label}</p>
              {bucket.youAreHere && (
                <span className="rounded-full bg-gaming-cyan/15 px-2 py-0.5 text-[9px] font-medium text-gaming-cyan">
                  你在这里
                </span>
              )}
            </div>
            <p className="mt-1.5 text-[10px] text-muted-foreground/55">
              {(bucket.min / 10000).toFixed(1)}万 ~ {(bucket.max / 10000).toFixed(1)}万
            </p>
            <div className="mt-2 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${((bucket.count / Math.max(1, totalCompetitors)) * 100).toFixed(0)}%`,
                  background: bucket.youAreHere
                    ? 'linear-gradient(90deg, rgba(6,182,212,0.6), rgba(6,182,212,0.3))'
                    : 'linear-gradient(90deg, rgba(168,85,247,0.4), rgba(168,85,247,0.1))',
                }}
              />
            </div>
            <p className="mt-1.5 text-[9px] text-muted-foreground/55">{bucket.count} 人</p>
          </div>
        ))}
      </div>

      {/* Competitor list by current mode */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          {mode === 'vertical' ? '同品类' : '同量级'}UP主列表
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground/55">
                <th className="py-1.5 font-medium">UP主</th>
                <th className="py-1.5 font-medium">品类</th>
                <th className="py-1.5 font-medium text-right">粉丝</th>
                <th className="py-1.5 font-medium text-right">周均播放</th>
                <th className="py-1.5 font-medium text-right">发布频率/月</th>
              </tr>
            </thead>
            <tbody>
              {activeList.map((c) => (
                <tr key={c.id} className="border-b border-border/50">
                  <td className="py-1.5 text-foreground font-medium">{c.name}</td>
                  <td className="py-1.5 text-muted-foreground/55">{c.category}</td>
                  <td className="py-1.5 text-right font-mono text-gaming-purple">
                    {(c.fanCount / 10000).toFixed(1)}万
                  </td>
                  <td className="py-1.5 text-right font-mono text-gaming-blue">
                    {(c.avgViews7d / 10000).toFixed(1)}万
                  </td>
                  <td className="py-1.5 text-right font-mono text-muted-foreground/55">
                    {c.publishFreq} 期
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
