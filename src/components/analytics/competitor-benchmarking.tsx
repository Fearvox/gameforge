'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  BarChart, Bar, XAxis, YAxis,
  ResponsiveContainer, Tooltip, CartesianGrid,
} from 'recharts';
import { Trophy, AlertTriangle } from 'lucide-react';
import { useAnalyticsStore, COMPETITOR_FEATURES, COMPETITOR_WEIGHTS } from '@/lib/analytics-store';

function FeaturesChartInner() {
  const { competitors, competitorRankings } = useAnalyticsStore();

  const top4 = competitorRankings.slice(0, 4);

  // Chart: fan count comparison bar
  const chartData = useMemo(() => {
    const profileMap = new Map(competitors.map((c) => [c.id, c]));
    return top4.map((r) => {
      const c = profileMap.get(r.id);
      return {
        name: r.name.length > 6 ? r.name.slice(0, 6) + '...' : r.name,
        fanCount: c ? c.fanCount : 0,
        avgViews7d: c ? c.avgViews7d : 0,
      };
    });
  }, [competitors, top4]);

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 10 }}
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
        <Bar dataKey="fanCount" fill="#a855f7" radius={[4, 4, 0, 0]} name="粉丝数" />
        <Bar dataKey="avgViews7d" fill="#3b82f6" radius={[4, 4, 0, 0]} name="周均播放" />
      </BarChart>
    </ResponsiveContainer>
  );
}

const FeaturesChart = dynamic(() => Promise.resolve(FeaturesChartInner), { ssr: false });

export default function CompetitorBenchmarking() {
  const { competitorRankings, competitors, algorithmErrors } = useAnalyticsStore();
  const competitorError = algorithmErrors.competitor;

  // High 3: exclude benchmark self (distance=0) — take first with distance > 0 as real closest
  const closest = competitorRankings.find((r) => r.distance > 0) ?? null;

  const featureLabels: Record<string, string> = {
    fanCount: '粉丝数',
    avgViews7d: '周均播放',
    avgLikes: '均点赞',
    avgComments: '均评论',
    avgCompletionRate: '完播率',
  };

  return (
    <div className="space-y-4">
      {/* B4: algorithm error */}
      {competitorError && (
        <div className="rounded-lg border border-gaming-warning/20 bg-gaming-warning/6 p-2 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-gaming-warning" />
          <p className="text-[10px] text-gaming-warning">{competitorError}</p>
        </div>
      )}

      {/* Closest competitor card */}
      {closest && closest.rank > 0 && (
        <div className="glass-card rounded-xl p-4 border border-gaming-cyan/20">
          <div className="flex items-center gap-3">
            <Trophy className="h-5 w-5 text-gaming-cyan" />
            <div>
              <p className="text-xs text-gaming-cyan font-semibold">
                最接近的UP主 · #{closest.rank}
              </p>
              <p className="text-sm font-bold text-foreground">{closest.name}</p>
              <p className="text-[10px] text-muted-foreground/55">
                加权欧氏距离: {closest.distance.toFixed(3)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Ranking table */}
      <div className="glass-card rounded-xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">竞品排名</h3>
          <span className="text-[10px] text-muted-foreground/55">
            Z-score · 5维加权欧氏距离
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground/55">
                <th className="py-1.5 font-medium">排名</th>
                <th className="py-1.5 font-medium">UP主</th>
                <th className="py-1.5 font-medium">品类</th>
                <th className="py-1.5 font-medium text-right">粉丝</th>
                <th className="py-1.5 font-medium text-right">距离</th>
              </tr>
            </thead>
            <tbody>
              {competitorRankings.map((r) => {
                const c = competitors.find((comp) => comp.id === r.id);
                return (
                  <tr key={r.id} className="border-b border-border/50">
                    <td className="py-1.5">
                      <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-[9px] font-bold ${
                        r.rank === 1
                          ? 'bg-gaming-cyan/15 text-gaming-cyan'
                          : r.rank <= 3
                          ? 'bg-gaming-purple/15 text-gaming-purple'
                          : 'bg-white/5 text-muted-foreground/55'
                      }`}>
                        {r.rank}
                      </span>
                    </td>
                    <td className="py-1.5 text-foreground font-medium">{r.name}</td>
                    <td className="py-1.5 text-muted-foreground/55">{c?.category ?? '—'}</td>
                    <td className="py-1.5 text-right font-mono text-gaming-purple">
                      {c ? `${(c.fanCount / 10000).toFixed(1)}万` : '—'}
                    </td>
                    <td className="py-1.5 text-right font-mono text-muted-foreground/55">
                      {r.distance.toFixed(3)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature comparison chart */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Top 4 特征对比</h3>
        <div className="h-[240px] w-full">
          <FeaturesChart />
        </div>
        {/* Weights audit (D4) */}
        <div className="mt-3 flex flex-wrap gap-2 text-[9px] text-muted-foreground/55">
          <span>权重:</span>
          {COMPETITOR_FEATURES.map((f, i) => (
            <span key={f} className="font-mono">
              {featureLabels[f]}: {(COMPETITOR_WEIGHTS[i] * 100).toFixed(0)}%
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
