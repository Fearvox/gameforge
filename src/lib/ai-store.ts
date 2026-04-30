import { create } from 'zustand';

/* ── Types ── */

/** Provider adapter mode */
export type ProviderMode = 'mock' | 'local' | 'remote';

/** A1: AI capability metadata */
export interface AICallMeta {
  requestId: string;
  capability: string;
  mode: ProviderMode;
  durationMs: number;
  cacheHit: boolean;
  timestamp: string;
}

/** A2: Auto-tag result */
export interface TagSuggestion {
  tag: string;
  confidence: number; // 0-1
  evidence: string; // excerpt from source text
  source: 'title' | 'danmaku' | 'comment';
}

/** A3: Cover score dimensions */
export interface CoverScore {
  composition: number;   // 0-100
  readability: number;   // 0-100
  contrast: number;      // 0-100
  subjectClarity: number; // 0-100
  overall: number;       // weighted avg
  suggestions: string[];
}

/** A4: Highlight segment */
export interface HighlightSegment {
  id: string;
  startMs: number;
  endMs: number;
  score: number; // 0-100
  triggers: string[]; // e.g. ["音量峰值", "弹幕密度: 85"]
  accepted: boolean | null; // null = unset
}

/** A5: Subtitle block */
export interface SubtitleBlock {
  id: string;
  startMs: number;
  endMs: number;
  text: string;
  confidence: number;
  edited: boolean;
}

/* ── D4 auditable constants ── */
export const AI_PROVIDERS = ['mock', 'local', 'remote'] as const;
export const AI_CAPABILITIES = ['autoTag', 'coverScore', 'highlightDetect', 'subtitle'] as const;

export const TAG_TOP_N = 10;
export const TAG_LOW_CONFIDENCE_THRESHOLD = 0.7; // B6: below this, don't auto-apply
export const TAG_MIN_EVIDENCE_LEN = 3;

export const COVER_DIMENSIONS = ['composition', 'readability', 'contrast', 'subjectClarity'] as const;
export const COVER_DIMENSION_WEIGHTS = [0.25, 0.30, 0.25, 0.20]; // D4 auditable

export const HIGHLIGHT_MIN_DURATION_MS = 3000; // minimum 3 seconds
export const HIGHLIGHT_MAX_SEGMENTS = 10;
export const HIGHLIGHT_DETECT_LEVELS = ['conservative', 'balanced', 'aggressive'] as const;

export const SUBTITLE_EXPORT_FORMATS = ['srt', 'vtt'] as const;

export const AI_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // C1: 24h cache
export const AI_MAX_CONCURRENT = 2; // C4: concurrency cap

/* ── D1/B7: text sanitization ── */
function sanitizeText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')           // strip HTML tags
    .replace(/&[^;]+;/g, '')           // strip entities
    .replace(/javascript:/gi, '')      // strip js: URIs
    .replace(/on\w+\s*=/gi, '')        // strip inline event handlers
    .trim();
}

/* ── Store state ── */

interface AIState {
  /* Provider config */
  providerMode: ProviderMode;
  capabilityToggles: Record<string, boolean>; // per-capability on/off

  /* A1: Metadata log */
  callLog: AICallMeta[];

  /* A2: Auto-tag */
  tagSuggestions: TagSuggestion[];
  appliedTags: string[];
  lastAutoTagInput: { title: string; danmaku: string[]; comments: string[] } | null; // B4 retry replay

  /* A3: Cover scoring */
  coverScore: CoverScore | null;

  /* A4: Highlight detection */
  highlightSegments: HighlightSegment[];
  highlightLevel: 'conservative' | 'balanced' | 'aggressive';

  /* A5: Subtitle */
  subtitleBlocks: SubtitleBlock[];
  subtitleMode: 'local' | 'remote';

  /* B2-B4 error tracking */
  algorithmErrors: Record<string, string | null>;

  /* C4: concurrency */
  activeJobs: number;

  /* Loading / error */
  loading: boolean;
  globalError: string | null;

  /* Actions */
  loadMockData: () => void;
  setProviderMode: (mode: ProviderMode) => void;
  toggleCapability: (capability: string) => void;

  /* A2: Auto-tag actions */
  computeAutoTags: (input: { title: string; danmaku: string[]; comments: string[] }) => void;
  applyTags: (tags: string[]) => void;
  clearTags: () => void;

  /* A3: Cover scoring */
  computeCoverScore: (coverUrl: string) => void;

  /* A4: Highlight detection */
  computeHighlights: () => void;
  setHighlightLevel: (level: 'conservative' | 'balanced' | 'aggressive') => void;
  acceptHighlight: (id: string) => void;
  rejectHighlight: (id: string) => void;

  /* A5: Subtitle */
  computeSubtitles: (audioUrl?: string) => void;
  editSubtitleBlock: (id: string, text: string) => void;
  setSubtitleMode: (mode: 'local' | 'remote') => void;

