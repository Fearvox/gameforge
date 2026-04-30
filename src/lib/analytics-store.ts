import { create } from 'zustand';

/* ── Core types ── */

export interface FanSnapshot {
  date: string;
  total: number;
  newFans: number;
  lostFans: number;
  netGrowth: number;
}

export interface VideoMetric {
  id: string;
  title: string;
  platform: 'bilibili' | 'youtube' | 'douyin';
  publishDate: string;
  publishHour: number; // 0-23
  publishDayOfWeek: number; // 0=Sun
  views: number;
  views7d: number;
  views30d: number;
  likes: number;
  comments: number;
  shares: number;
  danmaku: number;
  completionRate: number; // 0-1, D2 clamped
  avgWatchSeconds: number;
  totalWatchSeconds: number;
  duration: number; // seconds
}

export interface EngagementRecord {
  videoId: string;
  date: string;
  danmakuWords: string[];
  commentTexts: string[];
  likeCount: number;
  commentCount: number;
  danmakuCount: number;
  shareCount: number;
}

export interface CompetitorProfile {
  id: string;
  name: string;
  avatar: string;
  category: string;
  fanCount: number;
  totalViews: number;
  avgViews7d: number;
  avgLikes: number;
  avgComments: number;
  avgCompletionRate: number;
  publishFreq: number; // videos/month
  isVertical: boolean;
}

export interface SponsorshipDeal {
  id: string;
  brand: string;
  videoId: string;
  revenue: number;
  cost: number;
  roi: number;
  views: number;
  cpm: number;
  date: string;
}

export interface FunnelStep {
  label: string;
  count: number;
  rate: number; // D2 clamped [0,1]
}

/* ── Algorithmic output types ── */

export interface WordFreq {
  word: string;
  count: number;
  tfidf?: number;
}

export interface TimeSlot {
  dayOfWeek: number;
  hour: number;
  avgViews: number;
  score: number;
}

export interface FanForecast {
  date: string;
  predicted: number;
  lower: number; // 95% CI lower
  upper: number; // 95% CI upper
}

export interface CompetitorDistance {
  id: string;
  name: string;
  distance: number;
  rank: number;
}

export interface PercentileBucket {
  label: string;
  min: number;
  max: number;
  count: number;
  youAreHere: boolean;
}

/* ── D4 auditable constants ── */
export const HOLT_WINTERS_WINDOW = 30;
export const HOLT_WINTERS_FORECAST_DAYS = 14;
export const HOLT_WINTERS_SEASONAL_PERIOD = 7;
export const HOLT_WINTERS_SEASONAL_WEIGHT = 0.5;
export const HOLT_WINTERS_CI_Z = 1.96; // 95% confidence

export const TFIDF_TOP_N = 20;
export const TFIDF_MIN_WORD_LEN = 2;

export const TIME_SLOT_TOP_N = 10;
export const TIME_SLOT_CONFIDENCE_BASE = 2; // log2 base

export const COMPETITOR_WEIGHTS = [0.2, 0.35, 0.15, 0.15, 0.15]; // fanCount, avgViews7d, avgLikes, avgComments, avgCompletionRate
export const COMPETITOR_FEATURES = ['fanCount', 'avgViews7d', 'avgLikes', 'avgComments', 'avgCompletionRate'] as const;

export const PERCENTILE_LABELS = ['Top 10%', 'Top 25%', 'Top 50%', 'Bottom 50%'] as const;
export const PERCENTILE_CUTOFFS = [0.10, 0.25, 0.50];

export const PLATFORMS = ['bilibili', 'youtube', 'douyin'] as const;

export const SELF_FAN_COUNT = 128_500;

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

interface AnalyticsState {
  /* Raw data */
  fanHistory: FanSnapshot[];
  videoMetrics: VideoMetric[];
  engagements: EngagementRecord[];
  competitors: CompetitorProfile[];
  sponsorships: SponsorshipDeal[];

  /* Algorithmic outputs */
  fanForecast: FanForecast[];
  hotWords: WordFreq[];
  bestTimeSlots: TimeSlot[];
  funnelSteps: FunnelStep[];
  competitorRankings: CompetitorDistance[];
  percentileBuckets: PercentileBucket[];
  platformComparison: Record<string, Record<string, number>>;

