'use client';

import { useState } from 'react';
import {
  Eye, EyeOff, Lock, Unlock,
  ArrowUp, ArrowDown, ChevronsUp, ChevronsDown,
  Trash2, Copy, RotateCw,
} from 'lucide-react';
import { useCoverStore, type RightPanelTab, type ExportTask } from '@/lib/cover-store';
import { useAssetsStore } from '@/lib/assets-store';

/* ── Status config for export queue (A6 — 5 states) ── */

const statusConfig: Record<string, { label: string; color: string; bg: string; borderColor: string }> = {
  queued: { label: '已排程', color: 'text-muted-foreground', bg: 'bg-background/20', borderColor: 'border-border' },
  pending: { label: '待完善', color: 'text-gaming-warning', bg: 'bg-gaming-warning/6', borderColor: 'border-gaming-warning/15' },
  rendering: { label: '渲染中', color: 'text-gaming-blue', bg: 'bg-gaming-blue/6', borderColor: 'border-gaming-blue/15' },
  success: { label: '已发布', color: 'text-gaming-success', bg: 'bg-gaming-success/6', borderColor: 'border-gaming-success/15' },
  failed: { label: '渲染失败', color: 'text-gaming-error', bg: 'bg-gaming-error/6', borderColor: 'border-gaming-error/15' },
  'needs-action': { label: '需人工处理', color: 'text-gaming-warning', bg: 'bg-gaming-warning/6', borderColor: 'border-gaming-warning/15' },
};

/* ── Export Row (A6) ── */