  /* B4: retry */
  retryCompute: (key: string) => void;

  /* D5: audit */
  getAuditLog: () => string;
}

/* ── Mock AI responses (deterministic, per D5 reproducibility) ── */

const MOCK_TAGS: TagSuggestion[] = [
  { tag: '原神', confidence: 0.95, evidence: '标题+弹幕高频词', source: 'title' },
  { tag: '深渊12层', confidence: 0.88, evidence: '满星阵容推荐', source: 'title' },
  { tag: '攻略', confidence: 0.82, evidence: '评论区多次提及', source: 'comment' },
  { tag: '4.7版本', confidence: 0.78, evidence: '弹幕: "4.7太强了"', source: 'danmaku' },
  { tag: '角色评测', confidence: 0.75, evidence: '标题: 深度测评', source: 'title' },
  { tag: '周本', confidence: 0.72, evidence: '弹幕: "周本速通"', source: 'danmaku' },
  { tag: '抽卡', confidence: 0.68, evidence: '评论: "保底多少"', source: 'comment' },
  { tag: 'B站', confidence: 0.55, evidence: '平台标签', source: 'title' },
];

const MOCK_COVER_SCORE: CoverScore = {
  composition: 78,
  readability: 85,
  contrast: 72,
  subjectClarity: 90,
  overall: 81,
  suggestions: [
    '文字层级建议：标题字号可放大 20%，副标题减淡以提高主次对比',
    '色彩对比：亮色区域占比 62%，建议增加暗色锚点平衡视觉重心',
    '主体位置：角色面部位于左上黄金分割点 ✓',
  ],
};

const MOCK_HIGHLIGHTS: HighlightSegment[] = [
  {
    id: 'hl-1',
    startMs: 12000,
    endMs: 28000,
    score: 92,
    triggers: ['音量峰值: +18dB', '弹幕密度: 85/min', '帧变化率: 0.72'],
    accepted: null,
  },
  {
    id: 'hl-2',
    startMs: 45000,
    endMs: 62000,
    score: 78,
    triggers: ['弹幕密度: 72/min', '音量峰值: +12dB'],
    accepted: null,
  },
  {
    id: 'hl-3',
    startMs: 89000,
    endMs: 105000,
    score: 85,
    triggers: ['帧变化率: 0.65', '音量峰值: +15dB', '弹幕密度: 68/min'],
    accepted: null,
  },
  {
    id: 'hl-4',
    startMs: 140000,
    endMs: 158000,
    score: 65,
    triggers: ['弹幕密度: 55/min'],
    accepted: null,
  },
  {
    id: 'hl-5',
    startMs: 200000,
    endMs: 215000,
    score: 71,
    triggers: ['音量峰值: +10dB', '弹幕密度: 60/min'],
    accepted: null,
  },
];

const MOCK_SUBTITLES: SubtitleBlock[] = [
  { id: 'sub-1', startMs: 0, endMs: 2500, text: '大家好，欢迎收看本期视频', confidence: 0.97, edited: false },
  { id: 'sub-2', startMs: 2800, endMs: 6200, text: '今天我们来聊一下原神 4.7 版本的深渊阵容', confidence: 0.94, edited: false },
  { id: 'sub-3', startMs: 6500, endMs: 10200, text: '这个版本最大的变化是 12 层加入了新的敌人配置', confidence: 0.91, edited: false },
  { id: 'sub-4', startMs: 10500, endMs: 14800, text: '我测试了三套阵容，分别是胡桃蒸发队、妮露绽放队和散兵速切队', confidence: 0.88, edited: false },
  { id: 'sub-5', startMs: 15000, endMs: 19200, text: '先说结论：胡桃蒸发队依然是版本答案', confidence: 0.93, edited: false },
  { id: 'sub-6', startMs: 19500, endMs: 23500, text: '但妮露绽放队在某些关卡有奇效', confidence: 0.85, edited: false },
  { id: 'sub-7', startMs: 23800, endMs: 28000, text: '散兵速切队需要较高的练度才能发挥', confidence: 0.89, edited: false },
  { id: 'sub-8', startMs: 28300, endMs: 32000, text: '接下来我会逐一展示每套阵容的实战效果', confidence: 0.96, edited: false },
];

let _callCounter = 0;
function nextRequestId(): string {
  _callCounter += 1;
  return `ai-req-${Date.now()}-${_callCounter}`;
}