  /* UI state */
  selectedTab: string;
  selectedPlatform: string;
  selectedCompetitor: string | null;
  dateRange: { start: string; end: string };

  /* B2-B4 error tracking */
  algorithmErrors: Record<string, string | null>;
  hasInsufficientSamples: boolean;

  /* Loading / error */
  loading: boolean;
  error: string | null;

  /* Actions */
  loadMockData: () => void;
  setSelectedTab: (tab: string) => void;
  setSelectedPlatform: (platform: string) => void;
  setSelectedCompetitor: (id: string | null) => void;
  setDateRange: (range: { start: string; end: string }) => void;

  /* Algorithmic actions */
  computeFanForecast: () => void;
  computeHotWords: () => void;
  computeBestTimeSlots: () => void;
  computeFunnel: (videoId: string) => void;
  computeCompetitorRankings: () => void;
  computePercentileBuckets: () => void;
  computePlatformComparison: () => void;

  /* B4: retry mechanism */
  retryCompute: (key: string) => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  fanHistory: [],
  videoMetrics: [],
  engagements: [],
  competitors: [],
  sponsorships: [],
  fanForecast: [],
  hotWords: [],
  bestTimeSlots: [],
  funnelSteps: [],
  competitorRankings: [],
  percentileBuckets: [],
  platformComparison: {},
  selectedTab: 'fans',
  selectedPlatform: 'bilibili',
  selectedCompetitor: null,
  dateRange: { start: '2026-03-01', end: '2026-04-30' },
  algorithmErrors: {},
  hasInsufficientSamples: false,
  loading: false,
  error: null,

