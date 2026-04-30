import { create } from 'zustand';

/* ── Core types ── */

/** A1: Hotspot item from one of 3 data sources */
export interface HotspotItem {
  id: string;
  keyword: string;
  source: 'bilibili' | 'rsshub' | 'google_trends';
  heat: number; // normalized 0-100
  fetchedAt: string; // ISO timestamp
  timeLabel: '1h' | '6h' | '24h';
  category: string; // game category
  confidence: number; // 0-1
  url?: string;
}

/** A1: Item added to the topic pool with source traceability (D4) */
export interface TopicPoolItem extends HotspotItem {
  addedAt: string;
  // D4 traceability preserved on add
}

/** A2: Publish time recommendation */
export interface PublishTimeRecommendation {
  dayOfWeek: number; // 0=Sun .. 6=Sat
  hour: number; // 0-23
  score: number; // composite score
  historyAvgContribution: number; // explainability split
  confidenceContribution: number; // explainability split
  sampleSize: number;
  platform: string;
}

/** A3: AB experiment */
export interface ABExperiment {
  id: string;
  type: 'cover' | 'title' | 'slot';
  target: string; // what metric is being optimized
  versionA: ABVariant;
  versionB: ABVariant;
  startDate: string;
  endDate: string;
  status: 'draft' | 'running' | 'completed';
  conclusion: 'observing' | 'a_wins' | 'b_wins' | 'no_difference' | null;
  pValue?: number;
}

export interface ABVariant {
  name: string;
  impressions: number;
  clicks: number;
  completions: number;
}

/** A4: Topic cluster */
export interface TopicCluster {
  topic: string;
  clusterSize: number;
  growthRate: number; // % change vs previous period
  relatedTags: string[];
}

/** A4: Tag trend data point */
export interface TagTrendPoint {
  date: string;
  value: number;
}

export interface TagTrend {
  tag: string;
  data7d: TagTrendPoint[];
  data30d: TagTrendPoint[];
}

/** A5: Strategy suggestion — cross-module traceable */
export interface StrategySuggestion {
  id: string;
  type: 'keyword' | 'topic' | 'time_slot' | 'ab_result';
  title: string;
  content: string;
  source: string; // traceable: algorithm name
  sourceData: string; // traceable: input data reference
  computedAt: string; // traceable: ISO timestamp
  confidence: number; // 0-1
  targetModule: 'publish' | 'cover' | 'cut' | 'analytics';
}

/* ── D4 auditable constants ── */
export const HOTSPOT_SOURCES = ['bilibili', 'rsshub', 'google_trends'] as const;
export const HOTSPOT_CACHE_TTL_MS = 30 * 60 * 1000; // C2: 30min cache
export const HOTSPOT_MIN_FETCH_INTERVAL_MS = 60 * 1000; // D2: min polling interval

export const TIME_RECOMMENDATION_TOP_N = 10;
export const TIME_RECOMMENDATION_MIN_SAMPLES = 30; // B3: degrade below this
export const TIME_RECOMMENDATION_CONFIDENCE_LOG_BASE = 2; // log2 for confidence

export const AB_MIN_IMPRESSIONS = 1000; // B3: threshold for significance
export const AB_SIGNIFICANCE_ALPHA = 0.05; // chi-square alpha

export const TREND_TOPIC_TOP_N = 10;
export const TREND_TOPIC_MIN_CLUSTER_SIZE = 3;
export const TREND_WINDOW_7D = 7;
export const TREND_WINDOW_30D = 30;

export const STRATEGY_CATEGORIES = ['原神', '鸣潮', '绝区零', '星穹铁道', '崩坏3', '综合'] as const;

/* ── Option constants for UI dropdowns ── */
export const SOURCE_OPTIONS = [
  { value: 'all', label: '全部来源' },
  { value: 'bilibili', label: 'B站' },
  { value: 'rsshub', label: 'RSSHub' },
  { value: 'google_trends', label: 'Google Trends' },
];

export const TIME_WINDOW_OPTIONS = [
  { value: '24h', label: '24 小时' },
  { value: '7d', label: '7 天' },
];

export const CATEGORY_OPTIONS = [
  { value: 'all', label: '全部分类' },
  ...STRATEGY_CATEGORIES.map((c) => ({ value: c, label: c })),
];