function ExportRow({ task }: { task: ExportTask }) {
  const { cancelExport, retryExport, removeExport } = useCoverStore();
  const cfg = statusConfig[task.status] ?? statusConfig.queued;

  return (
    <div className={`rounded-lg border p-2 transition-colors ${cfg.bg} ${cfg.borderColor}`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-medium text-foreground">{task.name}</p>
          <p className={`text-[9px] ${cfg.color}`}>
            {task.status === 'rendering' && `导出中... ${task.resolution}`}
            {task.status === 'queued' && `等待中 · ${task.resolution}`}
            {task.status === 'pending' && `${task.failReason ?? '待完善'}`}
            {task.status === 'success' && `已完成 · ${task.resolution}`}
            {task.status === 'failed' && `${task.failReason ?? '渲染失败'}`}
            {task.status === 'needs-action' && `${task.failReason ?? '需要处理'}`}
          </p>
        </div>
        {/* Progress % for rendering */}
        {task.status === 'rendering' && (
          <span className="text-[9px] font-medium text-gaming-blue">{task.progress}%</span>
        )}
      </div>

      {/* Progress bar (rendering) */}
      {task.status === 'rendering' && (
        <div className="mt-1 h-[3px] w-full rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gaming-blue transition-all"
            style={{ width: `${task.progress}%` }}
          />
        </div>
      )}

      {/* CTA buttons per status */}
      {task.status === 'pending' && (
        <div className="mt-1.5 flex gap-2">
          <button
            onClick={() => {
              // "进入编辑" → select first element to guide user to fix
              const firstEl = useCoverStore.getState().elements[0];
              if (firstEl) useCoverStore.getState().selectElement(firstEl.id);
            }}
            className="rounded-md bg-gaming-warning/10 px-2 py-0.5 text-[9px] font-medium text-gaming-warning transition-colors hover:bg-gaming-warning/20"
          >
            {task.cta ?? '进入编辑'}
          </button>
          <button
            onClick={() => removeExport(task.id)}
            className="text-[9px] text-muted-foreground hover:text-foreground"
          >
            移除
          </button>
        </div>
      )}
      {(task.status === 'failed' || task.status === 'needs-action') && (
        <div className="mt-1.5 flex gap-2">
          {task.status === 'failed' && (
            <button
              onClick={() => retryExport(task.id)}
              className="rounded-md bg-gaming-error/10 px-2 py-0.5 text-[9px] font-medium text-gaming-error transition-colors hover:bg-gaming-error/20"
            >
              重试
            </button>
          )}
          {task.status === 'needs-action' && (
            <button
              onClick={() => {}}
              className="rounded-md bg-gaming-warning/10 px-2 py-0.5 text-[9px] font-medium text-gaming-warning transition-colors hover:bg-gaming-warning/20"
            >
              {task.cta ?? '处理'}
            </button>
          )}
          <button
            onClick={() => removeExport(task.id)}
            className="text-[9px] text-muted-foreground hover:text-foreground"
          >
            移除
          </button>
        </div>
      )}

      {/* Success: view link */}
      {task.status === 'success' && (
        <div className="mt-1 flex gap-2">
          <button className="text-[9px] font-medium text-gaming-success hover:underline">
            查看文件
          </button>
          <button
            onClick={() => removeExport(task.id)}
            className="text-[9px] text-muted-foreground hover:text-foreground"
          >
            移除
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

/* ── Text Properties Panel (A3) ── */

function TextProperties() {
  const { elements, selectedId, updateTextProps, deleteElement, duplicateElement, lockElement } = useCoverStore();
  const el = elements.find((e) => e.id === selectedId && e.type === 'text');

  if (!el) {
    return (
      <div className="p-4 text-center">
        <p className="text-[10px] text-muted-foreground">选中一个文字元素以编辑属性</p>
      </div>
    );
  }

  const colorPresets = ['#ffffff', '#a855f7', '#3b82f6', '#06b6d4', '#eab308', '#ef4444'];

  return (
    <div className="space-y-3 p-3">
      {/* Element name + actions */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-foreground">{el.name}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => duplicateElement(el.id)} title="复制" className="p-1 text-muted-foreground/50 hover:text-foreground">
            <Copy className="h-3 w-3" />
          </button>
          <button onClick={() => lockElement(el.id)} title={el.locked ? '解锁' : '锁定'} className="p-1 text-muted-foreground/50 hover:text-foreground">
            {el.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
          </button>
          <button onClick={() => deleteElement(el.id)} title="删除" className="p-1 text-muted-foreground/50 hover:text-gaming-error">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Font family */}
      <div>
        <label className="text-[10px] text-muted-foreground/60">字体</label>
        <select
          value={el.fontFamily}
          onChange={(e) => updateTextProps(el.id, { fontFamily: e.target.value })}
          className="mt-1 w-full rounded-md border border-border bg-background/50 px-2 py-1 text-[9px] text-foreground/70 outline-none"
        >
          <option value="Geist Bold">Geist Bold</option>
          <option value="Geist Sans">Geist Sans</option>
          <option value="Geist Mono">Geist Mono</option>
        </select>
      </div>

      {/* Font size */}
      <div className="flex items-center gap-2">
        <label className="w-12 text-[10px] text-muted-foreground/60">字号</label>
        <input
          type="number"
          value={el.fontSize ?? 24}
          onChange={(e) => updateTextProps(el.id, { fontSize: Number(e.target.value) })}
          className="w-16 rounded-md border border-border bg-background/50 px-2 py-1 text-center text-[9px] text-foreground/70 outline-none"
        />
        <button
          onClick={() => updateTextProps(el.id, { fontSize: (el.fontSize ?? 24) + 2 })}
          className="rounded-md bg-background/50 px-1.5 py-1 text-[10px] text-muted-foreground/55 hover:text-foreground"
        >
          +
        </button>
        <button
          onClick={() => updateTextProps(el.id, { fontSize: Math.max(8, (el.fontSize ?? 24) - 2) })}
          className="rounded-md bg-background/50 px-1.5 py-1 text-[10px] text-muted-foreground/55 hover:text-foreground"
        >
          −
        </button>
      </div>

      {/* Color presets */}
      <div>
        <label className="text-[10px] text-muted-foreground/60">颜色</label>
        <div className="mt-1 flex gap-1.5">
          {colorPresets.map((c) => (
            <button
              key={c}
              onClick={() => updateTextProps(el.id, { color: c })}
              className={`h-6 w-6 rounded-md border transition-all ${
                el.color === c ? 'border-gaming-blue ring-1 ring-gaming-blue' : 'border-border'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Stroke width */}
      <div className="flex items-center gap-2">
        <label className="w-12 text-[10px] text-muted-foreground/60">描边</label>
        <input
          type="number"
          value={el.strokeWidth ?? 0}
          onChange={(e) => updateTextProps(el.id, { strokeWidth: Number(e.target.value) })}
          className="w-16 rounded-md border border-border bg-background/50 px-2 py-1 text-center text-[9px] text-foreground/70 outline-none"
        />
        <span className="text-[9px] text-muted-foreground/40">px</span>
      </div>

      {/* Shadow */}
      <div className="flex items-center gap-2">
        <label className="w-12 text-[10px] text-muted-foreground/60">阴影</label>
        <span className="text-[9px] text-foreground/70">
          偏移 {el.shadowOffsetY ?? 0}px · 模糊 {el.shadowBlur ?? 0}px
        </span>
      </div>

      {/* Line height */}
      <div className="flex items-center gap-2">
        <label className="w-12 text-[10px] text-muted-foreground/60">行高</label>
        <input
          type="number"
          step="0.1"
          value={el.lineHeight ?? 1.4}
          onChange={(e) => updateTextProps(el.id, { lineHeight: Number(e.target.value) })}
          className="w-16 rounded-md border border-border bg-background/50 px-2 py-1 text-center text-[9px] text-foreground/70 outline-none"
        />
      </div>

      {/* Overflow warning (A3) */}
      {el.overflowWarning && (
        <div className="rounded-md border border-gaming-warning/15 bg-gaming-warning/6 p-2">
          <p className="text-[8px] font-medium text-gaming-warning">⚠ 文字超出画布边界</p>
          <p className="text-[7px] text-muted-foreground/55">建议缩短文案或减小字号</p>
        </div>
      )}

      {/* Layer actions */}
      <div className="flex items-center gap-1 border-t border-border pt-2">
        <button onClick={() => useCoverStore.getState().bringForward(el.id)} className="p-1 text-muted-foreground/50 hover:text-foreground" title="上移一层">
          <ArrowUp className="h-3 w-3" />
        </button>
        <button onClick={() => useCoverStore.getState().sendBackward(el.id)} className="p-1 text-muted-foreground/50 hover:text-foreground" title="下移一层">
          <ArrowDown className="h-3 w-3" />
        </button>
        <button onClick={() => useCoverStore.getState().bringToFront(el.id)} className="p-1 text-muted-foreground/50 hover:text-foreground" title="置顶">
          <ChevronsUp className="h-3 w-3" />
        </button>
        <button onClick={() => useCoverStore.getState().sendToBack(el.id)} className="p-1 text-muted-foreground/50 hover:text-foreground" title="置底">
          <ChevronsDown className="h-3 w-3" />
        </button>
        <button onClick={() => useCoverStore.getState().rotateElement(el.id, (el.rotation ?? 0) + 15)} className="p-1 text-muted-foreground/50 hover:text-foreground" title="旋转 15°">
          <RotateCw className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

/* ── A4: Crop Preview with draggable handles ── */

function CropPreview({ el }: { el: import('@/lib/cover-store').CanvasElement }) {
  const { updateImageProps } = useCoverStore();
  // Crop state: normalized 0-1
  const [crop, setCrop] = useState({ x: el.cropX ?? 0, y: el.cropY ?? 0, w: el.cropW ?? 1, h: el.cropH ?? 1 });
  const [dragging, setDragging] = useState<string | null>(null);

  function handleCropMouseDown(e: React.MouseEvent, corner: string) {
    e.stopPropagation();
    setDragging(corner);
    const startX = e.clientX;
    const startY = e.clientY;
    const origCrop = { ...crop };

    function onMove(ev: MouseEvent) {
      const dx = (ev.clientX - startX) / 120; // normalize to preview width
      const dy = (ev.clientY - startY) / 80;
      setCrop((prev) => {
        const next = { ...prev };
        switch (corner) {
          case 'se':
            next.w = Math.max(0.1, Math.min(1 - origCrop.x, origCrop.w + dx));
            next.h = Math.max(0.1, Math.min(1 - origCrop.y, origCrop.h + dy));
            break;
          case 'sw':
            next.x = Math.max(0, Math.min(origCrop.x + origCrop.w - 0.1, origCrop.x + dx));
            next.w = Math.max(0.1, origCrop.w - dx);
            next.h = Math.max(0.1, Math.min(1 - origCrop.y, origCrop.h + dy));
            break;
          case 'ne':
            next.y = Math.max(0, Math.min(origCrop.y + origCrop.h - 0.1, origCrop.y + dy));
            next.w = Math.max(0.1, Math.min(1 - origCrop.x, origCrop.w + dx));
            next.h = Math.max(0.1, origCrop.h - dy);
            break;
          case 'nw':
            next.x = Math.max(0, Math.min(origCrop.x + origCrop.w - 0.1, origCrop.x + dx));
            next.y = Math.max(0, Math.min(origCrop.y + origCrop.h - 0.1, origCrop.y + dy));
            next.w = Math.max(0.1, origCrop.w - dx);
            next.h = Math.max(0.1, origCrop.h - dy);
            break;
        }
        return next;
      });
    }

    function onUp() {
      setDragging(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  // Apply crop to element
  function applyCrop() {
    updateImageProps(el.id, { cropX: crop.x, cropY: crop.y, cropW: crop.w, cropH: crop.h });
  }

  // Reset crop
  function resetCrop() {
    setCrop({ x: 0, y: 0, w: 1, h: 1 });
    updateImageProps(el.id, { cropX: 0, cropY: 0, cropW: 1, cropH: 1 });
  }

  // Fit to canvas
  function fitToCanvas() {
    setCrop({ x: 0, y: 0, w: 1, h: 1 });
    updateImageProps(el.id, { cropX: 0, cropY: 0, cropW: 1, cropH: 1, fit: 'cover' });
  }

  return (
    <>
      <div className="relative flex h-24 items-center justify-center rounded-lg border border-gaming-blue/20 bg-background/30">
        <div className="absolute inset-0 rounded-lg bg-black/20" />
        {/* Crop frame — positioned by crop state */}
        <div
          className="absolute border-[1.5px] border-dashed border-gaming-blue/60 bg-gaming-blue/5"
          style={{
            left: `${crop.x * 100}%`,
            top: `${crop.y * 100}%`,
            width: `${crop.w * 100}%`,
            height: `${crop.h * 100}%`,
          }}
        >
          {/* Draggable corner handles */}
          {['nw', 'ne', 'sw', 'se'].map((corner) => (
            <div
              key={corner}
              onMouseDown={(e) => handleCropMouseDown(e, corner)}
              className={`absolute h-2 w-2 rounded-sm bg-gaming-blue ${
                dragging === corner ? 'ring-2 ring-gaming-blue/40' : ''
              }`}
              style={{
                cursor: `${corner}-resize`,
                left: corner.includes('w') ? -4 : undefined,
                right: corner.includes('e') ? -4 : undefined,
                top: corner.includes('n') ? -4 : undefined,
                bottom: corner.includes('s') ? -4 : undefined,
              }}
            />
          ))}
        </div>
        {el.src && (
          <span className="absolute bottom-1 right-1 text-[8px] text-gaming-blue">裁剪模式</span>
        )}
      </div>
      {/* A4: Crop actions — wired to store */}
      <div className="flex gap-1.5 border-t border-border pt-2">
        <button onClick={applyCrop} className="flex-1 rounded-md bg-gaming-blue/10 py-1.5 text-[9px] font-medium text-gaming-blue transition-colors hover:bg-gaming-blue/20">
          应用裁剪
        </button>
        <button onClick={resetCrop} className="rounded-md border border-border px-2 py-1.5 text-[9px] text-muted-foreground hover:text-foreground">
          重置
        </button>
        <button onClick={fitToCanvas} className="rounded-md border border-border px-2 py-1.5 text-[9px] text-muted-foreground hover:text-foreground">
          适配画布
        </button>
      </div>
      <p className="text-[8px] text-muted-foreground/40">
        拖拽角点等比缩放，Shift+拖拽自由变形
      </p>
    </>
  );
}

/* ── Image Properties Panel (A4) ── */

function ImageProperties() {
  const { elements, selectedId, updateImageProps, moveElement, resizeElement, rotateElement, replaceImage, deleteElement, duplicateElement } = useCoverStore();
  const el = elements.find((e) => e.id === selectedId && e.type === 'image');

  if (!el) {
    return (
      <div className="p-4 text-center">
        <p className="text-[10px] text-muted-foreground">选中一个图片元素以编辑属性</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3">
      {/* Element name */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-foreground">{el.name}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => duplicateElement(el.id)} title="复制" className="p-1 text-muted-foreground/50 hover:text-foreground">
            <Copy className="h-3 w-3" />
          </button>
          <button onClick={() => deleteElement(el.id)} title="删除" className="p-1 text-muted-foreground/50 hover:text-gaming-error">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* A4: Crop preview with draggable blue handles */}
      <CropPreview el={el} />

      {/* Replace image (A4) — connected to /assets store */}
      <div className="flex gap-1.5">
        <button
          onClick={() => {
            // A1: Replace with first available image asset
            const imgAsset = useAssetsStore.getState().assets.find((a) => a.type === 'image');
            if (imgAsset) {
              replaceImage(el.id, imgAsset.thumbnail ?? `/api/assets/${imgAsset.id}`);
            }
          }}
          className="flex-1 rounded-md border border-dashed border-border py-1.5 text-[9px] font-medium text-muted-foreground transition-colors hover:border-gaming-blue hover:text-gaming-blue"
        >
          替换图片
        </button>
        <button
          onClick={() => {
            const imgAsset = useAssetsStore.getState().assets.find((a) => a.type === 'image');
            if (imgAsset) {
              replaceImage(el.id, imgAsset.thumbnail ?? `/api/assets/${imgAsset.id}`);
            }
          }}
          className="rounded-md border border-border px-2 py-1.5 text-[9px] text-muted-foreground hover:text-foreground"
        >
          素材库
        </button>
        <button className="rounded-md border border-border px-2 py-1.5 text-[9px] text-muted-foreground hover:text-foreground">
          本地上传
        </button>
      </div>

      {/* A4: Position & Scale — editable XY inputs */}
      <div>
        <label className="text-[10px] font-medium text-muted-foreground/60">位置 & 缩放</label>
        <div className="mt-1 grid grid-cols-2 gap-1.5">
          <div className="flex items-center gap-1">
            <span className="w-4 text-[9px] text-muted-foreground/40">X</span>
            <input
              type="number"
              value={Math.round(el.x)}
              onChange={(e) => moveElement(el.id, Number(e.target.value), el.y)}
              className="w-full rounded border border-border bg-background/50 px-1.5 py-0.5 text-[9px] text-foreground/70 outline-none"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="w-4 text-[9px] text-muted-foreground/40">Y</span>
            <input
              type="number"
              value={Math.round(el.y)}
              onChange={(e) => moveElement(el.id, el.x, Number(e.target.value))}
              className="w-full rounded border border-border bg-background/50 px-1.5 py-0.5 text-[9px] text-foreground/70 outline-none"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="w-4 text-[9px] text-muted-foreground/40">W</span>
            <input
              type="number"
              value={Math.round(el.w)}
              onChange={(e) => resizeElement(el.id, Number(e.target.value), el.h)}
              className="w-full rounded border border-border bg-background/50 px-1.5 py-0.5 text-[9px] text-foreground/70 outline-none"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="w-4 text-[9px] text-muted-foreground/40">H</span>
            <input
              type="number"
              value={Math.round(el.h)}
              onChange={(e) => resizeElement(el.id, el.w, Number(e.target.value))}
              className="w-full rounded border border-border bg-background/50 px-1.5 py-0.5 text-[9px] text-foreground/70 outline-none"
            />
          </div>
        </div>
      </div>

      {/* A4: Scale slider */}
      <div>
        <div className="flex items-center justify-between">
          <label className="text-[10px] text-muted-foreground/60">缩放</label>
          <span className="text-[9px] text-foreground/70">{Math.round((el.w / 400) * 100)}%</span>
        </div>
        <input
          type="range"
          min={10}
          max={300}
          value={Math.round((el.w / 400) * 100)}
          onChange={(e) => {
            const scale = Number(e.target.value) / 100;
            resizeElement(el.id, Math.round(400 * scale), Math.round(300 * scale));
          }}
          className="mt-1 w-full accent-gaming-blue"
        />
      </div>

      {/* A4: Rotation slider */}
      <div>
        <div className="flex items-center justify-between">
          <label className="text-[10px] text-muted-foreground/60">旋转</label>
          <span className="text-[9px] text-foreground/70">{el.rotation ?? 0}°</span>
        </div>
        <input
          type="range"
          min={-180}
          max={180}
          value={el.rotation ?? 0}
          onChange={(e) => rotateElement(el.id, Number(e.target.value))}
          className="mt-1 w-full accent-gaming-blue"
        />
      </div>

      {/* Fit mode */}
      <div>
        <label className="text-[10px] text-muted-foreground/60">适配方式</label>
        <div className="mt-1 flex gap-1">
          {(['cover', 'contain', 'fill'] as const).map((fit) => (
            <button
              key={fit}
              onClick={() => updateImageProps(el.id, { fit })}
              className={`rounded-md px-2 py-1 text-[9px] font-medium transition-colors ${
                el.fit === fit
                  ? 'bg-gaming-blue/12 text-gaming-blue'
                  : 'bg-background/50 text-muted-foreground/55'
              }`}
            >
              {fit}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}

/* ── Layer Panel ── */

function LayerPanel() {
  const { elements, selectedId, selectElement, lockElement, toggleVisibility } = useCoverStore();

  const sorted = [...elements].sort((a, b) => b.zIndex - a.zIndex);

  const typeIcons: Record<string, string> = {
    text: 'T',
    image: '🖼',
    decoration: '🎨',
  };

  return (
    <div className="space-y-1 p-3">
      <h3 className="text-[11px] font-semibold text-foreground">图层</h3>
      {sorted.map((el) => {
        const isActive = el.id === selectedId;
        return (
          <div
            key={el.id}
            onClick={() => selectElement(el.id)}
            className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 transition-colors ${
              isActive
                ? 'bg-gaming-blue/8 border border-gaming-blue/20'
                : 'hover:bg-background/30'
            }`}
          >
            <span className="text-[9px]">{typeIcons[el.type] ?? '?'}</span>
            <span className={`flex-1 truncate text-[9px] ${isActive ? 'font-medium text-foreground' : 'text-muted-foreground/55'}`}>
              {el.name}
            </span>
            {/* Lock toggle */}
            <button
              onClick={(e) => { e.stopPropagation(); lockElement(el.id); }}
              className="p-0.5"
            >
              {el.locked
                ? <Lock className="h-3 w-3 text-muted-foreground/30" />
                : <span className="block h-3 w-3" />}
            </button>
            {/* Visibility toggle */}
            <button
              onClick={(e) => { e.stopPropagation(); toggleVisibility(el.id); }}
              className="p-0.5"
            >
              {el.visible
                ? <Eye className="h-3 w-3 text-muted-foreground/40" />
                : <EyeOff className="h-3 w-3 text-muted-foreground/20" />}
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ── Main Right Panel ── */

export default function RightPanel() {
  const { rightPanelTab, setRightPanelTab, exports, retryExport } = useCoverStore();

  const tabs: { label: string; value: RightPanelTab }[] = [
    { label: '文字', value: 'text' },
    { label: '图片', value: 'image' },
    { label: '图层', value: 'layer' },
  ];

  const completedCount = exports.filter((e) => e.status === 'success').length;

  return (
    <div className="flex h-full flex-col border-l border-border bg-sidebar overflow-hidden">
      {/* Tab switcher */}
      <div className="flex gap-1 border-b border-border p-2">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setRightPanelTab(t.value)}
            className={`flex-1 rounded-lg py-1.5 text-[10px] font-semibold transition-colors ${
              rightPanelTab === t.value
                ? 'bg-gaming-blue/12 text-gaming-blue'
                : 'text-muted-foreground/55 hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {rightPanelTab === 'text' && <TextProperties />}
        {rightPanelTab === 'image' && <ImageProperties />}
        {rightPanelTab === 'layer' && <LayerPanel />}
      </div>

      {/* Export Queue (A6) — 5 states */}
      <div className="border-t border-border">
        <div className="flex items-center justify-between px-3 py-2">
          <h3 className="text-[11px] font-semibold text-foreground">🎬 导出队列</h3>
          <span className="text-[10px] text-muted-foreground/35">
            {completedCount} / {exports.length}
          </span>
        </div>
        <div className="max-h-[180px] space-y-1.5 overflow-y-auto px-3 pb-3">
          {exports.length > 0 ? exports.map((task) => (
            <ExportRow key={task.id} task={task} />
          )) : (
            <p className="py-2 text-center text-[10px] text-muted-foreground/35">暂无导出任务</p>
          )}

          {/* B4: Batch summary — only show when there are mixed results */}
          {exports.length > 1 && (() => {
            const failed = exports.filter((e) => e.status === 'failed');
            const success = exports.filter((e) => e.status === 'success');
            const needsAction = exports.filter((e) => e.status === 'needs-action');
            if (failed.length === 0 && needsAction.length === 0) return null;
            return (
              <div className="mt-1 rounded-lg border border-border bg-background/20 p-2">
                <p className="text-[9px] text-muted-foreground">
                  导出结果: ✓{success.length} 成功 · ✕{failed.length + needsAction.length} 失败
                </p>
                <div className="mt-1 flex gap-2">
                  {failed.length > 0 && (
                    <button
                      onClick={() => failed.forEach((t) => retryExport(t.id))}
                      className="rounded-md bg-gaming-error/10 px-2 py-0.5 text-[9px] font-medium text-gaming-error transition-colors hover:bg-gaming-error/20"
                    >
                      重试失败 ({failed.length})
                    </button>
                  )}
                  {success.length > 0 && (
                    <span className="text-[9px] text-gaming-success">导出已完成</span>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
