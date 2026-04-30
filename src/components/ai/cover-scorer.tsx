'use client';

import { useMemo } from 'react';
import { Image, AlertTriangle, TrendingUp, Zap, Eye, Layers } from 'lucide-react';
import { useAIStore, COVER_DIMENSIONS, COVER_DIMENSION_WEIGHTS } from '@/lib/ai-store';

const DIMENSION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  composition: Layers,
  readability: Eye,
  contrast: Zap,
  subjectClarity: TrendingUp,
};

const DIMENSION_LABELS: Record<string, string> = {
  composition: '构图',
  readability: '可读性',
  contrast: '对比度',
  subjectClarity: '主体清晰度',
};

export default function CoverScorer() {
  const { coverScore, callLog, computeCoverScore, capabilityToggles, algorithmErrors } = useAIStore();
  const scoreError = algorithmErrors.coverScore;
  const enabled = capabilityToggles.coverScore;

  const lastCall = useMemo(
    () => callLog.filter((l) => l.capability === 'coverScore').at(-1) ?? null,
    [callLog],
  );

  const dimensionData = useMemo(() => {
    if (!coverScore) return [];
    return COVER_DIMENSIONS.map((dim, i) => ({
      dim,
      label: DIMENSION_LABELS[dim],
      score: coverScore[dim as keyof typeof coverScore] as number,
      weight: COVER_DIMENSION_WEIGHTS[i],
      Icon: DIMENSION_ICONS[dim],
    }));
  }, [coverScore]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="glass-card rounded-xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">封面评分</h3>
          {!enabled && (
            <span className="text-[9px] text-muted-foreground/55 bg-white/5 rounded-full px-2 py-0.5">
              已禁用
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="h-20 w-36 rounded-lg border border-border bg-white/[0.02] flex items-center justify-center">
            <Image className="h-6 w-6 text-muted-foreground/30" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground/55">上传封面图片进行分析</p>
            <button
              onClick={() => computeCoverScore('')}
              disabled={!enabled}
              className="mt-2 rounded-lg gradient-gaming px-4 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-30"
            >
              🔍 分析封面
            </button>
          </div>
        </div>
      </div>

      {/* B4: algorithm error */}
      {scoreError && (
        <div className="rounded-lg border border-gaming-warning/20 bg-gaming-warning/6 p-2 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-gaming-warning" />
          <p className="text-[10px] text-gaming-warning">{scoreError}</p>
        </div>
      )}

      {/* A1 metadata bar */}
      {lastCall && (
        <div className="flex items-center gap-3 text-[9px] text-muted-foreground/55 font-mono bg-white/[0.02] rounded-lg border border-border px-3 py-1.5">
          <span>ID: {lastCall.requestId.slice(0, 16)}</span>
          <span className="text-muted-foreground/20">|</span>
          <span>模式: {lastCall.mode}</span>
          <span className="text-muted-foreground/20">|</span>
          <span>耗时: {lastCall.durationMs}ms</span>
          <span className="text-muted-foreground/20">|</span>
          <span className={lastCall.cacheHit ? 'text-gaming-success' : 'text-muted-foreground/55'}>
            {lastCall.cacheHit ? '缓存命中' : '直接调用'}
          </span>
        </div>
      )}

      {/* Score dashboard */}
      {coverScore && (
        <>
          {/* Overall score */}
          <div className="glass-card rounded-xl p-4">
            <div className="text-center">
              <div
                className="mx-auto h-24 w-24 rounded-full border-4 flex items-center justify-center"
                style={{
                  borderColor:
                    coverScore.overall >= 80
                      ? 'rgba(34,197,94,0.5)'
                      : coverScore.overall >= 60
                      ? 'rgba(250,204,21,0.5)'
                      : 'rgba(239,68,68,0.5)',
                }}
              >
                <span className={`text-3xl font-bold font-mono ${
                  coverScore.overall >= 80 ? 'text-gaming-success' :
                  coverScore.overall >= 60 ? 'text-gaming-warning' :
                  'text-gaming-error'
                }`}>
                  {coverScore.overall}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-foreground">综合评分</p>
              <p className="text-[10px] text-muted-foreground/55">
                加权: {COVER_DIMENSION_WEIGHTS.map((w) => `${(w * 100).toFixed(0)}%`).join(' · ')}
              </p>
            </div>
          </div>

          {/* Dimension scores */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {dimensionData.map(({ dim, label, score, weight, Icon: DimIcon }) => (
              <div key={dim} className="glass-card rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DimIcon className="h-4 w-4 text-muted-foreground/55" />
                  <p className="text-xs font-medium text-foreground">{label}</p>
                  <span className="text-[9px] text-muted-foreground/40">权重 {(weight * 100).toFixed(0)}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-white/[0.04] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${score}%`,
                        backgroundColor: score >= 80
                          ? 'rgba(34,197,94,0.6)'
                          : score >= 60
                          ? 'rgba(250,204,21,0.6)'
                          : 'rgba(239,68,68,0.6)',
                      }}
                    />
                  </div>
                  <span className="text-sm font-mono font-semibold text-foreground w-8 text-right">{score}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Suggestions */}
          <div className="glass-card rounded-xl p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">改进建议</h3>
            <div className="space-y-2">
              {coverScore.suggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg border border-border bg-white/[0.02] p-3">
                  <span className="shrink-0 inline-flex items-center justify-center h-5 w-5 rounded-full bg-gaming-purple/15 text-gaming-purple text-[9px] font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-xs text-muted-foreground/75">{s}</p>
                </div>
              ))}
            </div>
            {/* A6: writeback hint */}
            <p className="mt-3 text-[9px] text-gaming-cyan/60">
              → 建议可回写封面工坊 #cover 建议区
            </p>
          </div>
        </>
      )}
    </div>
  );
}
