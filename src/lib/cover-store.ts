import { create } from 'zustand';

/* ── types ── */

export type AspectRatio = '16:9' | '9:16' | '1:1';
export type CoverCategory = '全部' | '游戏' | '角色' | '攻略' | '高光';
export type ElementType = 'text' | 'image' | 'decoration';
export type ExportStatus = 'queued' | 'pending' | 'rendering' | 'success' | 'failed' | 'needs-action';
export type RightPanelTab = 'text' | 'image' | 'layer';

export interface CanvasElement {
  id: string;
  type: ElementType;
  name: string;
  /** Position from canvas top-left */
  x: number;
  y: number;
  /** Size in canvas pixels */
  w: number;
  h: number;
  /** Rotation in degrees */
  rotation: number;
  /** Stack order */
  zIndex: number;
  /** Locked elements cannot be moved/resized/deleted */
  locked: boolean;
  /** Hidden elements are not rendered but stay in layers */
  visible: boolean;

  /* ── Text-specific (A3) ── */
  content?: string;
  fontFamily?: string;
  /** Font size in px */
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  /** Stroke width in px (0 = no stroke) */
  strokeWidth?: number;
  strokeColor?: string;
  /** Shadow offset Y in px */
  shadowOffsetY?: number;
  /** Shadow blur radius in px */
  shadowBlur?: number;
  lineHeight?: number;
  /** Whether text overflows canvas bounds */
  overflowWarning?: boolean;

  /* ── Image-specific (A4) ── */
  /** Image source URL or placeholder */
  src?: string;
  /** How image fits within element bounds */
  fit?: 'cover' | 'contain' | 'fill';
  /** Crop region (normalized 0-1) */
  cropX?: number;
  cropY?: number;
  cropW?: number;
  cropH?: number;

  /* ── Decoration-specific ── */
  fill?: string;
  decorationType?: 'line' | 'shape';

  /** D4 audit */
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  name: string;
  category: CoverCategory;
  aspectRatio: AspectRatio;
  thumbnail: string; // emoji or URL
  /** Preset elements this template provides */
  elements: CanvasElement[];
}

export type ExportFormat = 'png' | 'jpg' | 'webp';

export interface ExportTask {
  id: string;
  name: string;
  status: ExportStatus;
  progress: number;
  /** e.g. '1080p', '720p' */
  resolution: string;
  aspectRatio: AspectRatio;
  format: ExportFormat;
  /** Error details for failed/needs-action */
  failReason?: string;
  /** CTA label for needs-action */
  cta?: string;
  /** D4 audit */
  createdAt: string;
  updatedAt: string;
  /** D5 status change reason */
  statusReason?: string;
}

export interface DraftState {
  projectId: string;
  projectName: string;
  elements: CanvasElement[];
  selectedId: string | null;
  aspectRatio: AspectRatio;
  templateId: string | null;
  savedAt: string;
}

export interface ConflictInfo {
  /** Who made the conflicting change */
  otherUser: string;
  /** ISO timestamp of the conflict */
  conflictAt: string;
  /** Their version description */
  theirVersion: string;
}

export interface AuditEvent {
  id: string;
  action: string;
  target: string;
  detail?: string;
  timestamp: string;
}

/** Manual undo/redo snapshot */
interface HistoryEntry {
  elements: CanvasElement[];
  selectedId: string | null;
}

/* ── constants ── */

const MAX_HISTORY = 20;
const CANVAS_SIZES: Record<AspectRatio, { w: number; h: number }> = {
  '16:9': { w: 1920, h: 1080 },
  '9:16': { w: 1080, h: 1920 },
  '1:1': { w: 1080, h: 1080 },
};

/* ── mock data ── */

