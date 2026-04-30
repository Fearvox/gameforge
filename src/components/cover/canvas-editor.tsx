'use client';

import {
  ImagePlus, Type, AlignCenter, Layers, Palette, Lock,
  ZoomIn, ZoomOut,
} from 'lucide-react';
import { useCoverStore, type CanvasElement } from '@/lib/cover-store';

const SNAP_GRID = 50; // A2: snap-to-grid pixel size

/* ── Snap helper ── */
function snap(value: number, enabled: boolean): number {
  return enabled ? Math.round(value / SNAP_GRID) * SNAP_GRID : value;
}

/* ── Selection Handles with resize interaction (A2) ── */

function SelectionHandles({ el, onResizeStart }: {
  el: CanvasElement;
  onResizeStart: (e: React.MouseEvent, corner: string) => void;
}) {
  const size = 8;
  const half = size / 2;
  const corners = [
    { pos: 'nw', cx: 0, cy: 0 },
    { pos: 'ne', cx: el.w, cy: 0 },
    { pos: 'sw', cx: 0, cy: el.h },
    { pos: 'se', cx: el.w, cy: el.h },
  ];

  return (
    <>
      {/* Dashed selection border */}
      <div
        className="pointer-events-none absolute border-[1.5px] border-dashed border-gaming-blue/60"
        style={{ left: 0, top: 0, width: el.w, height: el.h }}
      />
      {/* Corner handles — interactive for resize (A2) */}
      {corners.map((c) => (
        <div
          key={c.pos}
          className="absolute rounded-sm bg-gaming-blue"
          style={{
            left: c.cx - half,
            top: c.cy - half,
            width: size,
            height: size,
            cursor: `${c.pos}-resize`,
            zIndex: 100,
          }}
          onMouseDown={(e) => onResizeStart(e, c.pos)}
        />
      ))}
    </>
  );
}

/* ── Canvas Element Renderer ── */

function CanvasElementView({ el, isSelected, onResizeStart }: {
  el: CanvasElement;
  isSelected: boolean;
  onResizeStart: (e: React.MouseEvent, corner: string) => void;
}) {
  const { selectElement } = useCoverStore();

  if (!el.visible) return null;

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: el.x,
    top: el.y,
    width: el.w,
    height: el.h,
    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
    zIndex: el.zIndex,
    cursor: el.locked ? 'not-allowed' : 'move',
    opacity: el.locked ? 0.85 : 1,
  };

  return (
    <div
      onClick={(e) => { e.stopPropagation(); selectElement(el.id); }}
      style={baseStyle}
    >
      {el.type === 'text' && (
        <div
          className="flex h-full w-full items-start overflow-hidden"
          style={{
            fontFamily: el.fontFamily,
            fontSize: el.fontSize,
            fontWeight: el.fontWeight,
            color: el.color,
            lineHeight: el.lineHeight,
            WebkitTextStroke: el.strokeWidth ? `${el.strokeWidth}px ${el.strokeColor}` : undefined,
            textShadow: el.shadowBlur
              ? `0 ${el.shadowOffsetY ?? 0}px ${el.shadowBlur}px rgba(0,0,0,0.5)`
              : undefined,
            whiteSpace: 'pre-wrap',
          }}
        >
          {el.content}
        </div>
      )}

      {el.type === 'image' && (
        <div
          className="flex h-full w-full items-center justify-center overflow-hidden rounded"
          style={{
            backgroundColor: el.src ? 'transparent' : 'rgba(168,85,247,0.08)',
          }}
        >
          {el.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={el.src}
              alt={el.name}
              className="h-full w-full"
              style={{ objectFit: el.fit }}
            />
          ) : (
            <span className="text-4xl opacity-15">🖼</span>
          )}
        </div>
      )}

      {el.type === 'decoration' && (
        <div
          className="h-full w-full rounded-full"
          style={{
            background: el.fill,
            borderRadius: el.decorationType === 'line' ? '9999px' : undefined,
          }}
        />
      )}

      {/* Selection handles — interactive (A2) */}
      {isSelected && (
        <SelectionHandles el={el} onResizeStart={onResizeStart} />
      )}

      {/* Lock icon indicator */}
      {el.locked && (
        <div className="absolute right-1 top-1">
          <Lock className="h-3 w-3 text-muted-foreground/50" />
        </div>
      )}

      {/* Overflow warning (A3) */}
      {el.type === 'text' && el.overflowWarning && (
        <div className="absolute -bottom-5 left-0 right-0 rounded bg-gaming-warning/10 px-1 py-0.5 text-center text-[8px] text-gaming-warning">
          ⚠ 文字超出画布边界
        </div>
      )}
    </div>
  );
}

