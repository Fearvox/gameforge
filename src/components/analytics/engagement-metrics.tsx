'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  BarChart, Bar, XAxis, YAxis,
  ResponsiveContainer, Tooltip, CartesianGrid,
} from 'recharts';
import { MessageCircle, Heart, Send, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useAnalyticsStore } from '@/lib/analytics-store';

/* ── Hot words tag cloud ── */
function WordCloud() {
  const { hotWords } = useAnalyticsStore();

  if (hotWords.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-muted-foreground/55">暂无热词数据</p>
    );
  }

  const maxTfidf = hotWords[0]?.tfidf ?? 1;

  return (
    <div className="flex flex-wrap gap-2">
      {hotWords.map((w) => {
        const ratio = maxTfidf > 0 ? (w.tfidf ?? 0) / maxTfidf : 0;
        const opacity = 0.15 + ratio * 0.2;
        const textOpacity = 0.55 + ratio * 0.45; // >= 0.55 per design suggestion
        const fontSize = 0.65 + ratio * 0.55; // rem

        return (
          <span
            key={w.word}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1 font-medium transition-colors hover:bg-gaming-purple/20 cursor-default"
            style={{
              backgroundColor: `rgba(168,85,247,${opacity.toFixed(2)})`,
              color: `rgba(255,255,255,${textOpacity.toFixed(2)})`,
              fontSize: `${fontSize.toFixed(2)}rem`,
            }}
            title={`频次: ${w.count} · TF-IDF: ${(w.tfidf ?? 0).toFixed(2)}`}
          >
            {w.word}
            <span className="text-[0.6em] opacity-50">{(w.tfidf ?? 0).toFixed(1)}</span>
          </span>
        );
      })}
    </div>
  );
}

/* ── Funnel visualization ── */
function FunnelChartInner() {
  const { funnelSteps, videoMetrics, computeFunnel, selectedPlatform } = useAnalyticsStore();
  const [selectedIdx, setSelectedIdx] = useState(0);

  // High 1: filter video list by platform for funnel selector
  const filteredVideos = useMemo(
    () =>
      selectedPlatform === 'all'
        ? videoMetrics
        : videoMetrics.filter((v) => v.platform === selectedPlatform),
    [videoMetrics, selectedPlatform],
  );

  const data = useMemo(
    () =>
      funnelSteps.map((s) => ({
        name: s.label,
        count: s.count,
        rate: s.rate,
      })),
    [funnelSteps],
  );

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="space-y-3">
      {/* Video selector */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground/55">分析视频:</span>
        <select
          value={selectedIdx}
          onChange={(e) => {
            const idx = Number(e.target.value);
            setSelectedIdx(idx);
            const vid = filteredVideos[idx]?.id;
            if (vid) computeFunnel(vid);
          }}
          className="rounded border border-border bg-background/30 px-2 py-0.5 text-[10px] text-foreground outline-none"
        >
          {filteredVideos.slice(0, 10).map((v, i) => (
            <option key={v.id} value={i}>
              {v.title}
            </option>
          ))}
        </select>
      </div>

      {/* Horizontal funnel bars */}
      <div className="space-y-1.5">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-3">
            <span className="w-10 shrink-0 text-[10px] text-muted-foreground/55">{d.name}</span>
            <div className="flex-1 h-6 rounded bg-white/[0.03] overflow-hidden relative">
              <div
                className="h-full rounded transition-all"
                style={{
                  width: `${((d.count / maxCount) * 100).toFixed(0)}%`,
                  background: d.name === '曝光' ? 'rgba(168,85,247,0.25)' :
                              d.name === '点击' ? 'rgba(59,130,246,0.25)' :
                              d.name === '完播' ? 'rgba(6,182,212,0.25)' :
                              'rgba(34,197,94,0.25)',
                }}
              />
              <span className="absolute inset-0 flex items-center px-2 text-[10px] font-mono text-foreground">
                {d.count.toLocaleString()}
              </span>
            </div>
            <span className="w-12 shrink-0 text-right text-[10px] font-mono text-muted-foreground/55">
              {(d.rate * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const FunnelChart = dynamic(() => Promise.resolve(FunnelChartInner), { ssr: false });

/* ── Danmaku frequency chart ── */
function DanmakuChartInner() {
  const { engagements } = useAnalyticsStore();

  const data = useMemo(
    () =>
      [...engagements]
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-10)
        .map((e) => ({
          date: e.date.slice(5),
          danmaku: e.danmakuCount,
          comments: e.commentCount,
        })),
    [engagements],
  );

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 10 }}
          tickLine={false} axisLine={false}
        />
        <YAxis tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 10 }}
          tickLine={false} axisLine={false}
        />
        <Tooltip contentStyle={{
          background: '#0a0b0f', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px', fontSize: '12px', color: '#fff',
        }} />
        <Bar dataKey="danmaku" fill="#a855f7" radius={[4, 4, 0, 0]} name="弹幕" />
        <Bar dataKey="comments" fill="#3b82f6" radius={[4, 4, 0, 0]} name="评论" />
      </BarChart>
    </ResponsiveContainer>
  );
}