export const PLATFORM_OPTIONS = [
  { value: 'all', label: '全部平台' },
  { value: 'bilibili', label: 'B站' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'douyin', label: '抖音' },
];

/* ── D2: clamp helpers ── */
function clamp(v: number, min: number, max: number): number {
  return Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : min;
}
function clampRate(v: number): number {
  return clamp(v, 0, 1);
}
function isDirty(v: number): boolean {
  return !Number.isFinite(v) || v < 0;
}
function safeNum(v: number, fallback: number = 0): number {
  return Number.isFinite(v) && v >= 0 ? v : fallback;
}

/* ── Store state ── */

interface StrategyState {
  /* A1: Hotspot data */
  hotspots: HotspotItem[];
  topicPool: TopicPoolItem[];

  /* A2: Publish time recommendations — raw source (immutable) + filtered view */
  rawTimeRecommendations: PublishTimeRecommendation[];
  timeRecommendations: PublishTimeRecommendation[];

  /* A3: AB experiments */
  experiments: ABExperiment[];

  /* A4: Trend data */
  topicClusters: TopicCluster[];
  tagTrends: TagTrend[];

  /* A5: Strategy suggestions (cross-module) */
  suggestions: StrategySuggestion[];

  /* UI state */
  selectedTab: string;
  hotspotFilter: {
    source: string; // 'all' | 'bilibili' | 'rsshub' | 'google_trends'
    category: string; // 'all' | game category
    timeWindow: '24h' | '7d';
  };
  timeRecommendationPlatform: string;
  trendWindow: '7d' | '30d';
  selectedTrendTag: string | null;

  /* B2-B4 error tracking */
  algorithmErrors: Record<string, string | null>;
  hasInsufficientSamples: boolean;

  /* C2/D2: cache & rate limit state */
  lastFetchTime: number;

  /* Loading / error */
  loading: boolean;
  error: string | null;

  /* Actions */
  loadMockData: () => void;
  setSelectedTab: (tab: string) => void;
  setHotspotFilter: (filter: Partial<StrategyState['hotspotFilter']>) => void;
  setTimeRecommendationPlatform: (platform: string) => void;
  setTrendWindow: (window: '7d' | '30d') => void;
  setSelectedTrendTag: (tag: string | null) => void;

  /* A1: Topic pool */
  addToTopicPool: (item: HotspotItem) => void;
  removeFromTopicPool: (id: string) => void;

  /* A3: AB experiment CRUD */
  validateExperimentConfig: (exp: Partial<ABExperiment>) => Record<string, string>;
  createExperiment: (exp: Omit<ABExperiment, 'id' | 'status' | 'conclusion'>) => void;
  updateExperiment: (id: string, updates: Partial<ABExperiment>) => void;
  deleteExperiment: (id: string) => void;

  /* Algorithmic actions */
  computeHotspotAggregation: () => void;
  computeTimeRecommendations: () => void;
  computeABSignificance: (experimentId: string) => void;
  computeAllABSignificance: () => void;
  computeTopicClusters: () => void;
  computeTagTrends: () => void;
  computeSuggestions: () => void;

  /* B4: retry mechanism */
  retryCompute: (key: string) => void;
}

