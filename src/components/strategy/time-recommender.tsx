'use client';

import { AlertTriangle } from 'lucide-react';
import { useStrategyStore, PLATFORM_OPTIONS } from '@/lib/strategy-store';

export default function TimeRecommender() {
  const {
    timeRecommendations, timeRecommendationPlatform, setTimeRecommendationPlatform,
    hasInsufficientSamples, algorithmErrors,
  } = useStrategyStore();
  const timeError = algorithmErrors.timeRecommendation;

  const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  return (
    <div className="space-y-4">
      {/* Platform filter */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground/55">推荐平台:</span>
        <select
          value={timeRecommendationPlatform}
          onChange={(e) => setTimeRecommendationPlatform(e.target.value)}
          className="rounded-lg border border-border bg-background/30 px-3 py-1.5 text-[10px] text-foreground outline-none focus:border-gaming-purple/30"
        >
          {PLATFORM_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* B3: insufficient samples */}
      {hasInsufficientSamples && timeError && (
        <div className="rounded-lg border border-gaming-warning/20 bg-gaming-warning/6 p-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-gaming-warning" />
          <div>
            <p className="text-xs font-medium text-gaming-warning">样本不足</p>
            <p className="text-[10px] text-gaming-warning/80">{timeError}</p>
          </div>
        </div>
      )}

      {/* B4: algorithm error */}
      {!hasInsufficientSamples && timeError && (
        <div className="rounded-lg border border-gaming-warning/20 bg-gaming-warning/6 p-2 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-gaming-warning" />
          <p className="text-[10px] text-gaming-warning">{timeError}</p>
        </div>
      )}

      {/* Recommendation table */}
      <div className="glass-card rounded-xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">最佳发布时间 TOP {Math.min(timeRecommendations.length, 10)}</h3>
          <span className="text-[10px] text-muted-foreground/55">历史均值 + 置信度加权</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground/55">
                <th className="py-1.5 font-medium">排名</th>
                <th className="py-1.5 font-medium">时间</th>
                <th className="py-1.5 font-medium text-right">综合得分</th>
                <th className="py-1.5 font-medium text-right">历史均值</th>
                <th className="py-1.5 font-medium text-right">置信度</th>
                <th className="py-1.5 font-medium text-right">样本数</th>
              </tr>
            </thead>
            <tbody>
              {timeRecommendations.slice(0, 10).map((r, i) => (
                <tr key={`${r.dayOfWeek}-${r.hour}-${r.platform}`} className="border-b border-border/50">
                  <td className="py-1.5">
                    <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-[9px] font-bold ${
                      i === 0 ? 'bg-gaming-cyan/15 text-gaming-cyan' :
                      i <= 2 ? 'bg-gaming-purple/15 text-gaming-purple' :
                      'bg-white/5 text-muted-foreground/55'
                    }`}>{i + 1}</span>
                  </td>
                  <td className="py-1.5 text-foreground font-medium">
                    {DAY_NAMES[r.dayOfWeek]} {String(r.hour).padStart(2, '0')}:00
                  </td>
                  <td className="py-1.5 text-right font-mono text-gaming-purple">{r.score.toFixed(1)}</td>
                  <td className="py-1.5 text-right font-mono text-muted-foreground/55">{r.historyAvgContribution.toFixed(1)}</td>
                  <td className="py-1.5 text-right font-mono text-muted-foreground/55">{r.confidenceContribution.toFixed(1)}</td>
                  <td className="py-1.5 text-right font-mono text-gaming-cyan">{r.sampleSize}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