  /* ── Mock data loader ── */
  loadMockData: () => {
    set({ loading: true, error: null, algorithmErrors: {} });

    /* ── Mock fan history (90 days, deterministic pattern) ── */
    const fanHistory: FanSnapshot[] = Array.from({ length: 90 }, (_, i) => {
      const d = new Date('2026-04-30');
      d.setDate(d.getDate() - 89 + i);
      const date = d.toISOString().split('T')[0];
      const total = 125000 + 3000 * Math.sin(i / 14) + i * 150 + (i * 137) % 2000;
      const newFans = Math.round(400 + (i * 73) % 600 + (i % 7 === 5 ? 800 : 0));
      const lostFans = Math.round(150 + (i * 91) % 300);
      return {
        date,
        total: Math.round(safeNum(total, 125000)),
        newFans: safeNum(newFans, 400),
        lostFans: safeNum(lostFans, 150),
        netGrowth: safeNum(newFans, 400) - safeNum(lostFans, 150),
      };
    });

    /* ── Mock video metrics (30 videos) ── */
    const gameNames = ['原神 4.7', '鸣潮 v2.3', '绝区零', '星穹铁道', '崩坏3'];
    const videoMetrics: VideoMetric[] = Array.from({ length: 30 }, (_, i) => {
      const d = new Date('2026-04-30');
      d.setDate(d.getDate() - (i * 2 + (i * 7) % 14)); // deterministic spread
      const game = gameNames[i % gameNames.length];
      const views = Math.round(50000 + (i * 13751) % 200000);
      const completionRate = clampRate(0.3 + (i * 0.017) % 0.5); // D2 clamped
      return {
        id: `v${i + 1}`,
        title: `${game}深度测评 #${i + 1}`,
        platform: (['bilibili', 'bilibili', 'bilibili', 'youtube', 'douyin'] as const)[
          i % 5
        ],
        publishDate: d.toISOString().split('T')[0],
        publishHour: (i * 7 + 3) % 24,
        publishDayOfWeek: d.getDay(),
        views: safeNum(views, 50000),
        views7d: safeNum(Math.round(views * (0.3 + (i * 0.013) % 0.4)), 15000),
        views30d: safeNum(Math.round(views * (0.5 + (i * 0.017) % 0.5)), 25000),
        likes: safeNum(Math.round(views * (0.03 + (i * 0.0017) % 0.05)), 1500),
        comments: safeNum(Math.round(views * (0.005 + (i * 0.0003) % 0.01)), 250),
        shares: safeNum(Math.round(views * (0.002 + (i * 0.00017) % 0.005)), 100),
        danmaku: safeNum(Math.round(views * (0.01 + (i * 0.001) % 0.03)), 500),
        completionRate,
        avgWatchSeconds: safeNum(120 + (i * 37) % 360, 120),
        totalWatchSeconds: safeNum(Math.round(views * (120 + (i * 37) % 360)), 6000000),
        duration: safeNum(240 + (i * 113) % 1200, 240),
      };
    });

    /* ── Mock engagements ── */
    const danmakuPool = [
      '神作', '太强了', '666', '笑死', '哈哈哈', '打卡', '第一', '来了来了',
      '这波操作', '太秀了', '分析的很好', '收藏了', '已三连', '好活当赏',
      '今天更新了', '期待下一期', '散兵yyds', '原神启动', '钟离最强', '关注了',
    ];
    const commentPool = [
      '分析太到位了！', '这个角色到底值不值得抽？', '已经三连', 'up主太肝了',
      '什么时候出下一期', '建议加个竞品对比', '数据很详细', '有帮助',
    ];
    const engagements: EngagementRecord[] = videoMetrics.slice(0, 10).map((v, idx) => ({
      videoId: v.id,
      date: v.publishDate,
      danmakuWords: Array.from(
        { length: 15 + idx * 3 },
        (_, j) => danmakuPool[(j + idx * 5) % danmakuPool.length],
      ),
      commentTexts: Array.from(
        { length: 3 + idx },
        (_, j) => commentPool[(j + idx * 2) % commentPool.length],
      ),
      likeCount: v.likes,
      commentCount: v.comments,
      danmakuCount: v.danmaku,
      shareCount: v.shares,
    }));

    /* ── Mock competitors (10 profiles) ── */
    const competitorNames = [
      '小白游戏测评', '老K游戏攻略', '啊粥游戏屋', '黑桐谷歌', '逍遥散人',
      '老番茄', '某幻君', '中国BOY', '花少北', '小潮院长',
    ];
    const categories = ['原神', '鸣潮', '绝区零', '星穹铁道', '崩坏3'];
    const competitors: CompetitorProfile[] = competitorNames.map((name, i) => ({
      id: `c${i + 1}`,
      name,
      avatar: `/avatars/c${i + 1}.png`,
      category: categories[i % categories.length],
      fanCount: Math.round(50000 + (i + 1) * 50000),
      totalViews: Math.round(2000000 + (i + 1) * 2000000),
      avgViews7d: Math.round(80000 + (i + 1) * 30000),
      avgLikes: Math.round(3000 + (i + 1) * 1500),
      avgComments: Math.round(500 + (i + 1) * 300),
      avgCompletionRate: clampRate(0.3 + i * 0.04), // D2 clamped
      publishFreq: 4 + i,
      isVertical: i < 5,
    }));

    /* ── Mock sponsorships ── */
    const brands = ['米哈游', 'B站游戏', '腾讯游戏', '网易游戏', '游戏蜂窝', '雷蛇'];
    const sponsorships: SponsorshipDeal[] = Array.from({ length: 8 }, (_, i) => {
      const rev = 5000 + (i + 1) * 3750;
      const cost = 1000 + (i + 1) * 625;
      const d = new Date('2026-04-30');
      d.setDate(d.getDate() - (i * 10 + i * 3));
      return {
        id: `s${i + 1}`,
        brand: brands[i % brands.length],
        videoId: `v${(i * 3 + 1) % 30 || 1}`,
        revenue: Math.round(safeNum(rev, 5000)),
        cost: Math.round(safeNum(cost, 1000)),
        roi: clampRate((rev - cost) / (cost || 1) / 5), // D2 clamped to reasonable range
        views: Math.round(safeNum(80000 + (i + 1) * 25000, 80000)),
        cpm: safeNum(5 + (i + 1) * 1.875, 5),
        date: d.toISOString().split('T')[0],
      };
    });

    set({
      fanHistory,
      videoMetrics,
      engagements,
      competitors,
      sponsorships,
      loading: false,
      hasInsufficientSamples: false,
    });

    /* Auto-compute algorithmic outputs with error guards (B2/B4) */
    try { get().computeFanForecast(); } catch { /* B4: will be tracked */ }
    try { get().computeHotWords(); } catch { /* B4 */ }
    try { get().computeBestTimeSlots(); } catch { /* B4 */ }
    try { get().computeFunnel(videoMetrics[0]?.id ?? ''); } catch { /* B4 */ }
    try { get().computeCompetitorRankings(); } catch { /* B4 */ }
    try { get().computePercentileBuckets(); } catch { /* B4 */ }
    try { get().computePlatformComparison(); } catch { /* B4 */ }
  },