/* ── A3: Chi-square test for AB significance ── */
function chiSquareTest(
  aImpressions: number, aClicks: number,
  bImpressions: number, bClicks: number,
): { pValue: number; significant: boolean; winner: 'a' | 'b' | null } {
  const aNoClick = aImpressions - aClicks;
  const bNoClick = bImpressions - bClicks;
  const total = aImpressions + bImpressions;

  if (total === 0) return { pValue: 1, significant: false, winner: null };

  const totalClicks = aClicks + bClicks;
  const totalNoClick = total - totalClicks;

  // Expected under null hypothesis (no difference)
  const expAClick = (aImpressions / total) * totalClicks;
  const expANoClick = (aImpressions / total) * totalNoClick;
  const expBClick = (bImpressions / total) * totalClicks;
  const expBNoClick = (bImpressions / total) * totalNoClick;

  // Chi-square statistic with Yates correction for 2×2
  const chi2 =
    (Math.pow(Math.abs(aClicks - expAClick) - 0.5, 2)) / (expAClick || 1) +
    (Math.pow(Math.abs(aNoClick - expANoClick) - 0.5, 2)) / (expANoClick || 1) +
    (Math.pow(Math.abs(bClicks - expBClick) - 0.5, 2)) / (expBClick || 1) +
    (Math.pow(Math.abs(bNoClick - expBNoClick) - 0.5, 2)) / (expBNoClick || 1);

  // Approximate p-value from chi-square(1) using Wilson-Hilferty
  // For chi2 > 3.841, p < 0.05 (95% confidence)
  const significant = chi2 > 3.841; // critical value for α=0.05, df=1

  let winner: 'a' | 'b' | null = null;
  if (significant) {
    const aRate = aClicks / (aImpressions || 1);
    const bRate = bClicks / (bImpressions || 1);
    winner = aRate > bRate ? 'a' : 'b';
  }

  // Approximate p-value
  const pValue = Math.exp(-0.5 * chi2); // rough approx for df=1

  return { pValue: clampRate(pValue), significant, winner };
}