const DanmakuChart = dynamic(() => Promise.resolve(DanmakuChartInner), { ssr: false });

export default function EngagementMetrics() {
  const { hotWords, engagements, algorithmErrors } = useAnalyticsStore();
  const [showTechDetails, setShowTechDetails] = useState(false);

  const totalDanmaku = useMemo(() => engagements.reduce((s, e) => s + e.danmakuCount, 0), [engagements]);
  const totalComments = useMemo(() => engagements.reduce((s, e) => s + e.commentCount, 0), [engagements]);
  const avgLikeRate = useMemo(() => {
    if (engagements.length === 0) return 0;
    return engagements.reduce((s, e) => s + e.likeCount, 0) / engagements.length;
  }, [engagements]);

  const wordError = algorithmErrors.hotWords;

  return (
    <div className="space-y-4">
      {/* Metrics row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-muted-foreground/55" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/55">总弹幕</p>
          </div>
          <p className="mt-2 text-2xl font-semibold font-mono text-gaming-purple">
            {(totalDanmaku / 1000).toFixed(1)}K
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-gaming-blue" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/55">总评论</p>
          </div>
          <p className="mt-2 text-2xl font-semibold font-mono text-gaming-blue">
            {(totalComments / 1000).toFixed(1)}K
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-gaming-error" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/55">均点赞</p>
          </div>
          <p className="mt-2 text-2xl font-semibold font-mono text-gaming-error">
            {(avgLikeRate / 1000).toFixed(1)}K
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-gaming-cyan" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/55">热词数</p>
          </div>
          <p className="mt-2 text-2xl font-semibold font-mono text-gaming-cyan">
            {hotWords.length}
          </p>
        </div>
      </div>

      {/* Hot words cloud */}
      <div className="glass-card rounded-xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">弹幕 & 评论热词 TOP 20</h3>
          <span className="text-[10px] text-muted-foreground/55">TF-IDF 加权 · 点击查看详情</span>
        </div>
        {wordError ? (
          <div className="flex items-center gap-2 py-4">
            <AlertTriangle className="h-3.5 w-3.5 text-gaming-warning" />
            <p className="text-xs text-gaming-warning">{wordError}</p>
          </div>
        ) : (
          <WordCloud />
        )}
      </div>

      {/* Funnel */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">曝光 → 互动漏斗</h3>
        <FunnelChart />
      </div>

      {/* Danmaku frequency */}
      <div className="glass-card rounded-xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">弹幕 & 评论趋势</h3>
          <button
            onClick={() => setShowTechDetails(!showTechDetails)}
            className="text-[9px] text-muted-foreground/55 hover:text-foreground transition-colors flex items-center gap-1"
          >
            {showTechDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            技术详情
          </button>
        </div>
        <div className="h-[200px] w-full">
          <DanmakuChart />
        </div>
        {showTechDetails && (
          <div className="mt-2 rounded-lg border border-border bg-white/[0.02] p-2">
            <p className="text-[9px] text-muted-foreground/55 font-mono">
              样本数: {engagements.length} · 弹幕总词数: ~{totalDanmaku.toLocaleString()} · TF-IDF Top N: 20
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
