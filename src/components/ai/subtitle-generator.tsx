'use client';

import { useState, useMemo } from 'react';
import { AlertTriangle, Edit3, Download, RefreshCw } from 'lucide-react';
import { useAIStore, SUBTITLE_EXPORT_FORMATS } from '@/lib/ai-store';

function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const msRemain = Math.floor((ms % 1000));
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(msRemain).padStart(3, '0')}`;
}

function formatMsShort(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}

export default function SubtitleGenerator() {
  const {
    subtitleBlocks, subtitleMode, callLog,
    computeSubtitles, setSubtitleMode, editSubtitleBlock,
    capabilityToggles, algorithmErrors,
  } = useAIStore();
  const subError = algorithmErrors.subtitle;
  const enabled = capabilityToggles.subtitle;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const lastCall = useMemo(
    () => callLog.filter((l) => l.capability === 'subtitle').at(-1) ?? null,
    [callLog],
  );

  const editedCount = subtitleBlocks.filter((b) => b.edited).length;

  const handleStartEdit = (block: typeof subtitleBlocks[0]) => {
    setEditingId(block.id);
    setEditText(block.text);
  };

  const handleSaveEdit = () => {
    if (editingId && editText.trim()) {
      editSubtitleBlock(editingId, editText.trim());
    }
    setEditingId(null);
    setEditText('');
  };

  const handleExport = (format: string) => {
    let content = '';
    if (format === 'srt') {
      content = subtitleBlocks
        .map((b, i) => {
          const start = formatMs(b.startMs).replace('.', ',');
          const end = formatMs(b.endMs).replace('.', ',');
          return `${i + 1}\n${start} --> ${end}\n${b.text}\n`;
        })
        .join('\n');
    } else if (format === 'vtt') {
      content = 'WEBVTT\n\n' + subtitleBlocks
        .map((b) => {
          const start = formatMs(b.startMs);
          const end = formatMs(b.endMs);
          return `${start} --> ${end}\n${b.text}\n`;
        })
        .join('\n');
    }
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subtitles.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="glass-card rounded-xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">字幕生成</h3>
          {!enabled && (
            <span className="text-[9px] text-muted-foreground/55 bg-white/5 rounded-full px-2 py-0.5">
              已禁用
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground/55">引擎:</span>
            <div className="flex rounded border border-border overflow-hidden">
              <button
                onClick={() => setSubtitleMode('local')}
                className={`px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
                  subtitleMode === 'local' ? 'bg-gaming-purple/15 text-gaming-purple' : 'bg-background/30 text-muted-foreground/55'
                }`}
                disabled={!enabled}
              >
                WASM 本地
              </button>
              <button
                onClick={() => setSubtitleMode('remote')}
                className={`px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
                  subtitleMode === 'remote' ? 'bg-gaming-purple/15 text-gaming-purple' : 'bg-background/30 text-muted-foreground/55'
                }`}
                disabled={!enabled}
              >
                云端 ASR
              </button>
            </div>
          </div>
          <button
            onClick={() => computeSubtitles()}
            disabled={!enabled}
            className="rounded-lg gradient-gaming px-4 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-30"
          >
            <RefreshCw className="h-3 w-3 inline mr-1" />
            生成字幕
          </button>
        </div>
        {subtitleMode === 'remote' && (
          <p className="mt-2 text-[9px] text-gaming-warning/60 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            云端模式：仅上传最小必要音频片段，不传完整视频
          </p>
        )}
      </div>

      {/* B4: algorithm error */}
      {subError && (
        <div className="rounded-lg border border-gaming-warning/20 bg-gaming-warning/6 p-2 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-gaming-warning" />
          <p className="text-[10px] text-gaming-warning">{subError}</p>
        </div>
      )}

      {/* B8: fallback mode (reachable even with subError after B5 silent degrade) */}
      {subtitleBlocks.length === 0 && (lastCall || subError) && (
        <div className="glass-card rounded-xl p-6 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-gaming-warning/40" />
          <p className="mt-2 text-sm font-medium text-gaming-warning">字幕生成为空</p>
          <p className="mt-1 text-xs text-muted-foreground/55">
            尝试切换引擎模式或导入已有字幕文件
          </p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <button
              onClick={() => setSubtitleMode('local')}
              className="rounded-lg border border-border bg-background/50 px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"
            >
              切换本地 WASM
            </button>
            <button className="rounded-lg border border-border bg-background/50 px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors">
              导入 SRT/VTT
            </button>
          </div>
        </div>
      )}

      {/* A1 metadata bar */}
      {lastCall && subtitleBlocks.length > 0 && (
        <div className="flex items-center gap-3 text-[9px] text-muted-foreground/55 font-mono bg-white/[0.02] rounded-lg border border-border px-3 py-1.5">
          <span>ID: {lastCall.requestId.slice(0, 16)}</span>
          <span className="text-muted-foreground/20">|</span>
          <span>模式: {lastCall.mode}</span>
          <span className="text-muted-foreground/20">|</span>
          <span>耗时: {lastCall.durationMs}ms</span>
          <span className="text-muted-foreground/20">|</span>
          <span>{subtitleBlocks.length} 句</span>
          <span className="text-muted-foreground/20">|</span>
          <span className={lastCall.cacheHit ? 'text-gaming-success' : 'text-muted-foreground/55'}>
            {lastCall.cacheHit ? '缓存命中' : '直接调用'}
          </span>
          {editedCount > 0 && (
            <>
              <span className="text-muted-foreground/20">|</span>
              <span className="text-gaming-cyan">已编辑 {editedCount}</span>
            </>
          )}
        </div>
      )}

      {/* Subtitle blocks */}
      {subtitleBlocks.length > 0 && (
        <>
          <div className="glass-card rounded-xl p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">字幕时间轴</h3>
              <div className="flex items-center gap-1">
                {SUBTITLE_EXPORT_FORMATS.map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => handleExport(fmt)}
                    className="flex items-center gap-1 rounded-md bg-white/5 text-muted-foreground/55 px-2 py-1 text-[9px] font-medium hover:bg-white/10 transition-colors"
                  >
                    <Download className="h-3 w-3" />
                    .{fmt}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {subtitleBlocks.map((b) => (
                <div
                  key={b.id}
                  className={`flex items-start gap-3 rounded-lg p-2.5 transition-colors ${
                    editingId === b.id
                      ? 'border border-gaming-purple/20 bg-gaming-purple/[0.03]'
                      : b.edited
                      ? 'bg-gaming-cyan/[0.02] hover:bg-white/[0.03]'
                      : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <span className="shrink-0 text-[9px] font-mono text-muted-foreground/40 w-14 pt-0.5">
                    {formatMsShort(b.startMs)}
                  </span>
                  {editingId === b.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 rounded border border-gaming-purple/30 bg-background/50 px-2 py-1 text-xs text-foreground outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                      />
                      <button
                        onClick={handleSaveEdit}
                        className="rounded-md bg-gaming-purple/15 text-gaming-purple px-2 py-1 text-[9px] font-medium"
                      >
                        保存
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="flex-1 text-xs text-foreground">{b.text}</p>
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] font-mono text-muted-foreground/40">
                          {(b.confidence * 100).toFixed(0)}%
                        </span>
                        {b.edited && (
                          <span className="text-[8px] text-gaming-cyan bg-gaming-cyan/10 rounded-full px-1.5 py-0.5">
                            已编辑
                          </span>
                        )}
                        <button
                          onClick={() => handleStartEdit(b)}
                          className="rounded p-1 text-muted-foreground/40 hover:text-foreground transition-colors"
                        >
                          <Edit3 className="h-3 w-3" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* A6: writeback hint */}
          <p className="text-[9px] text-gaming-cyan/60 px-1">
            → 术语词典匹配已启用（游戏词汇替换） · 字幕可导出后导入剪辑工具
          </p>
        </>
      )}
    </div>
  );
}