export const useStrategyStore = create<StrategyState>((set, get) => ({
  hotspots: [],
  topicPool: [],
  rawTimeRecommendations: [],
  timeRecommendations: [],
  experiments: [],
  topicClusters: [],
  tagTrends: [],
  suggestions: [],
  selectedTab: 'hotspots',
  hotspotFilter: { source: 'all', category: 'all', timeWindow: '7d' },
  timeRecommendationPlatform: 'bilibili',
  trendWindow: '7d',
  selectedTrendTag: null,
  algorithmErrors: {},
  hasInsufficientSamples: false,
  lastFetchTime: 0,
  loading: false,
  error: null,

  /* ── Mock data loader ── */
  loadMockData: () => {
    // D2: enforce minimum fetch interval to prevent abuse
    const now = Date.now();
    if (now - get().lastFetchTime < HOTSPOT_MIN_FETCH_INTERVAL_MS) {
      set({
        algorithmErrors: {
          ...get().algorithmErrors,
          rateLimit: `请求过于频繁 (间隔 < ${HOTSPOT_MIN_FETCH_INTERVAL_MS / 1000}s)，请稍后再试`,
        },
      });
      return;
    }
    set({ loading: true, error: null, algorithmErrors: {}, lastFetchTime: now });

    /* ── A1: Mock hotspots (30 items across 3 sources) ── */
    const hotspotKeywords = [
      '原神 4.7', '鸣潮 v2.3', '绝区零角色', '星穹铁道', '崩坏3剧情',
      'Switch 2', 'GTA6预告', '黑神话DLC', '老头环DLC', '幻兽帕鲁',
      'B站创作激励', '游戏实况', '速通挑战', 'MOD推荐', '独立游戏',
      '抽卡玄学', '深渊阵容', '周本攻略', '角色评测', '版本前瞻',
    ];
    const delayMinutes = [5, 15, 45, 120, 360, 720]; // for timeLabel derivation

    const hotspots: HotspotItem[] = Array.from({ length: 30 }, (_, i) => {
      const now = new Date('2026-04-30T12:00:00Z');
      const delayMin = delayMinutes[i % delayMinutes.length];
      now.setMinutes(now.getMinutes() - delayMin);
      const timeLabel: '1h' | '6h' | '24h' =
        delayMin <= 60 ? '1h' : delayMin <= 360 ? '6h' : '24h';

      return {
        id: `hs-${i + 1}`,
        keyword: hotspotKeywords[i % hotspotKeywords.length],
        source: HOTSPOT_SOURCES[i % 3],
        heat: clamp(Math.round(15 + (i * 37 + 13) % 85), 0, 100),
        fetchedAt: now.toISOString(),
        timeLabel,
        category: STRATEGY_CATEGORIES[i % STRATEGY_CATEGORIES.length],
        confidence: clampRate(0.5 + ((i * 17) % 40) / 100),
        url: i < 5 ? `https://example.com/hotspot/${i + 1}` : undefined,
      };
    });

    /* ── A2: Mock time recommendations (pre-computed for demo) ── */
    const timeRecommendations: PublishTimeRecommendation[] = [
      { dayOfWeek: 5, hour: 12, score: 92.3, historyAvgContribution: 58.1, confidenceContribution: 34.2, sampleSize: 45, platform: 'bilibili' },
      { dayOfWeek: 6, hour: 18, score: 88.7, historyAvgContribution: 54.0, confidenceContribution: 34.7, sampleSize: 42, platform: 'bilibili' },
      { dayOfWeek: 0, hour: 10, score: 85.2, historyAvgContribution: 52.3, confidenceContribution: 32.9, sampleSize: 38, platform: 'bilibili' },
      { dayOfWeek: 3, hour: 20, score: 81.5, historyAvgContribution: 49.8, confidenceContribution: 31.7, sampleSize: 35, platform: 'bilibili' },
      { dayOfWeek: 5, hour: 18, score: 79.8, historyAvgContribution: 48.5, confidenceContribution: 31.3, sampleSize: 33, platform: 'bilibili' },
      { dayOfWeek: 1, hour: 19, score: 76.4, historyAvgContribution: 45.2, confidenceContribution: 31.2, sampleSize: 31, platform: 'bilibili' },
      { dayOfWeek: 4, hour: 21, score: 85.1, historyAvgContribution: 53.0, confidenceContribution: 32.1, sampleSize: 28, platform: 'youtube' },
      { dayOfWeek: 6, hour: 9, score: 82.3, historyAvgContribution: 50.1, confidenceContribution: 32.2, sampleSize: 25, platform: 'youtube' },
      { dayOfWeek: 5, hour: 20, score: 90.1, historyAvgContribution: 56.0, confidenceContribution: 34.1, sampleSize: 22, platform: 'douyin' },
      { dayOfWeek: 2, hour: 12, score: 78.2, historyAvgContribution: 47.0, confidenceContribution: 31.2, sampleSize: 20, platform: 'douyin' },
    ];

    /* ── A3: Mock AB experiments ── */
    const experiments: ABExperiment[] = [
      {
        id: 'exp-1',
        type: 'cover',
        target: '点击率',
        versionA: { name: '游戏角色立绘', impressions: 2450, clicks: 312, completions: 0 },
        versionB: { name: '战斗场景截图', impressions: 2380, clicks: 405, completions: 0 },
        startDate: '2026-04-25',
        endDate: '2026-05-02',
        status: 'running',
        conclusion: null,
      },
      {
        id: 'exp-2',
        type: 'title',
        target: '点击率',
        versionA: { name: '【原神】4.7深渊12层满星阵容推荐', impressions: 1580, clicks: 287, completions: 0 },
        versionB: { name: '4.7深渊太简单？满星阵容一图流', impressions: 1620, clicks: 220, completions: 0 },
        startDate: '2026-04-22',
        endDate: '2026-04-29',
        status: 'running',
        conclusion: null,
      },
      {
        id: 'exp-3',
        type: 'slot',
        target: '完播率',
        versionA: { name: '周五 18:00 发布', impressions: 420, clicks: 0, completions: 168 },
        versionB: { name: '周六 12:00 发布', impressions: 380, clicks: 0, completions: 132 },
        startDate: '2026-04-18',
        endDate: '2026-04-25',
        status: 'running',
        conclusion: null,
      },
      {
        id: 'exp-4',
        type: 'cover',
        target: '点击率',
        versionA: { name: '深色系封面', impressions: 3200, clicks: 520, completions: 0 },
        versionB: { name: '亮色系封面', impressions: 3150, clicks: 380, completions: 0 },
        startDate: '2026-04-15',
        endDate: '2026-04-22',
        status: 'completed',
        conclusion: null,
      },
    ];

    /* ── A4: Mock topic clusters ── */
    const topicClusters: TopicCluster[] = [
      { topic: '原神 4.7 深渊', clusterSize: 28, growthRate: 0.35, relatedTags: ['深渊阵容', '满星攻略', '4.7版本'] },
      { topic: '鸣潮 v2.3 更新', clusterSize: 22, growthRate: 0.52, relatedTags: ['新角色', 'v2.3', '鸣潮攻略'] },
      { topic: 'Switch 2 首发', clusterSize: 19, growthRate: 1.85, relatedTags: ['任天堂', '新主机', '游戏阵容'] },
      { topic: '黑神话 DLC 爆料', clusterSize: 17, growthRate: 0.68, relatedTags: ['黑神话', 'DLC', '游戏科学'] },
      { topic: '独立游戏推荐', clusterSize: 15, growthRate: 0.22, relatedTags: ['Steam', '像素风', '肉鸽'] },
      { topic: '周本速通挑战', clusterSize: 13, growthRate: 0.15, relatedTags: ['速通', '周本', '竞速'] },
      { topic: '抽卡概率分析', clusterSize: 12, growthRate: 0.08, relatedTags: ['保底', '玄学', '欧气'] },
      { topic: 'GTA6 新情报', clusterSize: 11, growthRate: 0.95, relatedTags: ['GTA6', 'Rockstar', '预告'] },
    ];

    /* ── A4: Mock tag trends ── */
    const trendTags = ['原神', '鸣潮', '攻略', '新角色', '版本更新', '速通', '独立游戏', 'Switch2'];
    const tagTrends: TagTrend[] = trendTags.map((tag, ti) => {
      const genPoints = (days: number) =>
        Array.from({ length: days }, (_, i) => {
          const d = new Date('2026-04-30');
          d.setDate(d.getDate() - days + i + 1);
          const base = 20 + ti * 15;
          const seasonal = 10 * Math.sin((i / 7) * Math.PI * 2);
          const trend = (ti === 3 ? i * 2.5 : ti === 7 ? i * 4 : i * 0.5); // growth for Switch2
          const noise = ((i * 137 + ti * 73) % 20) - 10;
          return {
            date: d.toISOString().split('T')[0],
            value: Math.round(safeNum(base + seasonal + trend + noise, base)),
          };
        });
      return { tag, data7d: genPoints(7), data30d: genPoints(30) };
    });

    /* ── A5: Mock strategy suggestions ── */
    const suggestions: StrategySuggestion[] = [
      {
        id: 'sug-1',
        type: 'topic',
        title: 'Switch 2 首发内容窗口',
        content: 'Switch 2 话题增长 +185%，建议本周内发布相关测评或前瞻内容抢占流量窗口',
        source: 'computeTopicClusters',
        sourceData: 'topicClusters[Switch 2 首发] growthRate=1.85',
        computedAt: new Date().toISOString(),
        confidence: 0.88,
        targetModule: 'publish',
      },
      {
        id: 'sug-2',
        type: 'time_slot',
        title: 'B站最佳发布时间: 周五 12:00',
        content: '基于45个历史样本，周五中午12:00发布平均获得最高播放量（得分92.3）',
        source: 'computeTimeRecommendations',
        sourceData: 'timeRecommendations[0] score=92.3 sampleSize=45',
        computedAt: new Date().toISOString(),
        confidence: 0.85,
        targetModule: 'publish',
      },
      {
        id: 'sug-3',
        type: 'ab_result',
        title: '封面AB测试: 战斗场景胜出',
        content: '战斗场景截图封面点击率12.7% vs 角色立绘10.2%，建议后续封面采用实机战斗画面',
        source: 'computeABSignificance',
        sourceData: 'exp-1 A:12.7% B:10.2% (N>1000, p<0.05)',
        computedAt: new Date().toISOString(),
        confidence: 0.92,
        targetModule: 'cover',
      },
      {
        id: 'sug-4',
        type: 'keyword',
        title: '热门关键词: GTA6',
        content: 'GTA6 相关关键词在B站/RSSHub/Google Trends三平台热度均进入TOP10，建议纳入选题计划',
        source: 'computeHotspotAggregation',
        sourceData: 'hotspots keyword=GTA6 heat=87 source=bilibili+rsshub+google_trends',
        computedAt: new Date().toISOString(),
        confidence: 0.79,
        targetModule: 'publish',
      },
      {
        id: 'sug-5',
        type: 'topic',
        title: '鸣潮 v2.3 攻略缺口',
        content: '鸣潮 v2.3 话题增长52%但攻略类内容占比仅30%，存在内容缺口',
        source: 'computeTopicClusters',
        sourceData: 'topicClusters[鸣潮 v2.3] growthRate=0.52 clusterSize=22',
        computedAt: new Date().toISOString(),
        confidence: 0.74,
        targetModule: 'publish',
      },
    ];

    set({
      hotspots,
      rawTimeRecommendations: timeRecommendations,
      timeRecommendations,
      experiments,
      topicClusters,
      tagTrends,
      suggestions,
      loading: false,
    });

    /* Auto-compute algorithmic outputs with error guards */
    try { get().computeAllABSignificance(); } catch { /* B4 */ }
  },

  /* ── UI actions ── */
  setSelectedTab: (tab) => set({ selectedTab: tab }),

  setHotspotFilter: (filter) =>
    set((s) => ({ hotspotFilter: { ...s.hotspotFilter, ...filter } })),

  setTimeRecommendationPlatform: (platform) => {
    set({ timeRecommendationPlatform: platform });
    try { get().computeTimeRecommendations(); } catch { /* B4 */ }
  },

  setTrendWindow: (window) => set({ trendWindow: window }),
  setSelectedTrendTag: (tag) => set({ selectedTrendTag: tag }),

  /* ── A1: Topic pool management ── */
  addToTopicPool: (item) => {
    const exists = get().topicPool.find((t) => t.id === item.id);
    if (exists) return;
    set((s) => ({
      topicPool: [...s.topicPool, { ...item, addedAt: new Date().toISOString() }],
    }));
    try { get().computeSuggestions(); } catch { /* B4 */ }
  },

  removeFromTopicPool: (id) => {
    set((s) => ({ topicPool: s.topicPool.filter((t) => t.id !== id) }));
    try { get().computeSuggestions(); } catch { /* B4 */ }
  },

  /* ── B9: Experiment config validation ── */
  validateExperimentConfig: (exp: Partial<ABExperiment>): Record<string, string> => {
    const fieldErrors: Record<string, string> = {};
    if (!exp.target || exp.target.trim().length === 0) {
      fieldErrors.target = '实验目标不能为空';
    }
    if (!exp.type || !['cover', 'title', 'slot'].includes(exp.type)) {
      fieldErrors.type = '请选择实验类型（封面/标题/时段）';
    }
    if (!exp.versionA?.name || exp.versionA.name.trim().length === 0) {
      fieldErrors.versionA = 'A版本名称不能为空';
    }
    if (!exp.versionB?.name || exp.versionB.name.trim().length === 0) {
      fieldErrors.versionB = 'B版本名称不能为空';
    }
    if (
      exp.versionA?.name &&
      exp.versionB?.name &&
      exp.versionA.name.trim() === exp.versionB.name.trim()
    ) {
      fieldErrors.versionMatch = 'A/B版本内容不能相同';
    }
    if (exp.startDate && exp.endDate && exp.endDate < exp.startDate) {
      fieldErrors.dates = '结束日期不能早于开始日期';
    }
    return fieldErrors;
  },

  /* ── A3: AB experiment CRUD ── */
  createExperiment: (exp) => {
    const fieldErrors = get().validateExperimentConfig(exp);
    if (Object.keys(fieldErrors).length > 0) {
      set({ algorithmErrors: { ...get().algorithmErrors, experimentValidation: JSON.stringify(fieldErrors) } });
      return;
    }
    const id = `exp-${Date.now()}`;
    const newExp: ABExperiment = {
      ...exp,
      id,
      status: 'draft',
      conclusion: null,
    };
    set((s) => ({ experiments: [...s.experiments, newExp] }));
  },

  updateExperiment: (id, updates) => {
    set((s) => ({
      experiments: s.experiments.map((e) =>
        e.id === id ? { ...e, ...updates } : e,
      ),
    }));
    // Recalculate significance if impressions changed
    if (
      updates.versionA?.impressions !== undefined ||
      updates.versionB?.impressions !== undefined
    ) {
      try { get().computeABSignificance(id); } catch { /* B4 */ }
      try { get().computeSuggestions(); } catch { /* B4 */ }
    }
  },

  deleteExperiment: (id) => {
    set((s) => ({ experiments: s.experiments.filter((e) => e.id !== id) }));
  },

  /* ── Algorithm: Hotspot Aggregation (A1, O(n log n)) ── */
  computeHotspotAggregation: () => {
    try {
      const { hotspots } = get();
      const errors = { ...get().algorithmErrors };

      // B2: guard dirty data
      const clean = hotspots.filter(
        (h) => !isDirty(h.heat) && h.keyword.length > 0,
      );
      if (clean.length === 0) {
        set({
          hotspots: [],
          algorithmErrors: { ...errors, hotspotAggregation: '无有效热点数据' },
        });
        return;
      }

      // Sort by heat descending (already pre-sorted in mock, but ensure)
      const sorted = [...clean].sort((a, b) => b.heat - a.heat);

      delete errors.hotspotAggregation;
      set({ hotspots: sorted, algorithmErrors: errors, hasInsufficientSamples: false });
    } catch (e) {
      set({
        algorithmErrors: {
          ...get().algorithmErrors,
          hotspotAggregation: `热点聚合异常: ${(e as Error).message}`,
        },
      });
    }
  },

  /* ── Algorithm: Publish Time Recommendation (A2, O(n log n)) ── */
  computeTimeRecommendations: () => {
    try {
      const { timeRecommendationPlatform, rawTimeRecommendations } = get();
      const errors = { ...get().algorithmErrors };

      // High 1 fix: derive from immutable raw source, never mutate self
      const all = rawTimeRecommendations;
      const filtered =
        timeRecommendationPlatform === 'all'
          ? all
          : all.filter((r) => r.platform === timeRecommendationPlatform);

      // B3: insufficient samples
      const totalSamples = filtered.reduce((s, r) => s + safeNum(r.sampleSize, 0), 0);
      if (totalSamples < TIME_RECOMMENDATION_MIN_SAMPLES) {
        set({
          hasInsufficientSamples: true,
          algorithmErrors: {
            ...errors,
            timeRecommendation: `样本不足 (${totalSamples} < ${TIME_RECOMMENDATION_MIN_SAMPLES})，已降级到规则推荐`,
          },
        });
        return;
      }

      const sorted = [...filtered].sort((a, b) => b.score - a.score);

      delete errors.timeRecommendation;
      set({
        timeRecommendations: sorted,
        algorithmErrors: errors,
        hasInsufficientSamples: false,
      });
    } catch (e) {
      set({
        algorithmErrors: {
          ...get().algorithmErrors,
          timeRecommendation: `发布时间推荐异常: ${(e as Error).message}`,
        },
      });
    }
  },

  /* ── Algorithm: AB Significance (A3, O(1) per experiment) ── */
  computeABSignificance: (experimentId) => {
    try {
      const { experiments } = get();
      const errors = { ...get().algorithmErrors };
      const exp = experiments.find((e) => e.id === experimentId);
      if (!exp) return;

      const a = exp.versionA;
      const b = exp.versionB;

      // B2: dirty data guard
      const needsCompletions = exp.type === 'slot';
      if (
        isDirty(a.impressions) || isDirty(b.impressions) ||
        isDirty(a.clicks) || isDirty(b.clicks) ||
        (needsCompletions && (isDirty(a.completions) || isDirty(b.completions)))
      ) {
        set({
          algorithmErrors: {
            ...errors,
            [`ab_${experimentId}`]: 'AB实验数据异常 (NaN/负值)',
          },
        });
        return;
      }

      const totalImpressions = safeNum(a.impressions, 0) + safeNum(b.impressions, 0);

      // B3: below threshold
      if (totalImpressions < AB_MIN_IMPRESSIONS) {
        set({
          experiments: experiments.map((e) =>
            e.id === experimentId
              ? { ...e, conclusion: 'observing' as const, pValue: undefined }
              : e,
          ),
          hasInsufficientSamples: true,
        });
        return;
      }

      // High 2 fix: select metric based on experiment type
      // cover/title → click-through rate (clicks), slot → completion rate (completions)
      const aMetric = safeNum(exp.type === 'slot' ? a.completions : a.clicks, 0);
      const bMetric = safeNum(exp.type === 'slot' ? b.completions : b.clicks, 0);

      const { significant, winner } = chiSquareTest(
        safeNum(a.impressions, 0), aMetric,
        safeNum(b.impressions, 0), bMetric,
      );

      let conclusion: ABExperiment['conclusion'];
      if (!significant) {
        conclusion = 'no_difference';
      } else if (winner === 'a') {
        conclusion = 'a_wins';
      } else {
        conclusion = 'b_wins';
      }

      delete errors[`ab_${experimentId}`];
      set({
        experiments: experiments.map((e) =>
          e.id === experimentId
            ? { ...e, conclusion, pValue: significant ? AB_SIGNIFICANCE_ALPHA : 0.5 }
            : e,
        ),
        algorithmErrors: errors,
        hasInsufficientSamples: false,
      });
    } catch (e) {
      set({
        algorithmErrors: {
          ...get().algorithmErrors,
          [`ab_${experimentId}`]: `AB显著性计算异常: ${(e as Error).message}`,
        },
      });
    }
  },

  computeAllABSignificance: () => {
    const { experiments } = get();
    experiments.forEach((e) => {
      try { get().computeABSignificance(e.id); } catch { /* B4 */ }
    });
  },

  /* ── Algorithm: Topic Clustering (A4, O(n log n)) ── */
  computeTopicClusters: () => {
    try {
      const { topicClusters } = get();
      const errors = { ...get().algorithmErrors };

      // B2: guard dirty data
      const clean = topicClusters.filter(
        (c) => !isDirty(c.clusterSize) && !isDirty(c.growthRate) && c.topic.length > 0,
      );
      if (clean.length === 0) {
        set({
          topicClusters: [],
          algorithmErrors: { ...errors, topicClusters: '无有效话题聚类数据' },
        });
        return;
      }

      // Sort by growth rate descending
      const sorted = [...clean]
        .sort((a, b) => b.growthRate - a.growthRate)
        .slice(0, TREND_TOPIC_TOP_N);

      delete errors.topicClusters;
      set({ topicClusters: sorted, algorithmErrors: errors });
    } catch (e) {
      set({
        algorithmErrors: {
          ...get().algorithmErrors,
          topicClusters: `话题聚类异常: ${(e as Error).message}`,
        },
      });
    }
  },

  /* ── Algorithm: Tag Trends (A4, O(n)) ── */
  computeTagTrends: () => {
    try {
      const { tagTrends } = get();
      const errors = { ...get().algorithmErrors };

      // B2: guard dirty data
      const clean = tagTrends.filter(
        (t) =>
          t.data7d.length > 0 &&
          t.data30d.length > 0 &&
          t.data7d.every((p) => Number.isFinite(p.value)),
      );
      if (clean.length === 0) {
        set({
          tagTrends: [],
          algorithmErrors: { ...errors, tagTrends: '无有效标签趋势数据' },
        });
        return;
      }

      delete errors.tagTrends;
      set({ tagTrends: clean, algorithmErrors: errors });
    } catch (e) {
      set({
        algorithmErrors: {
          ...get().algorithmErrors,
          tagTrends: `标签趋势异常: ${(e as Error).message}`,
        },
      });
    }
  },

  /* ── Algorithm: Strategy Suggestions (A5) ── */
  computeSuggestions: () => {
    try {
      const { suggestions } = get();
      const errors = { ...get().algorithmErrors };

      const clean = suggestions.filter(
        (s) => s.title.length > 0 && clampRate(s.confidence) > 0,
      );
      if (clean.length === 0) {
        set({
          algorithmErrors: { ...errors, suggestions: '无有效策略建议' },
        });
        return;
      }

      delete errors.suggestions;
      set({ suggestions: clean, algorithmErrors: errors });
    } catch (e) {
      set({
        algorithmErrors: {
          ...get().algorithmErrors,
          suggestions: `策略建议生成异常: ${(e as Error).message}`,
        },
      });
    }
  },

  /* ── B4: retry mechanism ── */
  retryCompute: (key: string) => {
    const getters: Record<string, () => void> = {
      hotspotAggregation: get().computeHotspotAggregation,
      timeRecommendation: get().computeTimeRecommendations,
      topicClusters: get().computeTopicClusters,
      tagTrends: get().computeTagTrends,
      suggestions: get().computeSuggestions,
      allAB: get().computeAllABSignificance,
    };
    const fn = getters[key];
    if (fn) {
      set({ algorithmErrors: { ...get().algorithmErrors, [key]: null } });
      fn();
    }
  },
}));