function makeId(): string {
  return `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

const MOCK_ELEMENTS: CanvasElement[] = [
  {
    id: 'el-bg',
    type: 'image',
    name: '背景图',
    x: 0, y: 0, w: 1920, h: 1080,
    rotation: 0, zIndex: 0, locked: true, visible: true,
    src: '', fit: 'cover',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'el-character',
    type: 'image',
    name: '角色立绘',
    x: 960, y: 100, w: 800, h: 800,
    rotation: 0, zIndex: 1, locked: false, visible: true,
    src: '', fit: 'contain',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'el-title',
    type: 'text',
    name: '标题文字',
    x: 80, y: 80, w: 600, h: 120,
    rotation: 0, zIndex: 2, locked: false, visible: true,
    content: '原神 4.7\n新角色深度测评',
    fontFamily: 'Geist Bold',
    fontSize: 48,
    fontWeight: 800,
    color: '#ffffff',
    strokeWidth: 3,
    strokeColor: '#000000',
    shadowOffsetY: 2,
    shadowBlur: 4,
    lineHeight: 1.4,
    overflowWarning: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'el-subtitle',
    type: 'text',
    name: '副标题',
    x: 80, y: 880, w: 800, h: 40,
    rotation: 0, zIndex: 3, locked: false, visible: true,
    content: '🎮 GameForge 独家 · 角色实机演示 + 配队推荐',
    fontFamily: 'Geist Sans',
    fontSize: 18,
    fontWeight: 400,
    color: 'rgba(255,255,255,0.6)',
    strokeWidth: 0,
    strokeColor: '#000000',
    lineHeight: 1.4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'el-decoration',
    type: 'decoration',
    name: '装饰条',
    x: 80, y: 220, w: 200, h: 8,
    rotation: 0, zIndex: 4, locked: false, visible: true,
    fill: 'linear-gradient(90deg, #a855f7, #3b82f6, #06b6d4)',
    decorationType: 'line',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const MOCK_TEMPLATES: Template[] = [
  {
    id: 'tpl-game-fire', name: '游戏高燃', category: '游戏', aspectRatio: '16:9',
    thumbnail: '🎮',
    elements: MOCK_ELEMENTS.map((e) => ({ ...e, id: `tpl1-${e.id}` })),
  },
  {
    id: 'tpl-boss', name: 'Boss 战', category: '游戏', aspectRatio: '16:9',
    thumbnail: '⚔️',
    elements: [],
  },
  {
    id: 'tpl-character', name: '角色展示', category: '角色', aspectRatio: '16:9',
    thumbnail: '🎭',
    elements: [],
  },
  {
    id: 'tpl-guide', name: '攻略教程', category: '攻略', aspectRatio: '16:9',
    thumbnail: '📋',
    elements: [],
  },
  {
    id: 'tpl-stream', name: '实况录制', category: '高光', aspectRatio: '16:9',
    thumbnail: '🎬',
    elements: [],
  },
  {
    id: 'tpl-ranking', name: '排行榜', category: '高光', aspectRatio: '16:9',
    thumbnail: '🏆',
    elements: [],
  },
  {
    id: 'tpl-pvp', name: 'PVP 对决', category: '游戏', aspectRatio: '9:16',
    thumbnail: '🔥',
    elements: [],
  },
  {
    id: 'tpl-pull', name: '抽卡时刻', category: '高光', aspectRatio: '1:1',
    thumbnail: '🎰',
    elements: [],
  },
];

const MOCK_EXPORTS: ExportTask[] = [
  {
    id: 'exp-1',
    name: '原神4.7_封面_16:9.png',
    status: 'rendering',
    progress: 70,
    resolution: '1080p',
    aspectRatio: '16:9',
    format: 'png',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'exp-2',
    name: '原神4.7_封面_9:16.png',
    status: 'pending',
    progress: 0,
    resolution: '720p',
    aspectRatio: '9:16',
    format: 'png',
    failReason: '素材缺失：请先选择 9:16 比例的背景图',
    cta: '进入编辑',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/* ── state interface ── */

export interface CoverState {
  /* ── Project ── */
  projectId: string;
  projectName: string;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  lastSavedAt: string | null;

  /* ── Canvas (A2) ── */
  elements: CanvasElement[];
  selectedId: string | null;
  zoom: number; // 0.25-4.0, default 1.0
  showGrid: boolean;
  snapToGrid: boolean;
  canvasSize: { w: number; h: number };

  /* ── Templates (A1) ── */
  templates: Template[];
  activeTemplateId: string | null;
  templateCategory: CoverCategory;
  templateSearch: string;

  /* ── Aspect Ratio (A5) ── */
  aspectRatio: AspectRatio;

  /* ── Right Panel ── */
  rightPanelTab: RightPanelTab;

  /* ── Export Queue (A6) ── */
  exports: ExportTask[];

  /* ── Draft (A7) ── */
  draftState: DraftState | null;
  showDraftRestore: boolean;
  autoSaveEnabled: boolean;

  /* ── Conflict (B5) ── */
  conflict: ConflictInfo | null;
  showConflictModal: boolean;

  /* ── Error (B6/D3) ── */
  error: string | null;
  errorType: 'auth' | 'validation' | 'network' | null;

  /* ── Audit (D4) ── */
  auditLog: AuditEvent[];

  /* ── History (A2 undo/redo) ── */
  _past: HistoryEntry[];
  _future: HistoryEntry[];

  /* ── UI state ── */
  loading: boolean;
  templateFilter: string;
  _authToken: string;

  /* ── Actions ── */
  /* Selection */
  selectElement: (id: string | null) => void;

  /* A2: Element manipulation */
  moveElement: (id: string, x: number, y: number) => void;
  resizeElement: (id: string, w: number, h: number, x?: number, y?: number) => void;
  rotateElement: (id: string, rotation: number) => void;
  deleteElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  lockElement: (id: string) => void;
  toggleVisibility: (id: string) => void;

  /* A2: Layer ordering */
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;

  /* A3: Text editing */
  updateTextProps: (id: string, props: Partial<Pick<CanvasElement,
    'content' | 'fontFamily' | 'fontSize' | 'fontWeight' | 'color' |
    'strokeWidth' | 'strokeColor' | 'shadowOffsetY' | 'shadowBlur' | 'lineHeight'
  >>) => void;

  /* A4: Image editing */
  updateImageProps: (id: string, props: Partial<Pick<CanvasElement,
    'src' | 'fit' | 'cropX' | 'cropY' | 'cropW' | 'cropH'
  >>) => void;
  replaceImage: (id: string, newSrc: string) => void;

  /* A2: Add elements */
  addTextElement: () => void;
  addImageElement: () => void;

  /* A1: Templates */
  applyTemplate: (templateId: string) => void;
  setTemplateCategory: (cat: CoverCategory) => void;
  setTemplateSearch: (q: string) => void;

  /* A5: Aspect ratio */
  setAspectRatio: (ratio: AspectRatio) => void;

  /* A2: Zoom */
  setZoom: (z: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;

  /* A2: Grid/Snap */
  toggleGrid: () => void;
  toggleSnap: () => void;

  /* Right panel */
  setRightPanelTab: (tab: RightPanelTab) => void;

  /* A2: Undo/Redo */
  undo: () => void;
  redo: () => void;

  /* A6: Export */
  startExport: (format?: ExportFormat) => void;
  cancelExport: (id: string) => void;
  retryExport: (id: string) => void;
  removeExport: (id: string) => void;

  /* A7: Draft */
  saveDraft: () => void;
  restoreDraft: () => void;
  discardDraft: () => void;
  setShowDraftRestore: (show: boolean) => void;

  /* B5: Conflict */
  simulateConflict: () => void;
  resolveConflict: (action: 'load' | 'overwrite' | 'duplicate') => void;

  /* B6/D3: Auth */
  verifySession: () => Promise<void>;
  simulateAuthError: () => void;

  /* B1: Template load failure */
  simulateTemplateLoadError: () => void;
  templateLoadError: string | null;
  templateLoadRetries: number;

  /* B2: Image validation failure */
  imageValidationResults: { file: string; status: 'pass' | 'warn' | 'fail'; reason?: string }[];
  simulateImageValidationError: () => void;
  clearImageValidation: () => void;

  /* B3: Preview render failure */
  previewError: boolean;
  simulatePreviewError: () => void;
  retryPreview: () => void;

  /* D4: Audit */
  addAuditEvent: (action: string, target: string, detail?: string) => void;

  /* Template search/filter */
  setTemplateFilter: (q: string) => void;

  /* Loading */
  setLoading: (v: boolean) => void;
}

/* ── helper: push to history ── */

function pushHistory(state: CoverState): Pick<CoverState, '_past' | '_future'> {
  const entry: HistoryEntry = {
    elements: structuredClone(state.elements),
    selectedId: state.selectedId,
  };
  const past = [...state._past, entry].slice(-MAX_HISTORY);
  return { _past: past, _future: [] };
}

/* ── helper: check locked ── */

function isLocked(elements: CanvasElement[], id: string): boolean {
  return elements.find((e) => e.id === id)?.locked ?? false;
}

/* ── export simulation (A6) ── */

const exportTimers: ReturnType<typeof setTimeout>[] = [];

function startExportSimulation(
  task: ExportTask,
  set: (partial: Partial<CoverState>) => void,
  get: () => CoverState,
) {
  const totalMs = 3000 + Math.random() * 4000;
  const steps = 20;
  const stepMs = totalMs / steps;
  let currentStep = 0;

  const timer = setInterval(() => {
    currentStep++;
    const progress = Math.min(95, Math.round((currentStep / steps) * 100));
    const state = get();
    set({
      exports: state.exports.map((e) =>
        e.id === task.id ? { ...e, progress, updatedAt: new Date().toISOString() } : e
      ),
    });

    if (currentStep >= steps) {
      clearInterval(timer);
      // 20% chance of failure
      const failed = Math.random() < 0.2;
      const finalState = get();
      const updatedExports = finalState.exports.map((e) => {
        if (e.id !== task.id) return e;
        if (failed) {
          const needsAction = Math.random() < 0.5;
          return {
            ...e,
            status: (needsAction ? 'needs-action' : 'failed') as ExportStatus,
            progress: 100,
            failReason: needsAction ? '平台授权过期' : '渲染超时',
            cta: needsAction ? '重新授权' : '重试',
            updatedAt: new Date().toISOString(),
            statusReason: needsAction ? 'PLATFORM_AUTH_EXPIRED' : 'RENDER_TIMEOUT',
          };
        }
        return {
          ...e,
          status: 'success' as ExportStatus,
          progress: 100,
          updatedAt: new Date().toISOString(),
          statusReason: 'COMPLETED',
        };
      });

      set({ exports: updatedExports });

      // Always start next queued task (fix from /cut: queue starvation)
      const nextQueued = updatedExports.find((e) => e.status === 'queued');
      if (nextQueued) {
        const started = updatedExports.map((e) =>
          e.id === nextQueued.id ? { ...e, status: 'rendering' as ExportStatus, updatedAt: new Date().toISOString() } : e
        );
        set({ exports: started });
        const nextTask = started.find((e) => e.id === nextQueued.id)!;
        startExportSimulation(nextTask, set, get);
      }
    }
  }, stepMs);

  exportTimers.push(timer);
}

/* ── store ── */

export const useCoverStore = create<CoverState>((set, get) => ({
  /* ── Initial state ── */
  projectId: 'proj-cover-001',
  projectName: '原神4.7_新角色测评_封面',
  saveStatus: 'saved',
  lastSavedAt: new Date().toISOString(),

  elements: structuredClone(MOCK_ELEMENTS),
  selectedId: 'el-title', // Default: select title element
  zoom: 1.0,
  showGrid: false,
  snapToGrid: true,
  canvasSize: CANVAS_SIZES['16:9'],

  templates: MOCK_TEMPLATES,
  activeTemplateId: 'tpl-game-fire',
  templateCategory: '全部',
  templateSearch: '',

  aspectRatio: '16:9',

  rightPanelTab: 'text',

  exports: structuredClone(MOCK_EXPORTS),

  draftState: {
    projectId: 'proj-cover-001',
    projectName: '原神4.7_新角色测评_封面',
    elements: structuredClone(MOCK_ELEMENTS),
    selectedId: 'el-title',
    aspectRatio: '16:9',
    templateId: 'tpl-game-fire',
    savedAt: new Date(Date.now() - 3600_000).toISOString(), // 1 hour ago
  },
  showDraftRestore: false,
  autoSaveEnabled: true,

  conflict: null,
  showConflictModal: false,

  error: null,
  errorType: null,

  auditLog: [],

  _past: [],
  _future: [],

  loading: true,
  templateFilter: '',
  _authToken: 'valid-token',

  /* ── B1-B3 error state ── */
  templateLoadError: null,
  templateLoadRetries: 0,
  imageValidationResults: [],
  previewError: false,

  /* ── Selection ── */
  selectElement: (id) => {
    set({ selectedId: id });
    if (id) {
      const el = get().elements.find((e) => e.id === id);
      if (el) {
        set({ rightPanelTab: el.type === 'text' ? 'text' : el.type === 'image' ? 'image' : 'layer' });
      }
    }
  },

  /* ── A2: Element manipulation ── */
  moveElement: (id, x, y) => {
    const s = get();
    if (isLocked(s.elements, id)) return;
    const hist = pushHistory(s);
    set({
      ...hist,
      elements: s.elements.map((e) =>
        e.id === id ? { ...e, x, y, updatedAt: new Date().toISOString() } : e
      ),
      saveStatus: 'unsaved',
    });
  },

  resizeElement: (id, w, h, x, y) => {
    const s = get();
    if (isLocked(s.elements, id)) return;
    const hist = pushHistory(s);
    set({
      ...hist,
      elements: s.elements.map((e) => {
        if (e.id !== id) return e;
        const updated = { ...e, w: Math.max(20, w), h: Math.max(20, h), updatedAt: new Date().toISOString() };
        if (x !== undefined) updated.x = x;
        if (y !== undefined) updated.y = y;
        return updated;
      }),
      saveStatus: 'unsaved',
    });
  },

  rotateElement: (id, rotation) => {
    const s = get();
    if (isLocked(s.elements, id)) return;
    const hist = pushHistory(s);
    set({
      ...hist,
      elements: s.elements.map((e) =>
        e.id === id ? { ...e, rotation, updatedAt: new Date().toISOString() } : e
      ),
      saveStatus: 'unsaved',
    });
  },

  deleteElement: (id) => {
    const s = get();
    if (isLocked(s.elements, id)) return;
    const hist = pushHistory(s);
    set({
      ...hist,
      elements: s.elements.filter((e) => e.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
      saveStatus: 'unsaved',
    });
    get().addAuditEvent('DELETE', id, 'Element removed');
  },

  duplicateElement: (id) => {
    const s = get();
    const el = s.elements.find((e) => e.id === id);
    if (!el || el.locked) return;
    const hist = pushHistory(s);
    const newEl: CanvasElement = {
      ...structuredClone(el),
      id: makeId(),
      name: `${el.name} (副本)`,
      x: el.x + 20,
      y: el.y + 20,
      zIndex: Math.max(...s.elements.map((e) => e.zIndex)) + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set({
      ...hist,
      elements: [...s.elements, newEl],
      selectedId: newEl.id,
      saveStatus: 'unsaved',
    });
  },

  lockElement: (id) => {
    const s = get();
    set({
      elements: s.elements.map((e) =>
        e.id === id ? { ...e, locked: !e.locked, updatedAt: new Date().toISOString() } : e
      ),
    });
    const el = s.elements.find((e) => e.id === id);
    get().addAuditEvent(el?.locked ? 'UNLOCK' : 'LOCK', id);
  },

  toggleVisibility: (id) => {
    const s = get();
    set({
      elements: s.elements.map((e) =>
        e.id === id ? { ...e, visible: !e.visible, updatedAt: new Date().toISOString() } : e
      ),
    });
  },

  /* ── A2: Layer ordering ── */
  bringForward: (id) => {
    const s = get();
    if (isLocked(s.elements, id)) return;
    const sorted = [...s.elements].sort((a, b) => a.zIndex - b.zIndex);
    const idx = sorted.findIndex((e) => e.id === id);
    if (idx < sorted.length - 1) {
      const hist = pushHistory(s);
      const temp = sorted[idx].zIndex;
      sorted[idx] = { ...sorted[idx], zIndex: sorted[idx + 1].zIndex };
      sorted[idx + 1] = { ...sorted[idx + 1], zIndex: temp };
      set({ ...hist, elements: sorted, saveStatus: 'unsaved' });
    }
  },

  sendBackward: (id) => {
    const s = get();
    if (isLocked(s.elements, id)) return;
    const sorted = [...s.elements].sort((a, b) => a.zIndex - b.zIndex);
    const idx = sorted.findIndex((e) => e.id === id);
    if (idx > 0) {
      const hist = pushHistory(s);
      const temp = sorted[idx].zIndex;
      sorted[idx] = { ...sorted[idx], zIndex: sorted[idx - 1].zIndex };
      sorted[idx - 1] = { ...sorted[idx - 1], zIndex: temp };
      set({ ...hist, elements: sorted, saveStatus: 'unsaved' });
    }
  },

  bringToFront: (id) => {
    const s = get();
    if (isLocked(s.elements, id)) return;
    const maxZ = Math.max(...s.elements.map((e) => e.zIndex));
    const hist = pushHistory(s);
    set({
      ...hist,
      elements: s.elements.map((e) =>
        e.id === id ? { ...e, zIndex: maxZ + 1, updatedAt: new Date().toISOString() } : e
      ),
      saveStatus: 'unsaved',
    });
  },

  sendToBack: (id) => {
    const s = get();
    if (isLocked(s.elements, id)) return;
    const minZ = Math.min(...s.elements.map((e) => e.zIndex));
    const hist = pushHistory(s);
    set({
      ...hist,
      elements: s.elements.map((e) =>
        e.id === id ? { ...e, zIndex: minZ - 1, updatedAt: new Date().toISOString() } : e
      ),
      saveStatus: 'unsaved',
    });
  },

  /* ── A3: Text editing ── */
  updateTextProps: (id, props) => {
    const s = get();
    if (isLocked(s.elements, id)) return;
    const hist = pushHistory(s);
    set({
      ...hist,
      elements: s.elements.map((e) => {
        if (e.id !== id || e.type !== 'text') return e;
        const updated = { ...e, ...props, updatedAt: new Date().toISOString() };
        // D1: Check overflow warning
        if (updated.content && updated.fontSize) {
          const lineCount = (updated.content.match(/\n/g)?.length ?? 0) + 1;
          const textHeight = lineCount * updated.fontSize * (updated.lineHeight ?? 1.4);
          updated.overflowWarning = textHeight > updated.h;
        }
        return updated;
      }),
      saveStatus: 'unsaved',
    });
  },

  /* ── A4: Image editing ── */
  updateImageProps: (id, props) => {
    const s = get();
    if (isLocked(s.elements, id)) return;
    const hist = pushHistory(s);
    set({
      ...hist,
      elements: s.elements.map((e) =>
        e.id === id ? { ...e, ...props, updatedAt: new Date().toISOString() } : e
      ),
      saveStatus: 'unsaved',
    });
  },

  replaceImage: (id, newSrc) => {
    const s = get();
    if (isLocked(s.elements, id)) return;
    // B2: Dual validation — frontend pre-check
    if (newSrc && !newSrc.startsWith('data:') && !newSrc.startsWith('/') && !newSrc.startsWith('http')) {
      set({ error: '图片格式不支持', errorType: 'validation' });
      return;
    }
    const hist = pushHistory(s);
    set({
      ...hist,
      elements: s.elements.map((e) =>
        e.id === id ? { ...e, src: newSrc, updatedAt: new Date().toISOString() } : e
      ),
      saveStatus: 'unsaved',
    });
    get().addAuditEvent('REPLACE_IMAGE', id, 'Image replaced');
  },

  /* ── A2: Add elements ── */
  addTextElement: () => {
    const s = get();
    const hist = pushHistory(s);
    const maxZ = Math.max(...s.elements.map((e) => e.zIndex), 0);
    const newEl: CanvasElement = {
      id: makeId(),
      type: 'text',
      name: '新文字',
      x: 200,
      y: 200,
      w: 400,
      h: 60,
      rotation: 0,
      zIndex: maxZ + 1,
      locked: false,
      visible: true,
      content: '双击编辑文字',
      fontFamily: 'Geist Sans',
      fontSize: 24,
      fontWeight: 400,
      color: '#ffffff',
      strokeWidth: 0,
      strokeColor: '#000000',
      lineHeight: 1.4,
      overflowWarning: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set({
      ...hist,
      elements: [...s.elements, newEl],
      selectedId: newEl.id,
      rightPanelTab: 'text',
      saveStatus: 'unsaved',
    });
    get().addAuditEvent('ADD', newEl.id, 'Text element added');
  },

  addImageElement: () => {
    const s = get();
    const hist = pushHistory(s);
    const maxZ = Math.max(...s.elements.map((e) => e.zIndex), 0);
    const newEl: CanvasElement = {
      id: makeId(),
      type: 'image',
      name: '新图片',
      x: 300,
      y: 200,
      w: 400,
      h: 300,
      rotation: 0,
      zIndex: maxZ + 1,
      locked: false,
      visible: true,
      src: '',
      fit: 'cover',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set({
      ...hist,
      elements: [...s.elements, newEl],
      selectedId: newEl.id,
      rightPanelTab: 'image',
      saveStatus: 'unsaved',
    });
    get().addAuditEvent('ADD', newEl.id, 'Image element added');
  },

  /* ── A1: Templates ── */
  applyTemplate: (templateId) => {
    const s = get();
    const tpl = s.templates.find((t) => t.id === templateId);
    if (!tpl) return;
    const hist = pushHistory(s);
    const newElements = tpl.elements.length > 0
      ? structuredClone(tpl.elements).map((e) => ({ ...e, id: makeId() }))
      : s.elements;
    set({
      ...hist,
      elements: newElements,
      activeTemplateId: templateId,
      selectedId: null,
      saveStatus: 'unsaved',
    });
    get().addAuditEvent('APPLY_TEMPLATE', templateId, `Applied template: ${tpl.name}`);
  },

  setTemplateCategory: (cat) => set({ templateCategory: cat }),
  setTemplateSearch: (q) => set({ templateSearch: q }),

  /* ── A5: Aspect ratio ── */
  setAspectRatio: (ratio) => {
    const s = get();
    if (ratio === s.aspectRatio) return;
    set({
      aspectRatio: ratio,
      canvasSize: CANVAS_SIZES[ratio],
      saveStatus: 'unsaved',
    });
    get().addAuditEvent('CHANGE_RATIO', ratio, `Aspect ratio changed to ${ratio}`);
  },

  /* ── Zoom ── */
  setZoom: (z) => set({ zoom: Math.max(0.25, Math.min(4.0, z)) }),
  zoomIn: () => set((s) => ({ zoom: Math.min(4.0, s.zoom + 0.1) })),
  zoomOut: () => set((s) => ({ zoom: Math.max(0.25, s.zoom - 0.1) })),

  /* ── Grid/Snap ── */
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleSnap: () => set((s) => ({ snapToGrid: !s.snapToGrid })),

  /* ── Right panel ── */
  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),

  /* ── A2: Undo/Redo (20-step history) ── */
  undo: () => {
    const s = get();
    if (s._past.length === 0) return;
    const prev = s._past[s._past.length - 1];
    const current: HistoryEntry = {
      elements: structuredClone(s.elements),
      selectedId: s.selectedId,
    };
    set({
      elements: structuredClone(prev.elements),
      selectedId: prev.selectedId,
      _past: s._past.slice(0, -1),
      _future: [current, ...s._future].slice(0, MAX_HISTORY),
      saveStatus: 'unsaved',
    });
  },

  redo: () => {
    const s = get();
    if (s._future.length === 0) return;
    const next = s._future[0];
    const current: HistoryEntry = {
      elements: structuredClone(s.elements),
      selectedId: s.selectedId,
    };
    set({
      elements: structuredClone(next.elements),
      selectedId: next.selectedId,
      _past: [...s._past, current].slice(-MAX_HISTORY),
      _future: s._future.slice(1),
      saveStatus: 'unsaved',
    });
  },

  /* ── A6: Export (5-state queue) ── */
  startExport: (format = 'png') => {
    const s = get();
    const ratio = s.aspectRatio;
    const size = CANVAS_SIZES[ratio];
    const resolution = size.h >= 1080 ? '1080p' : '720p';
    const newTask: ExportTask = {
      id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 4)}`,
      name: `${s.projectName}_${ratio.replace(':', 'x')}.${format}`,
      status: 'queued',
      progress: 0,
      resolution,
      aspectRatio: ratio,
      format,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const hasRendering = s.exports.some((e) => e.status === 'rendering');
    const finalTask = hasRendering
      ? newTask
      : { ...newTask, status: 'rendering' as ExportStatus };

    const updatedExports = [...s.exports, finalTask];
    set({ exports: updatedExports });
    get().addAuditEvent('EXPORT_START', newTask.id, `${ratio} ${format} ${resolution}`);

    // Start simulation if not queued behind another
    if (!hasRendering) {
      startExportSimulation(finalTask, set, get);
    }
  },

  cancelExport: (id) => {
    const s = get();
    set({
      exports: s.exports.filter((e) => e.id !== id),
    });
    get().addAuditEvent('EXPORT_CANCEL', id);
  },

  retryExport: (id) => {
    const s = get();
    const updated = s.exports.map((e) =>
      e.id === id ? { ...e, status: 'rendering' as ExportStatus, progress: 0, failReason: undefined, cta: undefined, updatedAt: new Date().toISOString() } : e
    );
    set({ exports: updated });
    const task = updated.find((e) => e.id === id)!;
    startExportSimulation(task, set, get);
    get().addAuditEvent('EXPORT_RETRY', id);
  },

  removeExport: (id) => {
    set((s) => ({ exports: s.exports.filter((e) => e.id !== id) }));
  },

  /* ── A7: Draft ── */
  saveDraft: () => {
    const s = get();
    const draft: DraftState = {
      projectId: s.projectId,
      projectName: s.projectName,
      elements: structuredClone(s.elements),
      selectedId: s.selectedId,
      aspectRatio: s.aspectRatio,
      templateId: s.activeTemplateId,
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(`cover-draft-${s.projectId}`, JSON.stringify(draft));
      set({ saveStatus: 'saved', lastSavedAt: new Date().toISOString() });
    } catch {
      set({ error: '草稿保存失败', errorType: 'network' });
    }
  },

  restoreDraft: () => {
    const s = get();
    if (!s.draftState) return;
    const hist = pushHistory(s);
    set({
      ...hist,
      elements: structuredClone(s.draftState.elements),
      selectedId: s.draftState.selectedId,
      aspectRatio: s.draftState.aspectRatio,
      activeTemplateId: s.draftState.templateId,
      canvasSize: CANVAS_SIZES[s.draftState.aspectRatio],
      showDraftRestore: false,
      draftState: null,
      saveStatus: 'saved',
    });
    get().addAuditEvent('DRAFT_RESTORE', s.projectId);
  },

  discardDraft: () => {
    const s = get();
    localStorage.removeItem(`cover-draft-${s.projectId}`);
    set({ showDraftRestore: false, draftState: null });
    get().addAuditEvent('DRAFT_DISCARD', s.projectId);
  },

  setShowDraftRestore: (show) => set({ showDraftRestore: show }),

  /* ── B5: Conflict ── */
  simulateConflict: () => {
    set({
      conflict: {
        otherUser: 'Designer-Alice',
        conflictAt: new Date().toISOString(),
        theirVersion: '新增了"排行榜"模板的封面布局',
      },
      showConflictModal: true,
    });
  },

  resolveConflict: (action) => {
    const s = get();
    switch (action) {
      case 'load':
        // Reload their version (simulated)
        set({
          showConflictModal: false,
          conflict: null,
          saveStatus: 'saved',
        });
        break;
      case 'overwrite':
        // Keep local, force save
        set({
          showConflictModal: false,
          conflict: null,
          saveStatus: 'saving',
        });
        setTimeout(() => set({ saveStatus: 'saved', lastSavedAt: new Date().toISOString() }), 500);
        break;
      case 'duplicate':
        // Save as copy
        set({
          showConflictModal: false,
          conflict: null,
          projectName: `${s.projectName} (副本)`,
          saveStatus: 'saving',
        });
        setTimeout(() => set({ saveStatus: 'saved', lastSavedAt: new Date().toISOString() }), 500);
        break;
    }
    get().addAuditEvent('CONFLICT_RESOLVE', s.projectId, `Action: ${action}`);
  },

  /* ── B6/D3: Auth ── */
  verifySession: async () => {
    try {
      const token = get()._authToken;
      const res = await fetch('/api/cover/session', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        set({ error: '登录已过期，请重新登录', errorType: 'auth' });
      } else if (res.status === 403) {
        set({ error: '无权限访问此项目', errorType: 'auth' });
      }
    } catch {
      console.warn('Session verification failed (network)');
    }
  },

  simulateAuthError: () => {
    // B6: Set expired token and trigger real API call → 401
    set({ _authToken: 'expired-token' });
    get().verifySession();
  },

  /* ── D4: Audit ── */
  addAuditEvent: (action, target, detail) => {
    const s = get();
    const event: AuditEvent = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 4)}`,
      action,
      target,
      detail,
      timestamp: new Date().toISOString(),
    };
    set({ auditLog: [...s.auditLog, event].slice(-100) }); // Keep last 100
  },

  /* ── B1: Template load failure ── */
  simulateTemplateLoadError: () => {
    const s = get();
    set({
      templateLoadError: '模板加载失败：网络超时，请重试',
      templateLoadRetries: s.templateLoadRetries + 1,
    });
    get().addAuditEvent('TEMPLATE_LOAD_FAIL', 'templates', `Retry #${s.templateLoadRetries + 1}`);
  },

  /* ── B2: Image validation failure ── */
  simulateImageValidationError: () => {
    set({
      imageValidationResults: [
        { file: 'cover_art.psd', status: 'fail', reason: '不支持 PSD 格式' },
        { file: 'banner.png', status: 'pass' },
        { file: 'logo.svg', status: 'warn', reason: 'SVG 可能存在兼容性问题' },
        { file: 'photo_4k.jpg', status: 'fail', reason: '文件超过 10MB 限制' },
      ],
    });
    get().addAuditEvent('IMAGE_VALIDATION_FAIL', 'image-validation', '4 files checked');
  },

  clearImageValidation: () => set({ imageValidationResults: [] }),

  /* ── B3: Preview render failure ── */
  simulatePreviewError: () => {
    set({ previewError: true });
    get().addAuditEvent('PREVIEW_FAIL', 'canvas', 'Render failed');
  },

  retryPreview: () => {
    set({ previewError: false });
    get().addAuditEvent('PREVIEW_RETRY', 'canvas');
  },

  /* ── Misc ── */
  setTemplateFilter: (q) => set({ templateFilter: q }),
  setLoading: (v) => set({ loading: v }),
}));
