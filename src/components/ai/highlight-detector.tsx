'use client';

import { useMemo } from 'react';
import { Scissors, AlertTriangle, Check, X } from 'lucide-react';
import { useAIStore, HIGHLIGHT_DETECT_LEVELS, HIGHLIGHT_MAX_SEGMENTS } from '@/lib/ai-store';

function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}

export default function HighlightDetector() {
  const {
    highlightSegments, highlightLevel, callLog,
    computeHighlights, setHighlightLevel,
    acceptHighlight, rejectHighlight,
    capabilityToggles, algorithmErrors,
  } = useAIStore();
  const hlError = algorithmErrors.highlightDetect;
  const enabled = capabilityToggles.highlightDetect;

  const lastCall = useMemo(
    () => callLog.filter((l) => l.capability === 'highlightDetect').at(-1) ?? null,
    [callLog],
  );

  const acceptedCount = highlightSegments.filter((h) => h.accepted === true).length;
  const rejectedCount = highlightSegments.filter((h) => h.accepted === false).length;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="glass-card rounded-xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">智能高光检测</h3>
          {!enabled && (
            <span className="text-[9px] text-muted-foreground/55 bg-white/5 rounded-full px-2 py-0.5">
              已禁用
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground/55">检测灵敏度:</span>
            <select
              value={highlightLevel}
              onChange={(e) => setHighlightLevel(e.target.value as typeof highlightLevel)}
              className="rounded-lg border border-border bg-background/30 px-3 py-1.5 text-[10px] text-foreground outline-none focus:border-gaming-purple/30"
              disabled={!enabled}
            >
              {HIGHLIGHT_DETECT_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l === 'conservative' ? '保守' : l === 'balanced' ? '平衡' : '激进'}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => computeHighlights()}
            disabled={!enabled}
            className="rounded-lg gradient-gaming px-4 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-30"
          >
            🔍 检测高光
          </button>
        </div>
      </div>

      {/* B4: algorithm error */}
      {hlError && (
        <div className="rounded-lg border border-gaming-warning/20 bg-gaming-warning/6 p-2 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-gaming-warning" />
          <p className="text-[10px] text-gaming-warning">{hlError}</p>
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
          <span>{highlightSegments.length} 片段 · 灵敏度: {
            highlightLevel === 'conservative' ? '保守' : highlightLevel === 'balanced' ? '平衡' : '激进'
          }</span>
        </div>
      )}

      {/* Summary */}
      {highlightSegments.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card rounded-xl p-3 text-center">
            <p className="text-[10px] text-muted-foreground/55">检测到</p>
            <p className="text-lg font-semibold font-mono text-gaming-purple">{highlightSegments.length}</p>
            <p className="text-[9px] text-muted-foreground/55">/ {HIGHLIGHT_MAX_SEGMENTS} 片段</p>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <p className="text-[10px] text-muted-foreground/55">已接受</p>
            <p className="text-lg font-semibold font-mono text-gaming-success">{acceptedCount}</p>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <p className="text-[10px] text-muted-foreground/55">已忽略</p>
            <p className="text-lg font-semibold font-mono text-gaming-error">{rejectedCount}</p>
          </div>
        </div>
      )}

      {/* Highlight segments */}
      {highlightSegments.length > 0 && (
        <div className="glass-card rounded-xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">检测片段</h3>
            <span className="text-[10px] text-muted-foreground/55">可拖拽微调 · 回写剪辑时间线</span>
          </div>
          <div className="space-y-3">
            {highlightSegments.map((h) => (
              <div
                key={h.id}
                className={`rounded-lg border p-3 transition-colors ${
                  h.accepted === true
                    ? 'border-gaming-success/30 bg-gaming-success/[0.03]'
                    : h.accepted === false
                    ? 'border-gaming-error/10 bg-gaming-error/[0.02] opacity-50'
                    : 'border-border bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Scissors className="h-3.5 w-3.5 text-gaming-purple" />
                    <span className="text-sm font-mono font-semibold text-foreground">
                      {formatMs(h.startMs)} – {formatMs(h.endMs)}
                    </span>
                    <span className="text-[9px] text-muted-foreground/55">
                      ({Math.round((h.endMs - h.startMs) / 1000)}s)
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {h.accepted === null ? (
                      <>
                        <button
                          onClick={() => acceptHighlight(h.id)}
                          className="rounded-md bg-gaming-success/15 text-gaming-success p-1.5 hover:bg-gaming-success/25 transition-colors"
                          title="接受"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => rejectHighlight(h.id)}
                          className="rounded-md bg-gaming-error/15 text-gaming-error p-1.5 hover:bg-gaming-error/25 transition-colors"
                          title="忽略"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <span className={`text-[9px] font-medium rounded-full px-2 py-0.5 ${
                        h.accepted
                          ? 'bg-gaming-success/15 text-gaming-success'
                          : 'bg-gaming-error/15 text-gaming-error'
                      }`}>
                        {h.accepted ? '已接受' : '已忽略'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Score bar */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground/55 w-8">得分</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${h.score}%`,
                        backgroundColor: h.score >= 80
                          ? 'rgba(34,197,94,0.6)'
                          : h.score >= 60
                          ? 'rgba(250,204,21,0.6)'
                          : 'rgba(239,68,68,0.6)',
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-semibold text-foreground w-8 text-right">{h.score}</span>
                </div>

                {/* Triggers */}
                <div className="mt-2 flex flex-wrap gap-1">
                  {h.triggers.map((t, i) => (
                    <span key={i} className="inline-flex items-center rounded-full bg-white/5 text-[8px] text-muted-foreground/55 px-2 py-0.5">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {/* A6: writeback hint */}
          <p className="mt-3 text-[9px] text-gaming-cyan/60">
            → 已接受片段可回写 #cut 剪辑时间线
          </p>
        </div>
      )}
    </div>
  );
}