export const useAIStore = create<AIState>((set, get) => ({
  providerMode: 'mock',
  capabilityToggles: {
    autoTag: true,
    coverScore: true,
    highlightDetect: true,
    subtitle: true,
  },
  callLog: [],
  tagSuggestions: [],
  appliedTags: [],
  lastAutoTagInput: null,
  coverScore: null,
  highlightSegments: [],
  highlightLevel: 'balanced',
  subtitleBlocks: [],
  subtitleMode: 'local',
  algorithmErrors: {},
  activeJobs: 0,
  loading: false,
  globalError: null,

  loadMockData: () => {
    set({
      loading: false,
      globalError: null,
      algorithmErrors: {},
      tagSuggestions: [],
      appliedTags: [],
      coverScore: null,
      highlightSegments: [],
      subtitleBlocks: [],
      callLog: [],
      activeJobs: 0,
    });
    // Preload mock data by running computes
    try {
      get().computeAutoTags({ title: '【原神】4.7深渊12层满星阵容推荐', danmaku: ['666', '太强了', '4.7太强了', '周本速通'], comments: ['分析太到位了！', '保底多少', '三连了'] });
      get().computeCoverScore('');
      get().computeHighlights();
      get().computeSubtitles();
    } catch { /* B4 */ }
  },

  setProviderMode: (mode) => set({ providerMode: mode }),
  toggleCapability: (capability) =>
    set((s) => ({
      capabilityToggles: { ...s.capabilityToggles, [capability]: !s.capabilityToggles[capability] },
    })),

  /* ── A2: Auto-tag compute ── */
  computeAutoTags: (input) => {
    try {
      const { providerMode } = get();
      const errors = { ...get().algorithmErrors };
      const requestId = nextRequestId();
      const startTime = Date.now();

      // B1: input guard
      if (!input.title && input.danmaku.length === 0 && input.comments.length === 0) {
        set({
          tagSuggestions: [],
          algorithmErrors: { ...errors, autoTag: '无有效输入（标题/弹幕/评论均为空）' },
        });
        return;
      }

      // B4: snapshot last valid input for retry replay
      set({ lastAutoTagInput: { title: input.title, danmaku: [...input.danmaku], comments: [...input.comments] } });

      // Mock provider
      let tags: TagSuggestion[];
      if (providerMode === 'mock') {
        // B2: sanitize all text inputs — sanitizeText() called on each mock tag below
        // Simulate cache hit for repeated calls
        const cacheHit = get().callLog.some((l) => l.capability === 'autoTag');
        tags = MOCK_TAGS.map((t) => ({
          ...t,
          tag: sanitizeText(t.tag),
          evidence: sanitizeText(t.evidence),
        }));
        const durationMs = Date.now() - startTime;
        set((s) => ({
          tagSuggestions: tags,
          callLog: [
            ...s.callLog,
            { requestId, capability: 'autoTag', mode: providerMode, durationMs, cacheHit, timestamp: new Date().toISOString() },
          ],
        }));
      } else {
        // remote/local would go here
        tags = MOCK_TAGS.map((t) => ({ ...t, tag: sanitizeText(t.tag), evidence: sanitizeText(t.evidence) }));
        const durationMs = Date.now() - startTime;
        set((s) => ({
          tagSuggestions: tags,
          callLog: [...s.callLog, { requestId, capability: 'autoTag', mode: providerMode, durationMs, cacheHit: false, timestamp: new Date().toISOString() }],
        }));
      }

      delete errors.autoTag;
      set({ algorithmErrors: errors });
    } catch (e) {
      set({
        algorithmErrors: { ...get().algorithmErrors, autoTag: `自动标签异常: ${(e as Error).message}` },
      });
    }
  },

  applyTags: (tags) => {
    // B6: only apply tags above confidence threshold
    const { tagSuggestions } = get();
    const safe = tags.filter((tag) => {
      const s = tagSuggestions.find((t) => t.tag === tag);
      return s && s.confidence >= TAG_LOW_CONFIDENCE_THRESHOLD;
    });
    set({ appliedTags: safe });
  },

  clearTags: () => set({ appliedTags: [] }),

  /* ── A3: Cover scoring ── */
  computeCoverScore: (_coverUrl) => {
    try {
      void _coverUrl; // placeholder: real impl will upload/analyze image
      const { providerMode } = get();
      const errors = { ...get().algorithmErrors };
      const requestId = nextRequestId();
      const startTime = Date.now();

      // B1: no image — still return mock for demo
      const cacheHit = get().callLog.some((l) => l.capability === 'coverScore');
      const score: CoverScore = {
        ...MOCK_COVER_SCORE,
        suggestions: MOCK_COVER_SCORE.suggestions.map(sanitizeText),
      };
      const durationMs = Date.now() - startTime;

      set((s) => ({
        coverScore: score,
        callLog: [...s.callLog, { requestId, capability: 'coverScore', mode: providerMode, durationMs, cacheHit, timestamp: new Date().toISOString() }],
        algorithmErrors: { ...errors },
      }));
      delete errors.coverScore;
      set({ algorithmErrors: errors });
    } catch (e) {
      set({
        algorithmErrors: { ...get().algorithmErrors, coverScore: `封面评分异常: ${(e as Error).message}` },
      });
    }
  },

  /* ── A4: Highlight detection ── */
  computeHighlights: () => {
    try {
      const { providerMode, highlightLevel } = get();
      const errors = { ...get().algorithmErrors };
      const requestId = nextRequestId();
      const startTime = Date.now();

      // Filter by detection level
      const minScore = highlightLevel === 'conservative' ? 80 : highlightLevel === 'balanced' ? 60 : 40;
      const segments = MOCK_HIGHLIGHTS
        .filter((h) => h.score >= minScore)
        .slice(0, HIGHLIGHT_MAX_SEGMENTS);

      const durationMs = Date.now() - startTime;

      set((s) => ({
        highlightSegments: segments,
        callLog: [...s.callLog, { requestId, capability: 'highlightDetect', mode: providerMode, durationMs, cacheHit: false, timestamp: new Date().toISOString() }],
        algorithmErrors: { ...errors },
      }));
      delete errors.highlightDetect;
      set({ algorithmErrors: errors });
    } catch (e) {
      set({
        algorithmErrors: { ...get().algorithmErrors, highlightDetect: `高光检测异常: ${(e as Error).message}` },
      });
    }
  },

  setHighlightLevel: (level) => {
    set({ highlightLevel: level });
    try { get().computeHighlights(); } catch { /* B4 */ }
  },

  acceptHighlight: (id) => {
    set((s) => ({
      highlightSegments: s.highlightSegments.map((h) =>
        h.id === id ? { ...h, accepted: true } : h,
      ),
    }));
  },

  rejectHighlight: (id) => {
    set((s) => ({
      highlightSegments: s.highlightSegments.map((h) =>
        h.id === id ? { ...h, accepted: false } : h,
      ),
    }));
  },

  /* ── A5: Subtitle generation ── */
  computeSubtitles: (_audioUrl?: string) => {
    try {
      const { providerMode, subtitleMode } = get();
      const errors = { ...get().algorithmErrors };
      const requestId = nextRequestId();
      const startTime = Date.now();

      // B5: remote mock → silent degrade to local WASM (write mode + recurse)
      if (subtitleMode === 'remote' && providerMode === 'mock') {
        set({ subtitleMode: 'local' });
        get().computeSubtitles(_audioUrl);
        return;
      }

      const blocks: SubtitleBlock[] = MOCK_SUBTITLES.map((b) => ({
        ...b,
        text: sanitizeText(b.text),
      }));
      const durationMs = Date.now() - startTime;

      set((s) => ({
        subtitleBlocks: blocks,
        callLog: [...s.callLog, { requestId, capability: 'subtitle', mode: providerMode, durationMs, cacheHit: false, timestamp: new Date().toISOString() }],
        algorithmErrors: { ...errors },
      }));
      delete errors.subtitle;
      set({ algorithmErrors: errors });
    } catch (e) {
      set({
        algorithmErrors: { ...get().algorithmErrors, subtitle: `字幕生成异常: ${(e as Error).message}` },
      });
    }
  },

  editSubtitleBlock: (id, text) => {
    set((s) => ({
      subtitleBlocks: s.subtitleBlocks.map((b) =>
        b.id === id ? { ...b, text: sanitizeText(text), edited: true } : b,
      ),
    }));
  },

  setSubtitleMode: (mode) => {
    set({ subtitleMode: mode });
    try { get().computeSubtitles(); } catch { /* B4 */ }
  },

  /* ── B4: retry ── */
  retryCompute: (key: string) => {
    const getters: Record<string, () => void> = {
      autoTag: () => {
        const last = get().lastAutoTagInput;
        if (last) {
          get().computeAutoTags(last);
        } else {
          // No prior input — don't retry with empty (would trigger B1)
          set({ algorithmErrors: { ...get().algorithmErrors, autoTag: '无可重放的输入快照，请先输入内容再分析' } });
        }
      },
      coverScore: () => get().computeCoverScore(''),
      highlightDetect: () => get().computeHighlights(),
      subtitle: () => get().computeSubtitles(),
    };
    const fn = getters[key];
    if (fn) {
      set({ algorithmErrors: { ...get().algorithmErrors, [key]: null } });
      fn();
    }
  },

  /* ── D5: audit log ── */
  getAuditLog: () => {
    const { callLog, appliedTags, highlightSegments, algorithmErrors } = get();
    return JSON.stringify(
      {
        calls: callLog,
        appliedTags,
        highlightActions: highlightSegments.filter((h) => h.accepted !== null).map((h) => ({
          id: h.id,
          action: h.accepted ? 'accept' : 'reject',
        })),
        errors: Object.entries(algorithmErrors).filter(([, v]) => v !== null),
      },
      null,
      2,
    );
  },
}));
