'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  BarChart, Bar, XAxis, YAxis,
  ResponsiveContainer, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import { AlertTriangle } from 'lucide-react';
import { useAnalyticsStore, PLATFORMS } from '@/lib/analytics-store';

function PlatformChartInner() {
  const { platformComparison } = useAnalyticsStore();

  const data = useMemo(
    () =>
      PLATFORMS.map((p) => {
        const d = platformComparison[p] ?? {};
        return {
          platform: p === 'bilibili' ? 'B站' : p === 'youtube' ? 'YouTube' : '抖音',
          totalViews: d.totalViews ?? 0,
          totalLikes: d.totalLikes ?? 0,
          totalComments: d.totalComments ?? 0,
          videos: d.videos ?? 0,
        };
      }),
    [platformComparison],
  );

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="platform" tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 10 }}
          tickLine={false} axisLine={false}
        />
        <YAxis tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 10 }}
          tickLine={false} axisLine={false}
          tickFormatter={(v: number) => `${(v / 10000).toFixed(0)}万`}
        />
        <Tooltip contentStyle={{
          background: '#0a0b0f', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px', fontSize: '12px', color: '#fff',
        }} />
        <Legend wrapperStyle={{ fontSize: '10px', opacity: 0.55 }} />
        <Bar dataKey="totalViews" fill="#a855f7" radius={[4, 4, 0, 0]} name="总播放" />
        <Bar dataKey="totalLikes" fill="#3b82f6" radius={[4, 4, 0, 0]} name="总点赞" />
        <Bar dataKey="totalComments" fill="#06b6d4" radius={[4, 4, 0, 0]} name="总评论" />
      </BarChart>
    </ResponsiveContainer>
  );
}

const PlatformChart = dynamic(() => Promise.resolve(PlatformChartInner), { ssr: false });

export default function PlatformComparisonView() {
  const { platformComparison, videoMetrics, algorithmErrors } = useAnalyticsStore();

  const platformError = algorithmErrors.platformComparison;

  const platformMetrics = useMemo(
    () =>
      PLATFORMS.map((p) => {
        const filtered = videoMetrics.filter((v) => v.platform === p);
        const comp = platformComparison[p];
        return {
          id: p,
          label: p === 'bilibili' ? 'B站' : p === 'youtube' ? 'YouTube' : '抖音',
          icon: p === 'bilibili' ? '📺' : p === 'youtube' ? '▶️' : '🎵',
          videoCount: filtered.length,
          avgCompletion: comp?.avgCompletion ?? 0,
          totalDanmaku: comp?.totalDanmaku ?? 0,
          isDegraded: filtered.length === 0,
        };
      }),
    [videoMetrics, platformComparison],
  );

  return (
    <div className="space-y-4">
      {/* B7: degraded platform notice */}
      {platformError && (
        <div className="rounded-lg border border-gaming-warning/20 bg-gaming-warning/6 p-2 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-gaming-warning" />
          <p className="text-[10px] text-gaming-warning">{platformError}</p>
        </div>
      )}

      {/* Platform metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {platformMetrics.map((pm) => (
          <div
            key={pm.id}
            className={`glass-card rounded-xl p-4 ${pm.isDegraded ? 'opacity-50' : ''}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{pm.icon}</span>
              <div>
                <p className="text-xs font-semibold text-foreground">{pm.label}</p>
                {pm.isDegraded && (
                  <p className="text-[9px] text-gaming-warning">数据不完整</p>
                )}
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-[10px] text-muted-foreground/55">视频数</span>
                <span className="text-[10px] font-mono text-foreground">{pm.videoCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] text-muted-foreground/55">均完播率</span>
                <span className="text-[10px] font-mono text-gaming-cyan">
                  {(pm.avgCompletion * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] text-muted-foreground/55">弹幕数</span>
                <span className="text-[10px] font-mono text-gaming-purple">
                  {(pm.totalDanmaku / 1000).toFixed(1)}K
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison chart */}
      <div className="glass-card rounded-xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">跨平台数据对比</h3>
          <span className="text-[10px] text-muted-foreground/55">Map-Reduce Pivot · B站优先</span>
        </div>
        <div className="h-[280px] w-full">
          <PlatformChart />
        </div>
      </div>
    </div>
  );
}