  /* ── Algorithm 1: Fan Forecast — Holt-Winters Simplified (O(n)) ── */
  computeFanForecast: () => {
    try {
      const { fanHistory } = get();
      const errors = { ...get().algorithmErrors };

      // B2: guard dirty data
      const clean = fanHistory.filter(
        (s) => !isDirty(s.total) && !isDirty(s.newFans) && !isDirty(s.lostFans),
      );
      if (clean.length === 0) {
        set({ fanForecast: [], algorithmErrors: { ...errors, fanForecast: '无有效粉丝数据' } });
        return;
      }

      // B3: insufficient samples
      if (clean.length < 14) {
        set({
          hasInsufficientSamples: true,
          algorithmErrors: { ...errors, fanForecast: `样本不足（需≥14天，当前${clean.length}天），降级为线性回归` },
        });
        // Fall through with degradation — use simple linear regression only
      }

      const totals = clean.map((s) => s.total);
      const n = totals.length;

      /* Trend: linear regression slope over window */
      const windowSize = Math.min(HOLT_WINTERS_WINDOW, n);
      const recent = totals.slice(-windowSize);
      const xMean = (windowSize - 1) / 2;
      const yMean = recent.reduce((a, b) => a + b, 0) / windowSize;
      let numerator = 0;
      let denominator = 0;
      for (let i = 0; i < windowSize; i++) {
        numerator += (i - xMean) * (recent[i] - yMean);
        denominator += (i - xMean) ** 2;
      }
      const slope = denominator !== 0 ? numerator / denominator : 0;

      /* Seasonal: average day-over-day pattern (7-day cycle) */
      const seasonal: number[] = Array(HOLT_WINTERS_SEASONAL_PERIOD).fill(0);
      const seasonalCount: number[] = Array(HOLT_WINTERS_SEASONAL_PERIOD).fill(0);
      if (n >= 14) {
        for (let i = 7; i < n; i++) {
          const prev = totals[i - 1];
          if (prev === 0) continue; // B2: guard div by zero
          const diff = (totals[i] - prev) / prev;
          seasonal[i % 7] += diff;
          seasonalCount[i % 7]++;
        }
        for (let i = 0; i < 7; i++) {
          seasonal[i] = seasonalCount[i] > 0 ? seasonal[i] / seasonalCount[i] : 0;
        }
      }

      /* Forecast next 14 days */
      const fanForecast: FanForecast[] = [];
      const lastTotal = totals[totals.length - 1];
      const lastDate = new Date(clean[clean.length - 1].date);
      // D2: standard deviation with safe sqrt
      const variance = recent.reduce((s, v) => s + (v - yMean) ** 2, 0) / Math.max(1, windowSize);
      const stdDev = Math.sqrt(Math.max(0, variance));

      for (let i = 1; i <= HOLT_WINTERS_FORECAST_DAYS; i++) {
        const d = new Date(lastDate);
        d.setDate(d.getDate() + i);
        const dayOfWeek = d.getDay();
        const seasonalEffect = n >= 14 ? lastTotal * seasonal[dayOfWeek] * HOLT_WINTERS_SEASONAL_WEIGHT : 0;
        const predicted = lastTotal + slope * i + seasonalEffect;
        const margin = HOLT_WINTERS_CI_Z * stdDev;
        fanForecast.push({
          date: d.toISOString().split('T')[0],
          predicted: Math.round(safeNum(predicted, lastTotal)),
          lower: Math.round(safeNum(predicted - margin, 0)),
          upper: Math.round(safeNum(predicted + margin, predicted + margin)),
        });
      }

      // Medium 1: only clear error if NOT degraded (preserve B3 insufficient samples warning)
      if (n >= 14) {
        delete errors.fanForecast;
      }
      set({
        fanForecast,
        algorithmErrors: errors,
        hasInsufficientSamples: n < 14 || undefined,
      });
    } catch (e) {
      set({
        fanForecast: [],
        algorithmErrors: { ...get().algorithmErrors, fanForecast: `Holt-Winters 计算异常: ${(e as Error).message}` },
      });
    }
  },

