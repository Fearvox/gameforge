'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  AreaChart, Area, Line, XAxis, YAxis,
  ResponsiveContainer, Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown, Users, UserPlus, UserMinus, AlertTriangle } from 'lucide-react';
import { useAnalyticsStore } from '@/lib/analytics-store';

/* ── A10: Recharts dynamic import (SSR safe) ── */
function FanChartInner() {
  const { fanHistory, fanForecast } = useAnalyticsStore();

  const chartData = useMemo(() => {
    const historyData = fanHistory.map((s) => ({
      date: s.date.slice(5),
      total: s.total,
      upper: undefined as number | undefined,
      lower: undefined as number | undefined,
      type: 'history' as const,
    }));
    const forecastData = fanForecast.map((f) => ({
      date: f.date.slice(5),
      total: f.predicted,
      upper: f.upper,
      lower: f.lower,
      type: 'forecast' as const,
    }));
    return [...historyData, ...forecastData];
  }, [fanHistory, fanForecast]);

  const divideLine = fanHistory.length > 0 ? fanHistory[fanHistory.length - 1]?.date.slice(5) : null;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -10 }}>
        <defs>
          <linearGradient id="fanGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a855f7" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.12} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 10 }}
          tickLine={false} axisLine={false}
        />
        <YAxis tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 10 }}
          tickLine={false} axisLine={false}
          tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`}
        />
        <Tooltip contentStyle={{
          background: '#0a0b0f', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px', fontSize: '12px', color: '#fff',
        }} />
        {/* History */}
        <Area type="monotone" dataKey="total" stroke="#a855f7" strokeWidth={2}
          fill="url(#fanGrad)" dot={false} name="实际粉丝"
          data={chartData.filter((d) => d.type === 'history')}
        />
        {/* Forecast CI */}
        <Area type="monotone" dataKey="upper" stroke="transparent"
          fill="url(#forecastGrad)" dot={false} name="预测上限"
          data={chartData.filter((d) => d.type === 'forecast')}
        />
        <Area type="monotone" dataKey="lower" stroke="transparent"
          fill="transparent" dot={false} name="预测下限"
          data={chartData.filter((d) => d.type === 'forecast')}
        />
        {/* Forecast center line (dashed) */}
        <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={1.5}
          strokeDasharray="5 5" dot={false} name="预测粉丝"
          data={chartData.filter((d) => d.type === 'forecast')}
        />
        {divideLine && (
          <ReferenceLine x={divideLine}
            stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4"
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}

const FanChart = dynamic(() => Promise.resolve(FanChartInner), { ssr: false });

/* ── B6: chart fallback as data table ── */
function FanChartFallback() {
  const { fanHistory, fanForecast } = useAnalyticsStore();
  const [showDetails, setShowDetails] = useState(false);

  const rows = fanHistory.slice(-7).map((s) => ({
    date: s.date.slice(5),
    total: s.total,
    newFans: s.newFans,
  }));

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-3.5 w-3.5 text-gaming-warning" />
        <p className="text-xs text-gaming-warning">图表渲染失败，已切换为数据表视图</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground/55">
              <th className="py-1.5 font-medium">日期</th>
              <th className="py-1.5 font-medium text-right">粉丝</th>
              <th className="py-1.5 font-medium text-right">新增</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.date} className="border-b border-border/50">
                <td className="py-1.5 text-foreground">{r.date}</td>
                <td className="py-1.5 text-right font-mono text-gaming-purple">{(r.total / 1000).toFixed(1)}K</td>
                <td className="py-1.5 text-right font-mono text-gaming-success">+{r.newFans}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Design suggestion: B6 tech details fold */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="text-[9px] text-muted-foreground/55 hover:text-foreground transition-colors"
      >
        {showDetails ? '▲ 收起技术详情' : '▼ 显示技术详情'}
      </button>
      {showDetails && (
        <div className="rounded-lg border border-border bg-white/[0.02] p-2">
          <p className="text-[9px] text-muted-foreground/55 font-mono">
            预测天数: {fanForecast.length} · 历史记录: {fanHistory.length} · 模型: Holt-Winters 简化
          </p>
        </div>
      )}
    </div>
  );
}

export default function FanAnalysis() {
  const { fanHistory, fanForecast, algorithmErrors, hasInsufficientSamples } = useAnalyticsStore();

  const latest = fanHistory.length > 0 ? fanHistory[fanHistory.length - 1] : null;
  const prev = fanHistory.length > 7 ? fanHistory[fanHistory.length - 8] : null;
  const weekGrowth = latest && prev ? latest.total - prev.total : 0;
  const nextWeekPred = fanForecast.length >= 7
    ? fanForecast[6].predicted
    : fanForecast.length > 0 ? fanForecast[fanForecast.length - 1].predicted : 0;

  const fanError = algorithmErrors.fanForecast;

  return (
    <div className="space-y-4">
      {/* B3: insufficient samples banner */}
      {hasInsufficientSamples && fanError && (
        <div className="rounded-lg border border-gaming-warning/20 bg-gaming-warning/6 p-2 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-gaming-warning" />
          <p className="text-[10px] text-gaming-warning">{fanError}</p>
        </div>
      )}

      {/* Metric cards row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground/55" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/55">
              当前粉丝
            </p>
          </div>
          <p className="mt-2 text-2xl font-semibold font-mono text-foreground">
            {latest ? `${(latest.total / 1000).toFixed(1)}K` : '—'}
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2">
            {weekGrowth >= 0 ? (
              <TrendingUp className="h-4 w-4 text-gaming-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-gaming-error" />
            )}
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/55">
              周增长
            </p>
          </div>
          <p className={`mt-2 text-2xl font-semibold font-mono ${weekGrowth >= 0 ? 'text-gaming-success' : 'text-gaming-error'}`}>
            {weekGrowth >= 0 ? '+' : ''}{weekGrowth.toLocaleString()}
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-gaming-blue" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/55">
              周新增
            </p>
          </div>
          <p className="mt-2 text-2xl font-semibold font-mono text-gaming-blue">
            {latest ? `+${(latest.newFans * 7).toLocaleString()}` : '—'}
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2">
            <UserMinus className="h-4 w-4 text-gaming-error" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/55">
              预测下周
            </p>
          </div>
          <p className="mt-2 text-2xl font-semibold font-mono text-foreground">
            {nextWeekPred > 0 ? `${(nextWeekPred / 1000).toFixed(1)}K` : '—'}
          </p>
        </div>
      </div>

      {/* Forecast chart or B6 fallback */}
      <div className="glass-card rounded-xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            粉丝趋势 & 14天预测
          </h3>
          <span className="text-[10px] text-muted-foreground/55">
            Holt-Winters 简化模型 · 95% 置信区间
          </span>
        </div>
        {fanError ? (
          <FanChartFallback />
        ) : (
          <div className="h-[320px] w-full">
            <FanChart />
          </div>
        )}
      </div>
    </div>
  );
}
