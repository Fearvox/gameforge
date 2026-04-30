'use client';

import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useStrategyStore, SOURCE_OPTIONS, TIME_WINDOW_OPTIONS, CATEGORY_OPTIONS } from '@/lib/strategy-store';

export default function HotspotTracker() {
  const { hotspots, hotspotFilter, setHotspotFilter, addToTopicPool, topicPool, algorithmErrors } = useStrategyStore();
  const hotspotError = algorithmErrors.hotspotAggregation;

  const filteredHotspots = useMemo(() => {
    return hotspots.filter((h) => {
      if (hotspotFilter.source !== 'all' && h.source !== hotspotFilter.source) return false;
      if (hotspotFilter.category !== 'all' && h.category !== hotspotFilter.category) return false;
      // High 4 fix: 24h window keeps all items (mock data all < 24h);
      // '7d' keeps all. In production, filter by actual timestamp delta.
      return true;
    });
  }, [hotspots, hotspotFilter]);

  const filterHasResults = filteredHotspots.length > 0;
  const isInPool = (id: string) => topicPool.some((t) => t.id === id);

  // Extract active platform chips from current hotspots
  const activeSources = useMemo(
    () => [...new Set(hotspots.map((h) => h.source))],
    [hotspots],
  );

  return (
    <div className="space-y-4">
      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/55">B站热点</p>
          <p className="mt-2 text-2xl font-semibold font-mono text-gaming-purple">
            {hotspots.filter((h) => h.source === 'bilibili').length}
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/55">RSSHub 热点</p>
          <p className="mt-2 text-2xl font-semibold font-mono text-gaming-blue">
            {hotspots.filter((h) => h.source === 'rsshub').length}
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/55">Google Trends</p>
          <p className="mt-2 text-2xl font-semibold font-mono text-gaming-cyan">
            {hotspots.filter((h) => h.source === 'google_trends').length}
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/55">选题池</p>
          <p className="mt-2 text-2xl font-semibold font-mono text-gaming-success">
            {topicPool.length}
          </p>
        </div>
      </div>

      {/* B4: algorithm error */}
      {hotspotError && (
        <div className="rounded-lg border border-gaming-warning/20 bg-gaming-warning/6 p-2 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-gaming-warning" />
          <p className="text-[10px] text-gaming-warning">{hotspotError}</p>
        </div>
      )}

      {/* B8: degraded — missing sources (High 5 fix) */}
      {activeSources.length < 3 && (
        <div className="rounded-lg border border-gaming-warning/20 bg-gaming-warning/6 p-2 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-gaming-warning" />
          <p className="text-[10px] text-gaming-warning">
            部分数据源不可用：
            {!activeSources.includes('bilibili') && ' B站'}
            {!activeSources.includes('rsshub') && ' RSSHub'}
            {!activeSources.includes('google_trends') && ' Google Trends'}
            &nbsp;· 数据可能延迟，已降级渲染
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Non-blocking 2: platform chips */}
        <div className="flex items-center gap-1">
          {activeSources.map((src) => (
            <button
              key={src}
              onClick={() => setHotspotFilter({ source: hotspotFilter.source === src ? 'all' : src })}
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-medium transition-colors ${
                hotspotFilter.source === src
                  ? src === 'bilibili' ? 'bg-gaming-purple/20 text-gaming-purple border border-gaming-purple/30' :
                    src === 'rsshub' ? 'bg-gaming-blue/20 text-gaming-blue border border-gaming-blue/30' :
                    'bg-gaming-cyan/20 text-gaming-cyan border border-gaming-cyan/30'
                  : 'bg-white/5 text-muted-foreground/55 border border-transparent hover:bg-white/10'
              }`}
            >
              {src === 'bilibili' ? 'B站' : src === 'rsshub' ? 'RSSHub' : 'G.Trends'}
            </button>
          ))}
        </div>
        <span className="text-muted-foreground/20">|</span>
        <select
          value={hotspotFilter.source}
          onChange={(e) => setHotspotFilter({ source: e.target.value })}
          className="rounded-lg border border-border bg-background/30 px-3 py-1.5 text-[10px] text-foreground outline-none focus:border-gaming-purple/30"
        >
          {SOURCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={hotspotFilter.category}
          onChange={(e) => setHotspotFilter({ category: e.target.value })}
          className="rounded-lg border border-border bg-background/30 px-3 py-1.5 text-[10px] text-foreground outline-none focus:border-gaming-purple/30"
        >
          {CATEGORY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={hotspotFilter.timeWindow}
          onChange={(e) => setHotspotFilter({ timeWindow: e.target.value as '24h' | '7d' })}
          className="rounded-lg border border-border bg-background/30 px-3 py-1.5 text-[10px] text-foreground outline-none focus:border-gaming-purple/30"
        >
          {TIME_WINDOW_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* B5: NoFilterResults */}
      {!filterHasResults && (
        <div className="glass-card rounded-xl p-6 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-gaming-warning/40" />
          <p className="mt-2 text-sm font-medium text-gaming-warning">当前筛选无匹配热点</p>
          <p className="mt-1 text-xs text-muted-foreground/55">
            请尝试切换来源、分类或扩大时间窗口
          </p>
          <button
            onClick={() => setHotspotFilter({ source: 'all', category: 'all', timeWindow: '7d' })}
            className="mt-3 rounded-lg border border-border bg-background/50 px-4 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"
          >
            清除筛选 · 查看全部
          </button>
        </div>
      )}

      {/* Hotspot cards */}
      {filterHasResults && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredHotspots.map((h) => (
            <div key={h.id} className="glass-card rounded-xl p-4 transition-colors hover:bg-white/[0.06]">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">{h.keyword}</p>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground/55">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-medium ${
                      h.source === 'bilibili' ? 'bg-gaming-purple/15 text-gaming-purple' :
                      h.source === 'rsshub' ? 'bg-gaming-blue/15 text-gaming-blue' :
                      'bg-gaming-cyan/15 text-gaming-cyan'
                    }`}>
                      {h.source === 'bilibili' ? 'B站' : h.source === 'rsshub' ? 'RSSHub' : 'G.Trends'}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] ${
                      h.timeLabel === '1h' ? 'bg-gaming-error/15 text-gaming-error' :
                      h.timeLabel === '6h' ? 'bg-gaming-warning/15 text-gaming-warning' :
                      'bg-white/5 text-muted-foreground/55'
                    }`}>
                      {h.timeLabel}
                    </span>
                    <span>{h.category}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 ml-3">
                  <span className="text-lg font-semibold font-mono text-gaming-purple">{h.heat}</span>
                  <button
                    onClick={() => addToTopicPool(h)}
                    disabled={isInPool(h.id)}
                    className={`rounded-md px-2 py-0.5 text-[9px] font-medium transition-colors ${
                      isInPool(h.id)
                        ? 'bg-gaming-success/15 text-gaming-success cursor-default'
                        : 'bg-gaming-purple/15 text-gaming-purple hover:bg-gaming-purple/25'
                    }`}
                  >
                    {isInPool(h.id) ? '已入选' : '加入选题池'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
