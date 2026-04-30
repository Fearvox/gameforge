'use client';

import { AlertTriangle } from 'lucide-react';
import { useStrategyStore } from '@/lib/strategy-store';

export default function ABTesting() {
  const { experiments, algorithmErrors } = useStrategyStore();

  const CONCLUSION_LABELS: Record<string, { text: string; color: string; bg: string }> = {
    observing: { text: '观察中', color: 'text-muted-foreground/55', bg: 'bg-white/5' },
    a_wins: { text: '显著 A 优', color: 'text-gaming-success', bg: 'bg-gaming-success/15' },
    b_wins: { text: '显著 B 优', color: 'text-gaming-blue', bg: 'bg-gaming-blue/15' },
    no_difference: { text: '无显著差异', color: 'text-gaming-warning', bg: 'bg-gaming-warning/15' },
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/55">总实验数</p>
          <p className="mt-2 text-2xl font-semibold font-mono text-gaming-purple">{experiments.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/55">进行中</p>
          <p className="mt-2 text-2xl font-semibold font-mono text-gaming-blue">
            {experiments.filter((e) => e.status === 'running').length}
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/55">已完成</p>
          <p className="mt-2 text-2xl font-semibold font-mono text-gaming-cyan">
            {experiments.filter((e) => e.status === 'completed').length}
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/55">显著结论</p>
          <p className="mt-2 text-2xl font-semibold font-mono text-gaming-success">
            {experiments.filter((e) => e.conclusion === 'a_wins' || e.conclusion === 'b_wins').length}
          </p>
        </div>
      </div>

      {/* Experiment cards */}
      {experiments.map((exp) => {
        const expError = algorithmErrors[`ab_${exp.id}`];
        const con = CONCLUSION_LABELS[exp.conclusion ?? 'observing'];
        const totalImpressions = (exp.versionA.impressions || 0) + (exp.versionB.impressions || 0);
        const aCtr = exp.versionA.impressions > 0
          ? ((exp.versionA.clicks / exp.versionA.impressions) * 100).toFixed(1)
          : '0.0';
        const bCtr = exp.versionB.impressions > 0
          ? ((exp.versionB.clicks / exp.versionB.impressions) * 100).toFixed(1)
          : '0.0';

        return (
          <div key={exp.id} className="glass-card rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-medium ${
                    exp.type === 'cover' ? 'bg-gaming-purple/15 text-gaming-purple' :
                    exp.type === 'title' ? 'bg-gaming-blue/15 text-gaming-blue' :
                    'bg-gaming-cyan/15 text-gaming-cyan'
                  }`}>
                    {exp.type === 'cover' ? '封面' : exp.type === 'title' ? '标题' : '时段'}
                  </span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-medium ${
                    exp.status === 'running' ? 'bg-gaming-blue/15 text-gaming-blue' :
                    exp.status === 'completed' ? 'bg-gaming-success/15 text-gaming-success' :
                    'bg-white/5 text-muted-foreground/55'
                  }`}>
                    {exp.status === 'running' ? '进行中' : exp.status === 'completed' ? '已完成' : '草稿'}
                  </span>
                  {/* Non-blocking 1: explicit conclusion badge with full mapping */}
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-medium ${con.bg} ${con.color}`}>
                    {con.text}
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-foreground">{exp.target}</p>
              </div>
              {exp.conclusion === 'observing' && totalImpressions < 1000 && (
                <span className="text-[9px] text-muted-foreground/55">
                  曝光 {totalImpressions}/1000 · 未达显著性阈值
                </span>
              )}
            </div>

            {/* B4: AB error */}
            {expError && (
              <div className="mb-3 rounded-lg border border-gaming-warning/20 bg-gaming-warning/6 p-2 flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 shrink-0 text-gaming-warning" />
                <p className="text-[9px] text-gaming-warning">{expError}</p>
              </div>
            )}

            {/* A/B comparison */}
            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-lg border p-3 ${
                exp.conclusion === 'a_wins' ? 'border-gaming-success/30 bg-gaming-success/[0.03]' : 'border-border bg-white/[0.02]'
              }`}>
                <p className="text-[10px] text-muted-foreground/55 mb-1">A: {exp.versionA.name}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold font-mono text-gaming-purple">{aCtr}%</span>
                  <span className="text-[9px] text-muted-foreground/55">CTR</span>
                </div>
                <p className="mt-1 text-[9px] text-muted-foreground/55">
                  曝光 {exp.versionA.impressions.toLocaleString()} · 点击 {exp.versionA.clicks.toLocaleString()}
                </p>
                {exp.conclusion === 'a_wins' && (
                  <span className="inline-flex items-center rounded-full px-1.5 py-0.5 mt-1 text-[8px] font-bold bg-gaming-success/15 text-gaming-success">
                    胜出 ✓
                  </span>
                )}
              </div>
              <div className={`rounded-lg border p-3 ${
                exp.conclusion === 'b_wins' ? 'border-gaming-blue/30 bg-gaming-blue/[0.03]' : 'border-border bg-white/[0.02]'
              }`}>
                <p className="text-[10px] text-muted-foreground/55 mb-1">B: {exp.versionB.name}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold font-mono text-gaming-blue">{bCtr}%</span>
                  <span className="text-[9px] text-muted-foreground/55">CTR</span>
                </div>
                <p className="mt-1 text-[9px] text-muted-foreground/55">
                  曝光 {exp.versionB.impressions.toLocaleString()} · 点击 {exp.versionB.clicks.toLocaleString()}
                </p>
                {exp.conclusion === 'b_wins' && (
                  <span className="inline-flex items-center rounded-full px-1.5 py-0.5 mt-1 text-[8px] font-bold bg-gaming-blue/15 text-gaming-blue">
                    胜出 ✓
                  </span>
                )}
              </div>
            </div>

            {/* Dates */}
            <p className="mt-2 text-[9px] text-muted-foreground/55">
              {exp.startDate} ~ {exp.endDate}
            </p>
          </div>
        );
      })}
    </div>
  );
}