  /* ── Algorithm 2: Hot Words — Frequency + TF-IDF Simplified (O(n)) ── */
  computeHotWords: () => {
    try {
      const { engagements, videoMetrics, selectedPlatform } = get();
      const errors = { ...get().algorithmErrors };

      // High 1: filter engagements by platform
      let filtered = engagements;
      if (selectedPlatform !== 'all') {
        const platformVideoIds = new Set(
          videoMetrics.filter((v) => v.platform === selectedPlatform).map((v) => v.id),
        );
        filtered = engagements.filter((e) => platformVideoIds.has(e.videoId));
      }

      // B2/B3: guard empty engagements
      if (filtered.length === 0) {
        set({ hotWords: [], algorithmErrors: { ...errors, hotWords: '当前筛选无互动数据' } });
        return;
      }

      const wordMap = new Map<string, { count: number; docs: Set<string> }>();
      const totalDocs = filtered.length;

      filtered.forEach((eng) => {
        const seen = new Set<string>();
        eng.danmakuWords.forEach((w) => {
          // D1: sanitize — strip any HTML/script-like content
          const safe = w.replace(/<[^>]*>/g, '').trim();
          if (safe.length < TFIDF_MIN_WORD_LEN) return;
          if (!wordMap.has(safe)) wordMap.set(safe, { count: 0, docs: new Set() });
          const entry = wordMap.get(safe)!;
          entry.count++;
          if (!seen.has(safe)) {
            entry.docs.add(eng.videoId);
            seen.add(safe);
          }
        });
        seen.clear();
        eng.commentTexts.forEach((text) => {
          text
            .split(/[\s,，。！？、；：""''（）]+/)
            .map((w) => w.replace(/<[^>]*>/g, '').trim())
            .filter((w) => w.length >= TFIDF_MIN_WORD_LEN)
            .forEach((safe) => {
              if (!wordMap.has(safe)) wordMap.set(safe, { count: 0, docs: new Set() });
              const entry = wordMap.get(safe)!;
              entry.count++;
              if (!seen.has(safe)) {
                entry.docs.add(eng.videoId);
                seen.add(safe);
              }
            });
        });
      });

      const hotWords: WordFreq[] = Array.from(wordMap.entries())
        .map(([word, { count, docs }]) => ({
          word,
          count,
          tfidf: count * Math.log((totalDocs + 1) / (docs.size + 1)),
        }))
        .sort((a, b) => (b.tfidf ?? 0) - (a.tfidf ?? 0))
        .slice(0, TFIDF_TOP_N);

      // B2: filter out any remaining dirty entries
      const cleanWords = hotWords.filter((w) => Number.isFinite(w.tfidf) && w.word.length > 0);

      delete errors.hotWords;
      set({
        hotWords: cleanWords,
        algorithmErrors: errors,
        hasInsufficientSamples: cleanWords.length < 5 || undefined,
      });
    } catch (e) {
      set({
        hotWords: [],
        algorithmErrors: { ...get().algorithmErrors, hotWords: `TF-IDF 计算异常: ${(e as Error).message}` },
      });
    }
  },

