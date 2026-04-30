'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  BarChart, Bar, XAxis, YAxis,
  ResponsiveContainer, Tooltip, CartesianGrid,
} from 'recharts';
import { Clock, Play, ThumbsUp } from 'lucide-react';
import { useAnalyticsStore } from '@/lib/analytics-store';

const dayNames = ['日', '一', '二', '三', '四', '五', '六'];

function TimeSlotChartInner() {
  const { bestTimeSlots } = useAnalyticsStore();

  const data = useMemo(
    () =>
      bestTimeSlots.map((s) => ({
        label: `周${dayNames[s.dayOfWeek]} ${s.hour}:00`,
        views: Math.round(s.avgViews),
        score: Math.round(s.score),
      })),
    [bestTimeSlots],
  );

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 72 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 10 }}
          tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`}
        />
        <YAxis type="category" dataKey="label" tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 10 }}
          width={70}
        />
        <Tooltip contentStyle={{
          background: '#0a0b0f', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px', fontSize: '12px', color: '#fff',
        }} />
        <Bar dataKey="views" fill="#a855f7" radius={[0, 4, 4, 0]} name="平均播放" />
      </BarChart>
    </ResponsiveContainer>
  );
}

const TimeSlotChart = dynamic(() => Promise.resolve(TimeSlotChartInner), { ssr: false });

export default function ContentPerformance() {
  const { videoMetrics, bestTimeSlots, algorithmErrors } = useAnalyticsStore();

  const totalVideos = videoMetrics.length;
  const totalViews = useMemo(
    () => videoMetrics.reduce((s, v) => s + v.views, 0),
    [videoMetrics],
  );
  const avgCompletion = useMemo(
    () =>
      totalVideos > 0
        ? videoMetrics.reduce((s, v) => s + v.completionRate, 0) / totalVideos
        : 0,
    [videoMetrics, totalVideos],
  );
  const topTimeSlot = bestTimeSlots[0] ?? null;

  /* Top 5 videos by views */
  const topVideos = useMemo(
    () =>
      [...videoMetrics]
        .sort((a, b) => b.views - a.views)
        .slice(0, 5),
    [videoMetrics],
  );

  const slotError = algorithmErrors.bestTimeSlots;

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Play className="h-4 w-4 text-muted-foreground/55" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/55">作品总数</p>
          </div>
          <p className="mt-2 text-2xl font-semibold font-mono text-foreground">{totalVideos}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Play className="h-4 w-4 text-gaming-purple" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/55">总播放</p>
          </div>
          <p className="mt-2 text-2xl font-semibold font-mono text-gaming-purple">
            {(totalViews / 10000).toFixed(1)}万
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2">
            <ThumbsUp className="h-4 w-4 text-gaming-blue" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/55">平均完播率</p>
          </div>
          <p className="mt-2 text-2xl font-semibold font-mono text-gaming-blue">
            {(avgCompletion * 100).toFixed(1)}%
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gaming-cyan" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/55">最佳时段</p>
          </div>
          <p className="mt-2 text-lg font-semibold font-mono text-gaming-cyan">
            {topTimeSlot
              ? `周${dayNames[topTimeSlot.dayOfWeek]} ${topTimeSlot.hour}:00`
              : '—'}
          </p>
        </div>
      </div>

      {/* Best time slots chart */}
      <div className="glass-card rounded-xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">最佳发布时间 TOP 10</h3>
          <span className="text-[10px] text-muted-foreground/55">
            24×7 加权评分模型 · 含置信度加权
          </span>
        </div>
        {slotError ? (
          <p className="py-6 text-center text-xs text-gaming-warning">
            {slotError} — 请尝试刷新或筛选更多数据
          </p>
        ) : (
          <div className="h-[250px] w-full">
            <TimeSlotChart />
          </div>
        )}
      </div>

      {/* Top videos table */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">热门作品 TOP 5</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground/55">
                <th className="py-2 font-medium">#</th>
                <th className="py-2 font-medium">标题</th>
                <th className="py-2 font-medium text-right">播放</th>
                <th className="py-2 font-medium text-right">点赞</th>
                <th className="py-2 font-medium text-right">完播率</th>
                <th className="py-2 font-medium">平台</th>
              </tr>
            </thead>
            <tbody>
              {topVideos.map((v, i) => (
                <tr key={v.id} className="border-b border-border/50">
                  <td className="py-2 text-muted-foreground/55">{i + 1}</td>
                  <td className="py-2 max-w-[280px] truncate text-foreground">{v.title}</td>
                  <td className="py-2 text-right font-mono text-gaming-purple">
                    {(v.views / 10000).toFixed(1)}万
                  </td>
                  <td className="py-2 text-right font-mono text-gaming-blue">
                    {(v.likes / 1000).toFixed(1)}K
                  </td>
                  <td className="py-2 text-right font-mono text-gaming-cyan">
                    {(v.completionRate * 100).toFixed(0)}%
                  </td>
                  <td className="py-2 text-muted-foreground/55">
                    {v.platform === 'bilibili' ? 'B站' : v.platform === 'youtube' ? 'YouTube' : '抖音'}
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
