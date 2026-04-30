'use client';

import { useState, useMemo } from 'react';
import { Tag, AlertTriangle, CheckCircle, XCircle, Plus } from 'lucide-react';
import { useAIStore, TAG_TOP_N, TAG_LOW_CONFIDENCE_THRESHOLD } from '@/lib/ai-store';

export default function AutoTagger() {
  const {
    tagSuggestions, appliedTags, callLog,
    computeAutoTags, applyTags, clearTags,
    capabilityToggles,
    algorithmErrors,
  } = useAIStore();
  const tagError = algorithmErrors.autoTag;

  const [title, setTitle] = useState('【原神】4.7深渊12层满星阵容推荐');
  const [danmaku, setDanmaku] = useState('666\n太强了\n4.7太强了\n周本速通');

  const enabled = capabilityToggles.autoTag;

  const lastCall = useMemo(
    () => callLog.filter((l) => l.capability === 'autoTag').at(-1) ?? null,
    [callLog],
  );

  const handleAnalyze = () => {
    const danmakuLines = danmaku.split('\n').filter((l) => l.trim());
    computeAutoTags({ title, danmaku: danmakuLines, comments: [] });
  };

  const handleApplyAll = () => {
    const highConfTags = tagSuggestions
      .filter((t) => t.confidence >= TAG_LOW_CONFIDENCE_THRESHOLD)
      .map((t) => t.tag);
    applyTags(highConfTags);
  };

  const sortedTags = useMemo(
    () => [...tagSuggestions].sort((a, b) => b.confidence - a.confidence).slice(0, TAG_TOP_N),
    [tagSuggestions],
  );

  return (
    <div className="space-y-4">
      {/* Input area */}
      <div className="glass-card rounded-xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">内容输入</h3>
          {!enabled && (
            <span className="text-[9px] text-muted-foreground/55 bg-white/5 rounded-full px-2 py-0.5">
              已禁用
            </span>
          )}
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-muted-foreground/55 mb-1 block">视频标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-border bg-background/30 px-3 py-2 text-xs text-foreground outline-none focus:border-gaming-purple/30"
              disabled={!enabled}
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground/55 mb-1 block">弹幕样本（每行一条）</label>
            <textarea
              value={danmaku}
              onChange={(e) => setDanmaku(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-border bg-background/30 px-3 py-2 text-xs text-foreground outline-none focus:border-gaming-purple/30 resize-none"
              disabled={!enabled}
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={!enabled}
            className="rounded-lg gradient-gaming px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-30"
          >
            🔍 分析标签
          </button>
        </div>
      </div>

      {/* B4: algorithm error */}
      {tagError && (
        <div className="rounded-lg border border-gaming-warning/20 bg-gaming-warning/6 p-2 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-gaming-warning" />
          <p className="text-[10px] text-gaming-warning">{tagError}</p>
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

      {/* Tag suggestions */}
      {sortedTags.length > 0 && (
        <div className="glass-card rounded-xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">标签建议 TOP {sortedTags.length}</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleApplyAll}
                className="rounded-md bg-gaming-purple/15 text-gaming-purple px-2.5 py-1 text-[9px] font-medium hover:bg-gaming-purple/25 transition-colors"
              >
                一键应用高置信度
              </button>
              <button
                onClick={clearTags}
                className="rounded-md bg-white/5 text-muted-foreground/55 px-2.5 py-1 text-[9px] font-medium hover:bg-white/10 transition-colors"
              >
                清除
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {sortedTags.map((t) => {
              const isLowConf = t.confidence < TAG_LOW_CONFIDENCE_THRESHOLD;
              const isApplied = appliedTags.includes(t.tag);

              return (
                <div key={t.tag} className="flex items-center gap-3 rounded-lg border border-border bg-white/[0.02] p-3">
                  <Tag className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">{t.tag}</span>
                      <span className={`text-[9px] font-mono ${
                        t.confidence >= 0.8 ? 'text-gaming-success' :
                        isLowConf ? 'text-gaming-warning' :
                        'text-muted-foreground/55'
                      }`}>
                        {(t.confidence * 100).toFixed(0)}%
                      </span>
                      {isLowConf && (
                        <span className="text-[8px] text-gaming-warning bg-gaming-warning/10 rounded-full px-1.5 py-0.5">
                          低置信度·不自动应用
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[9px] text-muted-foreground/55">
                      {t.evidence} · 来源: {t.source === 'title' ? '标题' : t.source === 'danmaku' ? '弹幕' : '评论'}
                    </p>
                    {/* Confidence bar */}
                    <div className="mt-1 h-1 rounded-full bg-white/[0.04] w-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(t.confidence * 100).toFixed(0)}%`,
                          backgroundColor: isLowConf
                            ? 'rgba(250,204,21,0.5)'
                            : 'rgba(168,85,247,0.5)',
                        }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      isApplied
                        ? applyTags(appliedTags.filter((a) => a !== t.tag))
                        : applyTags([...appliedTags, t.tag])
                    }
                    className={`shrink-0 rounded-md p-1.5 transition-colors ${
                      isApplied
                        ? 'bg-gaming-success/15 text-gaming-success'
                        : 'bg-white/5 text-muted-foreground/40 hover:text-foreground'
                    }`}
                  >
                    {isApplied ? <CheckCircle className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Applied tags summary */}
      {appliedTags.length > 0 && (
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-foreground">已应用标签</h3>
            <span className="text-[9px] text-gaming-success">准备回写 #assets</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {appliedTags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-gaming-purple/15 text-gaming-purple px-2.5 py-1 text-[10px] font-medium">
                {tag}
                <button onClick={() => applyTags(appliedTags.filter((a) => a !== tag))} className="hover:text-gaming-error transition-colors">
                  <XCircle className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