/* ── Multi-ratio Preview Strip (A5) ── */

function MultiRatioPreview() {
  const { elements, aspectRatio } = useCoverStore();

  const previews = [
    { label: '16:9', w: 200, h: 112, active: aspectRatio === '16:9' },
    { label: '9:16', w: 80, h: 112, active: aspectRatio === '9:16' },
    { label: '1:1', w: 96, h: 96, active: aspectRatio === '1:1' },
  ];

  return (
    <div className="px-5 pt-4">
      <p className="mb-2 text-center text-[11px] font-medium text-muted-foreground/55">
        多比例预览
      </p>
      <div className="flex items-end justify-center gap-4">
        {previews.map((p) => (
          <div
            key={p.label}
            className={`flex flex-col items-center gap-1 rounded-lg p-1 transition-colors ${
              p.active
                ? 'border-[1.5px] border-gaming-blue/30 bg-gaming-blue/8'
                : 'border border-border bg-background/30'
            }`}
            style={{ width: p.w + 16, height: p.h + 16 }}
          >
            <div
              className="overflow-hidden rounded bg-gaming-purple/6"
              style={{ width: p.w - 16, height: p.h - 24 }}
            >
              {elements.filter((e) => e.type === 'text' && e.visible).slice(0, 1).map((el) => (
                <p
                  key={el.id}
                  className="truncate px-1 pt-1 text-center"
                  style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)' }}
                >
                  {el.content?.split('\n')[0]}
                </p>
              ))}
            </div>
            <span className={`text-[9px] font-semibold ${p.active ? 'text-gaming-blue' : 'text-muted-foreground/55'}`}>
              {p.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Canvas Toolbar ── */

function CanvasToolbar() {
  const { addImageElement, addTextElement, toggleGrid, bringToFront, selectedId } = useCoverStore();

  const tools = [
    { icon: ImagePlus, label: '添加图片', action: addImageElement },
    { icon: Type, label: '添加文字', action: addTextElement },
    { icon: AlignCenter, label: '对齐', action: toggleGrid },
    { icon: Layers, label: '层级', action: () => selectedId && bringToFront(selectedId) },
    { icon: Palette, label: '背景', action: () => {} },
    { icon: Lock, label: '锁定', action: () => selectedId && useCoverStore.getState().lockElement(selectedId) },
  ];

  return (
    <div className="mx-5 mt-2 flex items-center gap-4 rounded-lg border border-border bg-background/30 px-4 py-2">
      {tools.map((t) => (
        <button
          key={t.label}
          onClick={t.action}
          className="flex items-center gap-1 text-[10px] text-muted-foreground/55 transition-colors hover:text-foreground"
          title={t.label}
        >
          <t.icon className="h-3 w-3" />
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ── Main Canvas Editor ── */

export default function CanvasEditor() {
  const {
    elements, selectedId, selectElement,
    zoom, zoomIn, zoomOut,
    showGrid, snapToGrid,
    canvasSize,
    moveElement, resizeElement,
  } = useCoverStore();

  /* A2: Drag handler with snap-to-grid */
  function handleElementMouseDown(e: React.MouseEvent, el: CanvasElement) {
    if (el.locked) return;
    e.stopPropagation();
    selectElement(el.id);

    const startX = e.clientX;
    const startY = e.clientY;
    const origX = el.x;
    const origY = el.y;

    function onMove(ev: MouseEvent) {
      const dx = (ev.clientX - startX) / zoom;
      const dy = (ev.clientY - startY) / zoom;
      const newX = snap(Math.round(origX + dx), snapToGrid);
      const newY = snap(Math.round(origY + dy), snapToGrid);
      moveElement(el.id, newX, newY);
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  /* A2: Resize handler with snap-to-grid */
  function handleResizeStart(e: React.MouseEvent, corner: string) {
    e.stopPropagation();
    if (!selectedId) return;
    const el = elements.find((el) => el.id === selectedId);
    if (!el || el.locked) return;

    const elId = el.id; // capture for closure
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = el.x;
    const origY = el.y;
    const origW = el.w;
    const origH = el.h;

    function onMove(ev: MouseEvent) {
      const dx = (ev.clientX - startX) / zoom;
      const dy = (ev.clientY - startY) / zoom;

      let newX = origX;
      let newY = origY;
      let newW = origW;
      let newH = origH;

      switch (corner) {
        case 'se':
          newW = snap(Math.max(20, origW + dx), snapToGrid);
          newH = snap(Math.max(20, origH + dy), snapToGrid);
          break;
        case 'sw':
          newX = snap(origX + dx, snapToGrid);
          newW = snap(Math.max(20, origW - dx), snapToGrid);
          newH = snap(Math.max(20, origH + dy), snapToGrid);
          break;
        case 'ne':
          newY = snap(origY + dy, snapToGrid);
          newW = snap(Math.max(20, origW + dx), snapToGrid);
          newH = snap(Math.max(20, origH - dy), snapToGrid);
          break;
        case 'nw':
          newX = snap(origX + dx, snapToGrid);
          newY = snap(origY + dy, snapToGrid);
          newW = snap(Math.max(20, origW - dx), snapToGrid);
          newH = snap(Math.max(20, origH - dy), snapToGrid);
          break;
      }

      resizeElement(elId, newW, newH, newX, newY);
    }

    function onUp() {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#0b0c10]">
      {/* Canvas viewport */}
      <div
        className="relative flex-1 overflow-auto"
        onClick={() => selectElement(null)}
      >
        {/* Centered canvas with zoom */}
        <div
          className="relative mx-auto my-6"
          style={{
            width: canvasSize.w * zoom,
            height: canvasSize.h * zoom,
            maxWidth: '100%',
          }}
        >
          {/* Canvas background */}
          <div
            className="absolute inset-0 overflow-hidden rounded-lg"
            style={{
              background: 'rgba(168,85,247,0.04)',
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              width: canvasSize.w,
              height: canvasSize.h,
            }}
          >
            {/* Grid overlay */}
            {showGrid && (
              <div className="pointer-events-none absolute inset-0 opacity-10">
                <div className="h-full w-full"
                  style={{
                    backgroundImage: `linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)`,
                    backgroundSize: `${SNAP_GRID}px ${SNAP_GRID}px`,
                  }}
                />
              </div>
            )}

            {/* Elements */}
            {elements.map((el) => (
              <div
                key={el.id}
                onMouseDown={(e) => handleElementMouseDown(e, el)}
              >
                <CanvasElementView
                  el={el}
                  isSelected={el.id === selectedId}
                  onResizeStart={handleResizeStart}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Zoom controls */}
        <div className="absolute bottom-2 left-5 flex items-center gap-1">
          <button
            onClick={zoomOut}
            className="flex h-6 w-6 items-center justify-center rounded-md bg-background/50 text-muted-foreground/55 transition-colors hover:text-foreground"
          >
            <ZoomOut className="h-3 w-3" />
          </button>
          <button
            onClick={zoomIn}
            className="flex h-6 w-6 items-center justify-center rounded-md bg-background/50 text-muted-foreground/55 transition-colors hover:text-foreground"
          >
            <ZoomIn className="h-3 w-3" />
          </button>
          <span className="ml-1 text-[10px] text-muted-foreground/35">
            {Math.round(zoom * 100)}%
          </span>
        </div>
      </div>

      {/* Multi-ratio preview strip (A5) */}
      <MultiRatioPreview />

      {/* Canvas toolbar */}
      <CanvasToolbar />
    </div>
  );
}
