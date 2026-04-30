'use client';

import { RotateCw, X, AlertTriangle, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { useCutStore, type ExportTask, type ExportStatus } from '@/lib/cut-store';

/* ── Properties Tab ── */

function PropertiesPanel() {
  const { getSelectedClip, updateClip } = useCutStore();
  const clip = getSelectedClip();

  if (!clip) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-[11px] text-muted-foreground">选中片段以查看属性</p>
        <p className="mt-1 text-[10px] text-muted-foreground/60">点击时间线上的片段</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[10px] text-muted-foreground">选中片段</p>
        <p className="text-xs font-semibold text-foreground">{clip.name}</p>
      </div>

      {/* Metadata rows */}
      <div className="space-y-2">
        <MetaRow label="时长" value={`${formatTime(clip.duration)}.00`} />
        <MetaRow label="入点" value={`${formatTime(clip.inPoint)}.00`} />
        <MetaRow label="出点" value={`${formatTime(clip.outPoint)}.00`} />

        {/* Volume slider */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">音量</span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={100}
              value={clip.volume}
              onChange={(e) => updateClip(clip.id, { volume: Number(e.target.value) })}
              className="w-24 h-1 accent-gaming-blue"
            />
            <span className="w-8 text-right text-[9px] text-muted-foreground">{clip.volume}%</span>
          </div>
        </div>

        {/* Opacity slider */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">不透明度</span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={100}
              value={clip.opacity}
              onChange={(e) => updateClip(clip.id, { opacity: Number(e.target.value) })}
              className="w-24 h-1 accent-gaming-cyan"
            />
            <span className="w-8 text-right text-[9px] text-muted-foreground">{clip.opacity}%</span>
          </div>
        </div>
      </div>

      {/* Speed control */}
      <div>
        <span className="text-[10px] text-muted-foreground">速度</span>
        <div className="mt-1 flex gap-1.5">
          {[0.5, 1, 1.5, 2].map((s) => (
            <button
              key={s}
              onClick={() => updateClip(clip.id, { speed: s })}
              className={`rounded-md px-2.5 py-1 text-[10px] font-medium transition-colors ${
                clip.speed === s
                  ? 'bg-gaming-blue/15 text-gaming-blue'
                  : 'bg-muted/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className="font-mono text-[10px] text-foreground/70">{value}</span>
    </div>
  );
}

/* ── Effects Tab ── */

function EffectsPanel() {
  const effects = [
    { icon: '🌅', name: '电影滤镜' },
    { icon: '✨', name: '高光增强' },
    { icon: '🎭', name: '复古胶片' },
  ];

  return (
    <div className="space-y-2">
      <p className="text-[10px] text-muted-foreground">快速效果</p>
      <div className="grid grid-cols-3 gap-1.5">
        {effects.map((e) => (
          <button
            key={e.name}
            className="flex flex-col items-center gap-1 rounded-lg border border-border bg-muted/30 py-3 transition-colors hover:border-gaming-purple/30 hover:bg-gaming-purple/6"
          >
            <span className="text-base">{e.icon}</span>
            <span className="text-[8px] text-muted-foreground">{e.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Render Queue (A5/B2) ── */

const statusConfig: Record<ExportStatus, { icon: React.ReactNode; color: string; label: string }> = {
  queued: { icon: <Clock className="h-3 w-3" />, color: 'text-muted-foreground', label: '排队中' },
  rendering: { icon: <Loader2 className="h-3 w-3 animate-spin" />, color: 'text-gaming-blue', label: '渲染中' },
  success: { icon: <CheckCircle2 className="h-3 w-3" />, color: 'text-gaming-success', label: '完成' },
  failed: { icon: <X className="h-3 w-3" />, color: 'text-gaming-error', label: '失败' },
  'needs-action': { icon: <AlertTriangle className="h-3 w-3" />, color: 'text-gaming-warning', label: '需处理' },
};

function ExportRow({ task }: { task: ExportTask }) {
  const { cancelExport, retryExport } = useCutStore();
  const config = statusConfig[task.status];

  return (
    <div className={`rounded-lg border p-2 ${
      task.status === 'rendering' ? 'border-gaming-blue/15 bg-gaming-blue/6'
      : task.status === 'failed' || task.status === 'needs-action' ? 'border-gaming-error/20 bg-gaming-error/6'
      : task.status === 'success' ? 'border-gaming-success/20 bg-gaming-success/6'
      : 'border-border bg-muted/30'
    }`}>
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-medium text-foreground">{task.name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className={config.color}>{config.icon}</span>
            <span className={`text-[9px] ${config.color}`}>
              {task.status === 'rendering' ? `${config.label} ${task.progress}% · ${task.resolution}`
                : task.status === 'queued' ? `${config.label} · ${task.resolution}`
                : task.status === 'needs-action' ? task.failReason
                : task.failReason ?? config.label}
            </span>
          </div>
        </div>
        <span className={`text-[9px] font-medium ${config.color}`}>
          {task.status === 'rendering' ? `${task.progress}%` : ''}
        </span>
      </div>

      {/* Progress bar for rendering */}
      {task.status === 'rendering' && (
        <div className="mt-1 h-1 w-full rounded-full bg-muted">
          <div className="h-full rounded-full bg-gaming-blue transition-all" style={{ width: `${task.progress}%` }} />
        </div>
      )}

      {/* B2: CTA for failed/needs-action */}
      {(task.status === 'failed' || task.status === 'needs-action') && (
        <div className="mt-1.5 flex gap-1.5">
          <button
            onClick={() => retryExport(task.id)}
            className="flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-medium text-gaming-error transition-colors hover:bg-gaming-error/10"
          >
            <RotateCw className="h-2.5 w-2.5" />
            {task.cta ?? '重试'}
          </button>
          <button
            onClick={() => cancelExport(task.id)}
            className="rounded px-2 py-0.5 text-[9px] text-muted-foreground hover:text-foreground"
          >
            取消
          </button>
        </div>
      )}

      {/* Cancel for queued/rendering */}
      {(task.status === 'queued' || task.status === 'rendering') && (
        <button
          onClick={() => cancelExport(task.id)}
          className="mt-1 text-[9px] text-muted-foreground hover:text-foreground"
        >
          取消
        </button>
      )}
    </div>
  );
}

function RenderQueue() {
  const { exports, exportConcurrency } = useCutStore();
  const activeCount = exports.filter((e) => e.status === 'rendering').length;

  if (exports.length === 0) {
    return (
      <div className="py-4 text-center">
        <p className="text-[10px] text-muted-foreground">渲染队列为空</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-foreground">渲染队列</span>
        <span className="text-[10px] text-muted-foreground">{activeCount} / {exportConcurrency}</span>
      </div>
      {exports.map((task) => (
        <ExportRow key={task.id} task={task} />
      ))}
    </div>
  );
}

/* ── Main Right Panel ── */

export default function RightPanel() {
  const { rightPanelTab, setRightPanelTab } = useCutStore();

  const tabs = [
    { key: 'properties' as const, label: '属性' },
    { key: 'effects' as const, label: '特效' },
    { key: 'transitions' as const, label: '转场' },
  ];

  return (
    <div className="flex h-full flex-col border-l border-border bg-sidebar overflow-hidden">
      {/* Tab switcher */}
      <div className="flex gap-1 border-b border-border p-2">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setRightPanelTab(key)}
            className={`rounded-md px-3 py-1 text-[10px] font-semibold transition-colors ${
              rightPanelTab === key
                ? 'bg-gaming-blue/15 text-gaming-blue'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto p-3">
        {rightPanelTab === 'properties' && <PropertiesPanel />}
        {rightPanelTab === 'effects' && <EffectsPanel />}
        {rightPanelTab === 'transitions' && (
          <div className="py-4 text-center">
            <p className="text-[10px] text-muted-foreground">转场效果开发中</p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Render queue */}
      <div className="max-h-[200px] overflow-y-auto p-3">
        <RenderQueue />
      </div>
    </div>
  );
}

/* ── helpers ── */

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