  /* ── Algorithm 3: Best Time Slots — 24×7 Weighted Matrix (O(n)) ── */
  computeBestTimeSlots: () => {
    try {
      const { videoMetrics, selectedPlatform } = get();
      const errors = { ...get().algorithmErrors };

      // High 1: filter by platform
      const metrics = selectedPlatform === 'all'
        ? videoMetrics
        : videoMetrics.filter((v) => v.platform === selectedPlatform);

      // B3: guard insufficient samples
      if (metrics.length < 3) {
        set({
          bestTimeSlots: [],
          hasInsufficientSamples: true,
          algorithmErrors: { ...errors, bestTimeSlots: `样本不足（需≥3条，当前${metrics.length}条）` },
        });
        return;
      }

      const slots = new Map<string, { totalViews: number; count: number }>();

      metrics.forEach((v) => {
        // B2: guard dirty metrics
        if (isDirty(v.views7d)) return;
        const key = `${v.publishDayOfWeek}:${v.publishHour}`;
        if (!slots.has(key)) slots.set(key, { totalViews: 0, count: 0 });
        const s = slots.get(key)!;
        s.totalViews += safeNum(v.views7d, 0);
        s.count++;
      });

      const bestTimeSlots: TimeSlot[] = Array.from(slots.entries())
        .map(([key, { totalViews, count }]) => {
          const [day, hour] = key.split(':').map(Number);
          const avgViews = count > 0 ? totalViews / count : 0;
          const confidence = Math.min(1, Math.log2(count + 1) / TIME_SLOT_CONFIDENCE_BASE);
          const score = avgViews * (0.5 + 0.5 * confidence);
          return { dayOfWeek: day, hour, avgViews: safeNum(avgViews, 0), score: safeNum(score, 0) };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, TIME_SLOT_TOP_N);

      delete errors.bestTimeSlots;
      set({ bestTimeSlots, algorithmErrors: errors });
    } catch (e) {
      set({
        bestTimeSlots: [],
        algorithmErrors: { ...get().algorithmErrors, bestTimeSlots: `时段矩阵计算异常: ${(e as Error).message}` },
      });
    }
  },

  /* ── Algorithm 4: Engagement Funnel (O(1) lookup) ── */
  computeFunnel: (videoId: string) => {
    try {
      const { videoMetrics } = get();
      const errors = { ...get().algorithmErrors };

      if (!videoId) {
        set({ funnelSteps: [], algorithmErrors: { ...errors, funnel: '未选择视频' } });
        return;
      }

      const video = videoMetrics.find((v) => v.id === videoId);
      if (!video) {
        set({ funnelSteps: [], algorithmErrors: { ...errors, funnel: `视频 ${videoId} 不存在` } });
        return;
      }

      // B2: guard dirty data
      if (isDirty(video.views)) {
        set({ funnelSteps: [], algorithmErrors: { ...errors, funnel: '视频播放数据异常' } });
        return;
      }

      const impressions = Math.round(safeNum(video.views, 1) * 1.5); // estimated CTI
      const clicks = safeNum(video.views, 1);
      const completion = Math.round(safeNum(clicks, 1) * clampRate(video.completionRate));
      const engaged = Math.round(
        safeNum(video.likes, 0) + safeNum(video.comments, 0) + safeNum(video.danmaku, 0) * 0.3,
      );

      delete errors.funnel;
      set({
        funnelSteps: [
          { label: '曝光', count: impressions, rate: clampRate(1) },
          { label: '点击', count: clicks, rate: clampRate(clicks / Math.max(1, impressions)) },
          { label: '完播', count: completion, rate: clampRate(completion / Math.max(1, clicks)) },
          { label: '互动', count: engaged, rate: clampRate(engaged / Math.max(1, completion)) },
        ],
        algorithmErrors: errors,
      });
    } catch (e) {
      set({
        funnelSteps: [],
        algorithmErrors: { ...get().algorithmErrors, funnel: `漏斗计算异常: ${(e as Error).message}` },
      });
    }
  },

  /* ── Algorithm 5: Competitor Rankings — Z-score + Weighted Euclidean (O(n·d)) ── */
  computeCompetitorRankings: () => {
    try {
      const { competitors, selectedCompetitor } = get();
      const errors = { ...get().algorithmErrors };

      if (competitors.length === 0) {
        set({ competitorRankings: [], algorithmErrors: { ...errors, competitor: '无竞品数据' } });
        return;
      }

      const featureKeys = [...COMPETITOR_FEATURES];

      /* Z-score normalize each feature */
      const means = featureKeys.map((f) => {
        const vals = competitors.map((c) => safeNum(c[f] as number, 0));
        return vals.reduce((a, b) => a + b, 0) / Math.max(1, vals.length);
      });
      const stds = featureKeys.map((f, fi) => {
        const vals = competitors.map((c) => safeNum(c[f] as number, 0));
        const variance = vals.reduce((s, v) => s + (v - means[fi]) ** 2, 0) / Math.max(1, vals.length);
        return Math.sqrt(Math.max(0, variance));
      });

      /* Find self */
      const selfIdx = selectedCompetitor
        ? competitors.findIndex((c) => c.id === selectedCompetitor)
        : 0;
      const selfIdxSafe = selfIdx >= 0 ? selfIdx : 0;
      const self = competitors[selfIdxSafe];
      if (!self) {
        set({ competitorRankings: [], algorithmErrors: { ...errors, competitor: '未找到基准博主' } });
        return;
      }

      /* Weighted Euclidean distance */
      const distances: CompetitorDistance[] = competitors.map((c) => {
        let dist = 0;
        featureKeys.forEach((f, fi) => {
          if (stds[fi] === 0) return; // B4: guard div by zero
          const zSelf = (safeNum(self[f] as number, 0) - means[fi]) / stds[fi];
          const zC = (safeNum(c[f] as number, 0) - means[fi]) / stds[fi];
          dist += COMPETITOR_WEIGHTS[fi] * (zSelf - zC) ** 2;
        });
        return { id: c.id, name: c.name, distance: Number.isFinite(dist) ? Math.sqrt(dist) : 999, rank: 0 };
      });

      distances.sort((a, b) => a.distance - b.distance);
      distances.forEach((d, i) => (d.rank = i + 1));

      delete errors.competitor;
      set({ competitorRankings: distances, algorithmErrors: errors });
    } catch (e) {
      set({
        competitorRankings: [],
        algorithmErrors: { ...get().algorithmErrors, competitor: `竞品排名计算异常: ${(e as Error).message}` },
      });
    }
  },

  /* ── Algorithm 6: Percentile Buckets (O(n log n)) ── */
  computePercentileBuckets: () => {
    try {
      const { competitors } = get();
      const errors = { ...get().algorithmErrors };

      if (competitors.length === 0) {
        set({ percentileBuckets: [], algorithmErrors: { ...errors, percentile: '无竞品数据' } });
        return;
      }

      // B2: filter dirty data
      const validCompetitors = competitors.filter((c) => !isDirty(c.fanCount));
      if (validCompetitors.length < 4) {
        set({
          percentileBuckets: [],
          hasInsufficientSamples: true,
          algorithmErrors: { ...errors, percentile: `样本不足（需≥4人，当前${validCompetitors.length}人）` },
        });
        return;
      }

      const sorted = validCompetitors.map((c) => c.fanCount).sort((a, b) => b - a);
      const n = sorted.length;

      const buckets: PercentileBucket[] = [];

      const cutoffs = [...PERCENTILE_CUTOFFS];
      for (let ci = 0; ci < cutoffs.length; ci++) {
        const cutoff = cutoffs[ci];
        const idx = Math.floor(n * cutoff);
        const nextIdx = ci > 0 ? Math.floor(n * cutoffs[ci - 1]) : 0;
        const min = sorted[idx] || 0;
        const max = ci === 0 ? sorted[0] : (sorted[nextIdx] || 0);
        buckets.push({
          label: PERCENTILE_LABELS[ci],
          min: safeNum(min, 0),
          max: safeNum(max, 0),
          count: ci === 0 ? Math.ceil(n * cutoff) : Math.ceil(n * (cutoff - cutoffs[ci - 1])),
          youAreHere: ci === 0
            ? SELF_FAN_COUNT >= min
            : SELF_FAN_COUNT >= min && SELF_FAN_COUNT < (sorted[nextIdx] || 0),
        });
      }
      // Bottom 50%
      buckets.push({
        label: PERCENTILE_LABELS[3],
        min: sorted[n - 1] || 0,
        max: sorted[Math.floor(n * PERCENTILE_CUTOFFS[2])] || 0,
        count: n - Math.ceil(n * PERCENTILE_CUTOFFS[2]),
        youAreHere: SELF_FAN_COUNT < (sorted[Math.floor(n * PERCENTILE_CUTOFFS[2])] || 0),
      });

      delete errors.percentile;
      set({ percentileBuckets: buckets, algorithmErrors: errors });
    } catch (e) {
      set({
        percentileBuckets: [],
        algorithmErrors: { ...get().algorithmErrors, percentile: `分桶计算异常: ${(e as Error).message}` },
      });
    }
  },

  /* ── Algorithm 7: Platform Comparison — Map-Reduce Pivot (O(n)) ── */
  computePlatformComparison: () => {
    try {
      const { videoMetrics } = get();
      const errors = { ...get().algorithmErrors };

      if (videoMetrics.length === 0) {
        set({ platformComparison: {}, algorithmErrors: { ...errors, platformComparison: '无视频数据' } });
        return;
      }

      const comparison: Record<string, Record<string, number>> = {};
      let hasDegradedPlatform = false;

      PLATFORMS.forEach((p) => {
        const filtered = videoMetrics.filter((v) => v.platform === p);

        // B7: degraded rendering for platforms with no data
        if (filtered.length === 0) {
          hasDegradedPlatform = true;
        }

        comparison[p] = {};
        comparison[p].videos = filtered.length;
        comparison[p].totalViews = filtered.reduce((s, v) => s + safeNum(v.views, 0), 0);
        comparison[p].totalLikes = filtered.reduce((s, v) => s + safeNum(v.likes, 0), 0);
        comparison[p].totalComments = filtered.reduce((s, v) => s + safeNum(v.comments, 0), 0);
        comparison[p].totalDanmaku = filtered.reduce((s, v) => s + safeNum(v.danmaku, 0), 0);
        comparison[p].avgCompletion =
          filtered.length > 0
            ? clampRate(filtered.reduce((s, v) => s + clampRate(v.completionRate), 0) / filtered.length)
            : 0;
      });

      if (hasDegradedPlatform) {
        errors.platformComparison = '部分平台数据不完整，已降级渲染';
      } else {
        delete errors.platformComparison;
      }

      set({ platformComparison: comparison, algorithmErrors: errors });
    } catch (e) {
      set({
        platformComparison: {},
        algorithmErrors: { ...get().algorithmErrors, platformComparison: `跨平台对比计算异常: ${(e as Error).message}` },
      });
    }
  },

  /* ── B4: retry mechanism ── */
  retryCompute: (key: string) => {
    const getters: Record<string, () => void> = {
      fanForecast: get().computeFanForecast,
      hotWords: get().computeHotWords,
      bestTimeSlots: get().computeBestTimeSlots,
      funnel: () => {
        const firstVid = get().videoMetrics[0]?.id;
        if (firstVid) get().computeFunnel(firstVid);
      },
      competitor: get().computeCompetitorRankings,
      percentile: get().computePercentileBuckets,
      platformComparison: get().computePlatformComparison,
    };
    const fn = getters[key];
    if (fn) {
      set({ algorithmErrors: { ...get().algorithmErrors, [key]: null } });
      fn();
    }
  },

  /* ── UI actions ── */
  setSelectedTab: (tab) => set({ selectedTab: tab }),
  setSelectedPlatform: (platform) => {
    set({ selectedPlatform: platform });
    // High 1: recompute affected algorithms when platform filter changes
    const { computeBestTimeSlots, computeHotWords, computeFunnel, videoMetrics } = get();
    computeBestTimeSlots();
    computeHotWords();
    const firstMatching = videoMetrics.find((v) =>
      platform === 'all' || v.platform === platform,
    );
    if (firstMatching) computeFunnel(firstMatching.id);
  },
  setSelectedCompetitor: (id) => set({ selectedCompetitor: id }),
  setDateRange: (range) => set({ dateRange: range }),
}));
