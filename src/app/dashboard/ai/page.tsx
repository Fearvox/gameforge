'use client';

import { useEffect, useState, useCallback } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { useAIStore } from '@/lib/ai-store';
import AutoTagger from '@/components/ai/auto-tagger';
import CoverScorer from '@/components/ai/cover-scorer';
import HighlightDetector from '@/components/ai/highlight-detector';
import SubtitleGenerator from '@/components/ai/subtitle-generator';

const TABS = [
  { id: 'autoTag', label: '自动标签', icon: '🏷️' },
  { id: 'coverScore', label: '封面评分', icon: '🖼️' },
  { id: 'highlightDetect', label: '高光检测', icon: '✂️' },
  { id: 'subtitle', label: '字幕生成', icon: '📝' },
];

/* ── A9: Skeleton loading ── */
function AISkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="glass-card rounded-xl p-4">
        <div className="mb-3 h-4 w-24 rounded bg-white/5" />
        <div className="space-y-3">
          <div className="h-9 w-full rounded bg-white/5" />
          <div className="h-24 w-full rounded bg-white/5" />
          <div className="h-8 w-32 rounded bg-white/5" />
        </div>
      </div>
      <div className="glass-card rounded-xl p-4">
        <div className="mb-3 h-4 w-32 rounded bg-white/5" />
        <div className="h-[300px] rounded bg-white/[0.02]" />
      </div>
    </div>
  );
}

/* ── B1: Empty state ── */
function AIEmptyState({ onLoadDemo }: { onLoadDemo: () => void }) {
  return (
    <div className="glass-card rounded-xl p-12 text-center">
      <Sparkles className="mx-auto h-12 w-12 text-muted-foreground/30" />
      <h3 className="mt-4 text-sm font-semibold text-foreground">暂无 AI 数据</h3>
      <p className="mt-1 text-xs text-muted-foreground/55">
        加载演示数据探索 AI 智能功能：自动标签 · 封面评分 · 高光检测 · 字幕生成
      </p>
      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          onClick={onLoadDemo}
          className="rounded-lg gradient-gaming px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
        >
          加载演示数据
        </button>
      </div>
    </div>
  );
}

/* ── B4: Algorithm error banner ── */
function AlgorithmErrorBanner() {
  const { algorithmErrors, retryCompute } = useAIStore();
  const errorEntries = Object.entries(algorithmErrors).filter(([, v]) => v !== null);

  if (errorEntries.length === 0) return null;

  return (
    <div className="rounded-lg border border-gaming-warning/20 bg-gaming-warning/6 p-3">
      <p className="text-xs font-medium text-gaming-warning">
        ⚠ 部分计算出现异常（{errorEntries.length} 项）
      </p>
      <div className="mt-1.5 space-y-1">
        {errorEntries.map(([key, msg]) => (
          <div key={key} className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground/55 min-w-[80px]">{key}</span>
            <span className="flex-1 text-[9px] text-gaming-warning/80 truncate">{msg}</span>
            <button
              onClick={() => retryCompute(key)}
              className="shrink-0 text-[9px] font-medium text-gaming-warning hover:underline"
            >
              重试
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function AIPage() {
  const { loadMockData, loading, callLog } = useAIStore();
  const [selectedTab, setSelectedTab] = useState('autoTag');

  const hasData = callLog.length > 0;

  /* Auto-load demo data on mount */
  useEffect(() => {
    loadMockData();
  }, [loadMockData]);

  const handleRefresh = useCallback(() => {
    loadMockData();
  }, [loadMockData]);

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl gradient-gaming flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">AI 智能</h1>
            <p className="text-xs text-muted-foreground/55">自动标签 · 封面评分 · 高光检测 · 字幕生成</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground/55 rounded-lg border border-border bg-background/30 px-3 py-1.5">
            WASM 本地 · 云端 ASR
          </span>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1 rounded-lg border border-border bg-background/30 px-3 py-1.5 text-[10px] text-muted-foreground/55 transition-colors hover:text-foreground"
          >
            <RefreshCw className="h-3 w-3" />
            刷新
          </button>
        </div>
      </div>

      {/* B4: algorithm error banner */}
      <AlgorithmErrorBanner />

      {/* Tab bar */}
      {hasData && (
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-all ${
                selectedTab === tab.id
                  ? 'bg-gaming-purple/15 border border-gaming-purple/30 text-gaming-purple'
                  : 'bg-background/50 border border-transparent text-muted-foreground/55 hover:text-foreground'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Tab content */}
      <div className="min-h-[500px]">
        {loading ? (
          <AISkeleton />
        ) : !hasData ? (
          <AIEmptyState onLoadDemo={handleRefresh} />
        ) : (
          <>
            {selectedTab === 'autoTag' && <AutoTagger />}
            {selectedTab === 'coverScore' && <CoverScorer />}
            {selectedTab === 'highlightDetect' && <HighlightDetector />}
            {selectedTab === 'subtitle' && <SubtitleGenerator />}
          </>
        )}
      </div>
    </div>
  );
}
