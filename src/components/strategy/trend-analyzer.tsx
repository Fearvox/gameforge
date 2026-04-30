'use client';

import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useStrategyStore } from '@/lib/strategy-store';

export default function TrendAnalyzer() {
  const {
    topicClusters, tagTrends, trendWindow, setTrendWindow,
    selectedTrendTag, setSelectedTrendTag, suggestions, algorithmErrors,
  } = useStrategyStore();
  const topicError = algorithmErrors.topicClusters;
  const trendError = algorithmErrors.tagTrends;

  const filteredSuggestions = useMemo(
    () => suggestions.filter((s) => s.type === 'topic' || s.type === 'keyword'),
    [suggestions],
  );

  const selectedTrend = useMemo(
    () => tagTrends.find((t) => t.tag === selectedTrendTag) ?? null,
    [tagTrends, selectedTrendTag],
  );

  const selectedData = useMemo(
    () =>
      selectedTrend
        ? (trendWindow === '7d' ? selectedTrend.data7d : selectedTrend.data30d)
        : [],
    [selectedTrend, trendWindow],
  );

  const maxVal = useMemo(
    () => Math.max(...selectedData.map((d) => d.value), 1),
    [selectedData],
  );

  return (
    <div className="space-y-4">
      {/* B4: algorithm errors */}
      {(topicError || trendError) && (
        <div className="rounded-lg border border-gaming-warning/20 bg-gaming-warning/6 p-2 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-gaming-warning" />
          <p className="text-[10px] text-gaming-warning">{topicError || trendError}</p>
        </div>
      )}

      {/* Topic clusters */}
      <div className="glass-card rounded-xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">话题聚类 TOP 10</h3>
          <span className="text-[10px] text-muted-foreground/55">按增长率排序</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {topicClusters.map((c) => (
            <div key={c.topic} className="rounded-lg border border-border bg-white/[0.02] p-3">
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-foreground">{c.topic}</p>
                <span className={`text-xs font-mono font-semibold ${
                  c.growthRate >= 0.5 ? 'text-gaming-success' :
                  c.growthRate >= 0 ? 'text-gaming-cyan' :
                  'text-gaming-error'
                }`}>
                  {c.growthRate >= 0 ? '+' : ''}{(c.growthRate * 100).toFixed(0)}%
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground/55">规模: {c.clusterSize}</span>
                <span className="text-[10px] text-muted-foreground/30">·</span>
                <span className="text-[10px] text-muted-foreground/55 truncate">
                  {c.relatedTags.join(', ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tag trend chart area */}
      <div className="glass-card rounded-xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">标签趋势</h3>
          <div className="flex items-center gap-2">
            <select
              value={selectedTrendTag ?? ''}
              onChange={(e) => setSelectedTrendTag(e.target.value || null)}
              className="rounded border border-border bg-background/30 px-2 py-0.5 text-[10px] text-foreground outline-none"
            >
              <option value="">选择标签</option>
              {tagTrends.map((t) => (
                <option key={t.tag} value={t.tag}>{t.tag}</option>
              ))}
            </select>
            <div className="flex rounded border border-border overflow-hidden">
              <button
                onClick={() => setTrendWindow('7d')}
                className={`px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
                  trendWindow === '7d' ? 'bg-gaming-purple/15 text-gaming-purple' : 'bg-background/30 text-muted-foreground/55'
                }`}
              >7d</button>
              <button
                onClick={() => setTrendWindow('30d')}
                className={`px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
                  trendWindow === '30d' ? 'bg-gaming-purple/15 text-gaming-purple' : 'bg-background/30 text-muted-foreground/55'
                }`}
              >30d</button>
            </div>
          </div>
        </div>
        {selectedTrend ? (
          <div className="h-[240px] w-full flex items-end gap-0.5">
            {selectedData.map((p) => {
              const heightPct = (p.value / maxVal) * 100;
              return (
                <div
                  key={p.date}
                  className="flex-1 rounded-t-sm transition-colors hover:bg-gaming-purple/60"
                  style={{
                    height: `${heightPct.toFixed(0)}%`,
                    backgroundColor: `rgba(168,85,247,${(0.3 + (heightPct / 200)).toFixed(2)})`,
                  }}
                  title={`${p.date}: ${p.value}`}
                />
              );
            })}
          </div>
        ) : (
          <div className="h-[240px] w-full flex items-center justify-center text-xs text-muted-foreground/55">
            选择一个标签查看趋势图
          </div>
        )}
      </div>

      {/* A5: Strategy suggestions */}
      <div className="glass-card rounded-xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">策略建议</h3>
          <span className="text-[10px] text-muted-foreground/55">自动生成 · 可溯源</span>
        </div>
        <div className="space-y-2">
          {filteredSuggestions.map((s) => (
            <div key={s.id} className="rounded-lg border border-border bg-white/[0.02] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-medium ${
                      s.targetModule === 'publish' ? 'bg-gaming-blue/15 text-gaming-blue' :
                      s.targetModule === 'cover' ? 'bg-gaming-purple/15 text-gaming-purple' :
                      'bg-gaming-cyan/15 text-gaming-cyan'
                    }`}>
                      → {s.targetModule === 'publish' ? '发布中心' : s.targetModule === 'cover' ? '封面工坊' : s.targetModule}
                    </span>
                    <span className="text-[10px] text-muted-foreground/55">置信度 {(s.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-foreground">{s.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground/55">{s.content}</p>
                  <p className="mt-1 text-[9px] text-muted-foreground/40 font-mono">来源: {s.sourceData}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
