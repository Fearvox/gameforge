'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis,
  ResponsiveContainer, Tooltip, CartesianGrid,
  BarChart, Bar,
} from 'recharts';
import { DollarSign, TrendingUp, BarChart3 } from 'lucide-react';
import { useAnalyticsStore } from '@/lib/analytics-store';

/* ── ROI scatter plot ── */
function ROIScatterInner() {
  const { sponsorships } = useAnalyticsStore();

  const data = useMemo(
    () =>
      sponsorships.map((s) => ({
        x: s.cost,
        y: s.roi,
        z: s.views / 10000,
        name: `${s.brand} (${s.cpm.toFixed(1)} CPM)`,
      })),
    [sponsorships],
  );

  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-xs text-muted-foreground/55">暂无商单数据</p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ScatterChart margin={{ top: 8, right: 12, bottom: 0, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis type="number" dataKey="x" name="成本" unit="¥"
          tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 10 }}
          tickLine={false} axisLine={false}
        />
        <YAxis type="number" dataKey="y" name="ROI"
          tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 10 }}
          tickLine={false} axisLine={false}
        />
        <ZAxis type="number" dataKey="z" range={[40, 200]} name="播放(万)" />
        <Tooltip contentStyle={{
          background: '#0a0b0f', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px', fontSize: '12px', color: '#fff',
        }}
          cursor={{ strokeDasharray: '3 3' }}
        />
        <Scatter data={data} fill="#a855f7" opacity={0.7} name="商单" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

const ROIScatter = dynamic(() => Promise.resolve(ROIScatterInner), { ssr: false });

/* ── CPM comparison chart ── */
function CPMChartInner() {
  const { sponsorships } = useAnalyticsStore();

  const data = useMemo(
    () =>
      [...sponsorships]
        .sort((a, b) => b.cpm - a.cpm)
        .map((s) => ({
          brand: s.brand,
          cpm: s.cpm,
          roi: s.roi,
        })),
    [sponsorships],
  );

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 8, bottom: 0, left: 64 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 10 }}
          tickFormatter={(v: number) => `¥${v.toFixed(0)}`}
        />
        <YAxis type="category" dataKey="brand" tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 10 }}
          width={60}
        />
        <Tooltip contentStyle={{
          background: '#0a0b0f', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px', fontSize: '12px', color: '#fff',
        }} />
        <Bar dataKey="cpm" fill="#22c55e" radius={[0, 4, 4, 0]} name="CPM (¥)" />
      </BarChart>
    </ResponsiveContainer>
  );
}

const CPMChart = dynamic(() => Promise.resolve(CPMChartInner), { ssr: false });

export default function RevenueAnalysis() {
  const { sponsorships } = useAnalyticsStore();

  const totalRevenue = useMemo(
    () => sponsorships.reduce((s, d) => s + d.revenue, 0),
    [sponsorships],
  );
  const avgROI = useMemo(
    () =>
      sponsorships.length > 0
        ? sponsorships.reduce((s, d) => s + d.roi, 0) / sponsorships.length
        : 0,
    [sponsorships],
  );
  const avgCPM = useMemo(
    () =>
      sponsorships.length > 0
        ? sponsorships.reduce((s, d) => s + d.cpm, 0) / sponsorships.length
        : 0,
    [sponsorships],
  );
  const brandCount = useMemo(() => new Set(sponsorships.map((s) => s.brand)).size, [sponsorships]);

  /* Top partnerships */
  const topDeals = useMemo(
    () =>
      [...sponsorships]
        .sort((a, b) => b.roi - a.roi)
        .slice(0, 5),
    [sponsorships],
  );

  return (
    <div className="space-y-4">
      {/* Summary metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground/55" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/55">总收入</p>
          </div>
          <p className="mt-2 text-2xl font-semibold font-mono text-gaming-success">
            ¥{(totalRevenue / 10000).toFixed(1)}万
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gaming-cyan" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/55">平均 ROI</p>
          </div>
          <p className="mt-2 text-2xl font-semibold font-mono text-gaming-cyan">
            {(avgROI * 100).toFixed(0)}%
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-gaming-purple" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/55">平均 CPM</p>
          </div>
          <p className="mt-2 text-2xl font-semibold font-mono text-gaming-purple">
            ¥{avgCPM.toFixed(1)}
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gaming-blue" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/55">合作品牌</p>
          </div>
          <p className="mt-2 text-2xl font-semibold font-mono text-gaming-blue">
            {brandCount} 个
          </p>
        </div>
      </div>

      {/* ROI scatter */}
      <div className="glass-card rounded-xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">ROI 分析</h3>
          <span className="text-[10px] text-muted-foreground/55">气泡大小 = 播放量</span>
        </div>
        <div className="h-[280px] w-full">
          <ROIScatter />
        </div>
      </div>

      {/* CPM comparison */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">CPM 对比</h3>
        <div className="h-[200px] w-full">
          <CPMChart />
        </div>
      </div>

      {/* Top deals table */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">TOP 商单</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground/55">
                <th className="py-1.5 font-medium">品牌</th>
                <th className="py-1.5 font-medium text-right">收入</th>
                <th className="py-1.5 font-medium text-right">成本</th>
                <th className="py-1.5 font-medium text-right">ROI</th>
                <th className="py-1.5 font-medium text-right">CPM</th>
                <th className="py-1.5 font-medium text-right">播放</th>
              </tr>
            </thead>
            <tbody>
              {topDeals.map((d) => (
                <tr key={d.id} className="border-b border-border/50">
                  <td className="py-1.5 text-foreground font-medium">{d.brand}</td>
                  <td className="py-1.5 text-right font-mono text-gaming-success">
                    ¥{(d.revenue / 1000).toFixed(1)}K
                  </td>
                  <td className="py-1.5 text-right font-mono text-gaming-error">
                    ¥{(d.cost / 1000).toFixed(1)}K
                  </td>
                  <td className="py-1.5 text-right font-mono text-gaming-cyan">
                    {(d.roi * 100).toFixed(0)}%
                  </td>
                  <td className="py-1.5 text-right font-mono text-muted-foreground/55">
                    ¥{d.cpm.toFixed(1)}
                  </td>
                  <td className="py-1.5 text-right font-mono text-gaming-purple">
                    {(d.views / 10000).toFixed(1)}万
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
