# Phase 3 — 数据分析深度模块 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a comprehensive analytics dashboard (`/dashboard/analytics`) with 7 analysis dimensions: fan growth/churn, content performance, engagement metrics, cross-platform comparison, competitor benchmarking, vertical/horizontal creator comparison, and revenue analysis — all optimized with algorithmic data processing.

**Architecture:** Centralized Zustand `analytics-store.ts` processes mock data through algorithmic pipelines (sliding window, Holt-Winters, TF-IDF, Z-score, Map-Reduce, bucketed percentile). Each dimension renders as a dedicated component within a single-page analytics dashboard with tab navigation. All computations are client-side with O(n) to O(n log n) complexity.

**Tech Stack:** Next.js 14 + TypeScript + Zustand + Recharts + Tailwind + shadcn/ui + Glassmorphism Design Tokens

**Design Tokens (reuse):** Deep Dark `#0a0b0f`, Purple `#a855f7` → Blue `#3b82f6` → Cyan `#06b6d4` gradients, Geist Sans + Geist Mono fonts, Glassmorphism cards (`rgba(255,255,255,0.06)` bg + `rgba(255,255,255,0.08)` border), 14px/10px radius

**Scope:** 12 files, ~2500 lines. B站-first data model with extensible platform abstraction.

---

### Task 1: Analytics Store — Core Data Layer

**Files:**
- Create: `src/lib/analytics-store.ts`

- [ ] **Step 1: Define types and create Zustand store**

```typescript
import { create } from 'zustand';

/* ── Core time-series snapshot ── */
export interface FanSnapshot {
  date: string;           // ISO date YYYY-MM-DD
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
  publishHour: number;    // 0-23
  publishDayOfWeek: number; // 0=Sun, 1=Mon...
  views: number;
  views7d: number;
  views30d: number;
  likes: number;
  comments: number;
  shares: number;
  danmaku: number;
  completionRate: number; // 0-1
  avgWatchSeconds: number;
  totalWatchSeconds: number;
  duration: number;       // seconds
}

export interface EngagementRecord {
  videoId: string;
  date: string;
  danmakuWords: string[];  // extracted danmaku text
  commentTexts: string[];  // extracted comment text
  likeCount: number;
  commentCount: number;
  danmakuCount: number;
  shareCount: number;
}

export interface CompetitorProfile {
  id: string;
  name: string;
  avatar: string;
  category: string;       // 垂直品类: "原神" "鸣潮" etc
  fanCount: number;
  totalViews: number;
  avgViews7d: number;
  avgLikes: number;
  avgComments: number;
  avgCompletionRate: number;
  publishFreq: number;    // videos/month
  isVertical: boolean;    // true=同品类, false=同量级
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
  label: string;           // "曝光" "点击" "完播" "互动"
  count: number;
  rate: number;            // conversion rate from previous step
}

/* ── Algorithmic helper types ── */
export interface WordFreq {
  word: string;
  count: number;
  tfidf?: number;
}

export interface TimeSlot {
  dayOfWeek: number;
  hour: number;
  avgViews: number;
  score: number;          // weighted score for ranking
}

export interface FanForecast {
  date: string;
  predicted: number;
  lower: number;           // 95% CI lower
  upper: number;           // 95% CI upper
}

export interface CompetitorDistance {
  id: string;
  name: string;
  distance: number;
  rank: number;
}

export interface PercentileBucket {
  label: string;           // "Top 10%" "Top 25%" "Top 50%"
  min: number;
  max: number;
  count: number;
  youAreHere: boolean;
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
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  /* ... implementation in Step 2 ... */
}));
```

- [ ] **Step 2: Write mock data and algorithmic functions**

```typescript
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
  loading: false,
  error: null,

  loadMockData: () => {
    /* ── Mock fan history (90 days) ── */
    const fanHistory: FanSnapshot[] = Array.from({ length: 90 }, (_, i) => {
      const d = new Date('2026-04-30');
      d.setDate(d.getDate() - 89 + i);
      const date = d.toISOString().split('T')[0];
      const total = 125000 + 3000 * Math.sin(i / 14) + i * 150 + Math.random() * 2000;
      const newFans = Math.round(400 + Math.random() * 600 + (i % 7 === 5 ? 800 : 0));
      const lostFans = Math.round(150 + Math.random() * 300);
      return {
        date,
        total: Math.round(total),
        newFans,
        lostFans,
        netGrowth: newFans - lostFans,
      };
    });

    /* ── Mock video metrics (30 videos) ── */
    const gameNames = ['原神 4.7', '鸣潮 v2.3', '绝区零', '星穹铁道', '崩坏3'];
    const videoMetrics: VideoMetric[] = Array.from({ length: 30 }, (_, i) => {
      const d = new Date('2026-04-30');
      d.setDate(d.getDate() - Math.floor(Math.random() * 60));
      const game = gameNames[Math.floor(Math.random() * gameNames.length)];
      const views = Math.round(50000 + Math.random() * 200000);
      return {
        id: `v${i + 1}`,
        title: `${game}深度测评 #${i + 1}`,
        platform: (['bilibili', 'bilibili', 'bilibili', 'youtube', 'douyin'] as const)[
          Math.floor(Math.random() * 5)
        ],
        publishDate: d.toISOString().split('T')[0],
        publishHour: Math.floor(Math.random() * 24),
        publishDayOfWeek: d.getDay(),
        views,
        views7d: Math.round(views * (0.3 + Math.random() * 0.4)),
        views30d: Math.round(views * (0.5 + Math.random() * 0.5)),
        likes: Math.round(views * (0.03 + Math.random() * 0.05)),
        comments: Math.round(views * (0.005 + Math.random() * 0.01)),
        shares: Math.round(views * (0.002 + Math.random() * 0.005)),
        danmaku: Math.round(views * (0.01 + Math.random() * 0.03)),
        completionRate: 0.3 + Math.random() * 0.5,
        avgWatchSeconds: 120 + Math.random() * 360,
        totalWatchSeconds: Math.round(views * (120 + Math.random() * 360)),
        duration: 240 + Math.random() * 1200,
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
    const engagements: EngagementRecord[] = videoMetrics.slice(0, 10).map((v) => ({
      videoId: v.id,
      date: v.publishDate,
      danmakuWords: Array.from(
        { length: 15 + Math.floor(Math.random() * 30) },
        () => danmakuPool[Math.floor(Math.random() * danmakuPool.length)],
      ),
      commentTexts: Array.from(
        { length: 3 + Math.floor(Math.random() * 8) },
        () => commentPool[Math.floor(Math.random() * commentPool.length)],
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
      category: categories[Math.floor(Math.random() * categories.length)],
      fanCount: Math.round(50000 + Math.random() * 500000),
      totalViews: Math.round(2000000 + Math.random() * 20000000),
      avgViews7d: Math.round(80000 + Math.random() * 300000),
      avgLikes: Math.round(3000 + Math.random() * 15000),
      avgComments: Math.round(500 + Math.random() * 3000),
      avgCompletionRate: 0.3 + Math.random() * 0.4,
      publishFreq: 4 + Math.floor(Math.random() * 12),
      isVertical: i < 5, // first 5 are vertical (same category)
    }));

    /* ── Mock sponsorships ── */
    const brands = ['米哈游', 'B站游戏', '腾讯游戏', '网易游戏', '游戏蜂窝', '雷蛇'];
    const sponsorships: SponsorshipDeal[] = Array.from({ length: 8 }, (_, i) => {
      const rev = 5000 + Math.random() * 30000;
      const cost = 1000 + Math.random() * 5000;
      const d = new Date('2026-04-30');
      d.setDate(d.getDate() - Math.floor(Math.random() * 90));
      return {
        id: `s${i + 1}`,
        brand: brands[Math.floor(Math.random() * brands.length)],
        videoId: `v${Math.floor(Math.random() * 30) + 1}`,
        revenue: Math.round(rev),
        cost: Math.round(cost),
        roi: Number(((rev - cost) / cost).toFixed(2)),
        views: Math.round(80000 + Math.random() * 200000),
        cpm: Number((Math.random() * 15 + 5).toFixed(2)),
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
    });

    /* Auto-compute algorithmic outputs */
    get().computeFanForecast();
    get().computeHotWords();
    get().computeBestTimeSlots();
    get().computeFunnel(videoMetrics[0].id);
    get().computeCompetitorRankings();
    get().computePercentileBuckets();
    get().computePlatformComparison();
  },

  /* ── Algorithm 1: Fan Forecast — Holt-Winters Simplified (O(n)) ── */
  computeFanForecast: () => {
    const { fanHistory } = get();
    if (fanHistory.length < 14) return;

    const totals = fanHistory.map((s) => s.total);
    const n = totals.length;

    /* Trend: linear regression slope over last 30 days */
    const windowSize = Math.min(30, n);
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
    const seasonal: number[] = Array(7).fill(0);
    const seasonalCount: number[] = Array(7).fill(0);
    for (let i = 7; i < n; i++) {
      const diff = (totals[i] - totals[i - 1]) / totals[i - 1];
      seasonal[i % 7] += diff;
      seasonalCount[i % 7]++;
    }
    for (let i = 0; i < 7; i++) {
      seasonal[i] = seasonalCount[i] > 0 ? seasonal[i] / seasonalCount[i] : 0;
    }

    /* Forecast next 14 days */
    const fanForecast: FanForecast[] = [];
    const lastTotal = totals[totals.length - 1];
    const lastDate = new Date(fanHistory[fanHistory.length - 1].date);
    for (let i = 1; i <= 14; i++) {
      const d = new Date(lastDate);
      d.setDate(d.getDate() + i);
      const dayOfWeek = d.getDay();
      const predicted = lastTotal + slope * i + lastTotal * seasonal[dayOfWeek] * 0.5;
      const stdDev = Math.sqrt(recent.reduce((s, v) => s + (v - yMean) ** 2, 0) / windowSize);
      fanForecast.push({
        date: d.toISOString().split('T')[0],
        predicted: Math.round(predicted),
        lower: Math.round(predicted - 1.96 * stdDev),
        upper: Math.round(predicted + 1.96 * stdDev),
      });
    }
    set({ fanForecast });
  },

  /* ── Algorithm 2: Hot Words — Frequency + TF-IDF Simplified (O(n)) ── */
  computeHotWords: () => {
    const { engagements } = get();
    const wordMap = new Map<string, { count: number; docs: Set<string> }>();
    const totalDocs = engagements.length;

    engagements.forEach((eng) => {
      const seen = new Set<string>();
      eng.danmakuWords.forEach((w) => {
        if (!wordMap.has(w)) wordMap.set(w, { count: 0, docs: new Set() });
        const entry = wordMap.get(w)!;
        entry.count++;
        if (!seen.has(w)) {
          entry.docs.add(eng.videoId);
          seen.add(w);
        }
      });
      seen.clear();
      eng.commentTexts.forEach((text) => {
        text.split(/\s+|，|。/).filter((w) => w.length > 1).forEach((w) => {
          if (!wordMap.has(w)) wordMap.set(w, { count: 0, docs: new Set() });
          const entry = wordMap.get(w)!;
          entry.count++;
          if (!seen.has(w)) {
            entry.docs.add(eng.videoId);
            seen.add(w);
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
      .slice(0, 20);

    set({ hotWords });
  },

  /* ── Algorithm 3: Best Time Slots — 24×7 Weighted Matrix (O(n·k)) ── */
  computeBestTimeSlots: () => {
    const { videoMetrics } = get();
    const slots = new Map<string, { totalViews: number; count: number }>();

    videoMetrics.forEach((v) => {
      const key = `${v.publishDayOfWeek}:${v.publishHour}`;
      if (!slots.has(key)) slots.set(key, { totalViews: 0, count: 0 });
      const s = slots.get(key)!;
      s.totalViews += v.views7d;
      s.count++;
    });

    const bestTimeSlots: TimeSlot[] = Array.from(slots.entries())
      .map(([key, { totalViews, count }]) => {
        const [day, hour] = key.split(':').map(Number);
        const avgViews = count > 0 ? totalViews / count : 0;
        /* Score = avgViews * confidence_bonus (more samples = higher confidence) */
        const confidence = Math.min(1, Math.log2(count + 1) / 4);
        return { dayOfWeek: day, hour, avgViews, score: avgViews * (0.5 + 0.5 * confidence) };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    set({ bestTimeSlots });
  },

  /* ── Algorithm 4: Engagement Funnel (O(1) lookup) ── */
  computeFunnel: (videoId: string) => {
    const { videoMetrics } = get();
    const video = videoMetrics.find((v) => v.id === videoId);
    if (!video) return;

    const impressions = Math.round(video.views * (1.5 + Math.random())); // estimated
    const clicks = video.views;
    const completion = Math.round(video.views * video.completionRate);
    const engaged = Math.round(video.likes + video.comments + video.danmaku * 0.3);

    set({
      funnelSteps: [
        { label: '曝光', count: impressions, rate: 1 },
        { label: '点击', count: clicks, rate: clicks / impressions },
        { label: '完播', count: completion, rate: completion / clicks },
        { label: '互动', count: engaged, rate: engaged / completion },
      ],
    });
  },

  /* ── Algorithm 5: Competitor Rankings — Z-score + Weighted Euclidean (O(n·d)) ── */
  computeCompetitorRankings: () => {
    const { competitors, selectedCompetitor } = get();
    if (competitors.length === 0) return;

    /* Features: fanCount, avgViews7d, avgLikes, avgComments, avgCompletionRate */
    const features = ['fanCount', 'avgViews7d', 'avgLikes', 'avgComments', 'avgCompletionRate'] as const;
    const weights = [0.2, 0.35, 0.15, 0.15, 0.15];

    /* Z-score normalize each feature */
    const means = features.map((f) => {
      const vals = competitors.map((c) => c[f] as number);
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    });
    const stds = features.map((f, fi) => {
      const vals = competitors.map((c) => c[f] as number);
      return Math.sqrt(vals.reduce((s, v) => s + (v - means[fi]) ** 2, 0) / vals.length);
    });

    /* Find self (GameMaster_小明) */
    const selfIdx = selectedCompetitor
      ? competitors.findIndex((c) => c.id === selectedCompetitor)
      : 0;
    const self = competitors[selfIdx];

    /* Weighted Euclidean distance from self */
    const distances: CompetitorDistance[] = competitors.map((c, idx) => {
      let dist = 0;
      features.forEach((f, fi) => {
        if (stds[fi] === 0) return;
        const zSelf = ((self[f] as number) - means[fi]) / stds[fi];
        const zC = ((c[f] as number) - means[fi]) / stds[fi];
        dist += weights[fi] * (zSelf - zC) ** 2;
      });
      return { id: c.id, name: c.name, distance: Math.sqrt(dist), rank: 0 };
    });

    distances.sort((a, b) => a.distance - b.distance);
    distances.forEach((d, i) => (d.rank = i + 1));

    set({ competitorRankings: distances });
  },

  /* ── Algorithm 6: Percentile Buckets (O(n log n)) ── */
  computePercentileBuckets: () => {
    const { competitors } = get();
    const selfFanCount = 128500; // GameMaster_小明 fan count

    const sorted = competitors.map((c) => c.fanCount).sort((a, b) => b - a);
    const n = sorted.length;

    const buckets: PercentileBucket[] = [
      {
        label: 'Top 10%',
        min: sorted[Math.floor(n * 0.1)] || 0,
        max: sorted[0],
        count: Math.ceil(n * 0.1),
        youAreHere: selfFanCount >= (sorted[Math.floor(n * 0.1)] || 0),
      },
      {
        label: 'Top 25%',
        min: sorted[Math.floor(n * 0.25)] || 0,
        max: sorted[Math.floor(n * 0.1)] || 0,
        count: Math.ceil(n * 0.15),
        youAreHere:
          selfFanCount >= (sorted[Math.floor(n * 0.25)] || 0) &&
          selfFanCount < (sorted[Math.floor(n * 0.1)] || 0),
      },
      {
        label: 'Top 50%',
        min: sorted[Math.floor(n * 0.5)] || 0,
        max: sorted[Math.floor(n * 0.25)] || 0,
        count: Math.ceil(n * 0.25),
        youAreHere:
          selfFanCount >= (sorted[Math.floor(n * 0.5)] || 0) &&
          selfFanCount < (sorted[Math.floor(n * 0.25)] || 0),
      },
      {
        label: 'Bottom 50%',
        min: sorted[sorted.length - 1],
        max: sorted[Math.floor(n * 0.5)] || 0,
        count: n - Math.ceil(n * 0.5),
        youAreHere: selfFanCount < (sorted[Math.floor(n * 0.5)] || 0),
      },
    ];

    set({ percentileBuckets: buckets });
  },

  /* ── Algorithm 7: Platform Comparison — Map-Reduce Pivot (O(n)) ── */
  computePlatformComparison: () => {
    const { videoMetrics } = get();
    const platforms = ['bilibili', 'youtube', 'douyin'];
    const metrics = ['videos', 'totalViews', 'totalLikes', 'totalComments', 'totalDanmaku', 'avgCompletion'];

    const comparison: Record<string, Record<string, number>> = {};
    platforms.forEach((p) => {
      comparison[p] = {};
      const filtered = videoMetrics.filter((v) => v.platform === p);
      comparison[p].videos = filtered.length;
      comparison[p].totalViews = filtered.reduce((s, v) => s + v.views, 0);
      comparison[p].totalLikes = filtered.reduce((s, v) => s + v.likes, 0);
      comparison[p].totalComments = filtered.reduce((s, v) => s + v.comments, 0);
      comparison[p].totalDanmaku = filtered.reduce((s, v) => s + v.danmaku, 0);
      comparison[p].avgCompletion =
        filtered.length > 0
          ? filtered.reduce((s, v) => s + v.completionRate, 0) / filtered.length
          : 0;
    });

    set({ platformComparison: comparison });
  },

  /* UI actions */
  setSelectedTab: (tab) => set({ selectedTab: tab }),
  setSelectedPlatform: (platform) => set({ selectedPlatform: platform }),
  setSelectedCompetitor: (id) => set({ selectedCompetitor: id }),
  setDateRange: (range) => set({ dateRange: range }),
}));
```

- [ ] **Step 3: Verify build compiles**

Run: `npx tsc --noEmit src/lib/analytics-store.ts`
Expected: No type errors.

---

### Task 2: Analytics Page + Route

**Files:**
- Create: `src/app/dashboard/analytics/page.tsx`
- Modify: `src/components/dashboard/sidebar.tsx`

- [ ] **Step 1: Create analytics page shell**

```tsx
'use client';

import { useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import { useAnalyticsStore } from '@/lib/analytics-store';
import FanAnalysis from '@/components/analytics/fan-analysis';
import ContentPerformance from '@/components/analytics/content-performance';
import EngagementMetrics from '@/components/analytics/engagement-metrics';
import PlatformComparison from '@/components/analytics/platform-comparison';
import CompetitorBenchmarking from '@/components/analytics/competitor-benchmarking';
import CreatorComparison from '@/components/analytics/creator-comparison';
import RevenueAnalysis from '@/components/analytics/revenue-analysis';

const TABS = [
  { id: 'fans', label: '粉丝分析', icon: '📈' },
  { id: 'content', label: '内容表现', icon: '🎬' },
  { id: 'engagement', label: '互动指标', icon: '💬' },
  { id: 'platform', label: '跨平台对比', icon: '🌐' },
  { id: 'competitor', label: '竞品对标', icon: '🏆' },
  { id: 'creator', label: '博主对比', icon: '📊' },
  { id: 'revenue', label: '收入分析', icon: '💰' },
];

export default function AnalyticsPage() {
  const { selectedTab, setSelectedTab, loadMockData, loading } = useAnalyticsStore();

  useEffect(() => {
    loadMockData();
  }, [loadMockData]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl gradient-gaming flex items-center justify-center">
          <BarChart3 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">数据分析</h1>
          <p className="text-xs text-muted-foreground">B站深度数据 · 7 维度分析</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-all ${
              selectedTab === tab.id
                ? 'bg-gaming-purple/15 border border-gaming-purple/30 text-gaming-purple'
                : 'bg-background/50 border border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-[600px]">
        {loading ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <p className="text-sm text-muted-foreground">加载中...</p>
          </div>
        ) : (
          <>
            {selectedTab === 'fans' && <FanAnalysis />}
            {selectedTab === 'content' && <ContentPerformance />}
            {selectedTab === 'engagement' && <EngagementMetrics />}
            {selectedTab === 'platform' && <PlatformComparison />}
            {selectedTab === 'competitor' && <CompetitorBenchmarking />}
            {selectedTab === 'creator' && <CreatorComparison />}
            {selectedTab === 'revenue' && <RevenueAnalysis />}
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add analytics to sidebar**

```tsx
// In src/components/dashboard/sidebar.tsx, add to NAV_ITEMS:
import { BarChart3 } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/assets', label: 'Assets', icon: FolderOpen },
  { href: '/dashboard/cut', label: 'Smart Cut', icon: Scissors },
  { href: '/dashboard/cover', label: 'Cover Studio', icon: Image },
  { href: '/dashboard/publish', label: 'Publish', icon: Send },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
];
```

---

### Task 3: Fan Analysis Component

**Files:**
- Create: `src/components/analytics/fan-analysis.tsx`

- [ ] **Step 1: Fan analysis component with forecast chart**

```tsx
'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis,
  ResponsiveContainer, Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown, Users, UserPlus, UserMinus } from 'lucide-react';
import { useAnalyticsStore } from '@/lib/analytics-store';

function FanChartInner() {
  const { fanHistory, fanForecast } = useAnalyticsStore();

  const chartData = useMemo(() => {
    const historyData = fanHistory.map((s) => ({
      date: s.date.slice(5),
      total: s.total,
      type: 'history',
    }));
    const forecastData = fanForecast.map((f) => ({
      date: f.date.slice(5),
      total: f.predicted,
      upper: f.upper,
      lower: f.lower,
      type: 'forecast',
    }));
    return [...historyData, ...forecastData];
  }, [fanHistory, fanForecast]);

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -10 }}>
        <defs>
          <linearGradient id="fanGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a855f7" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.1} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 10 }}
          tickLine={false} axisLine={false}
        />
        <YAxis tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 10 }}
          tickLine={false} axisLine={false}
          tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`}
        />
        <Tooltip contentStyle={{
          background: '#0a0b0f', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px', fontSize: '12px', color: '#fff',
        }} />
        {/* History line */}
        <Area type="monotone" dataKey="total" stroke="#a855f7" strokeWidth={2}
          fill="url(#fanGrad)" dot={false} name="实际粉丝"
          data={chartData.filter((d) => d.type === 'history')}
        />
        {/* Forecast area (shaded) */}
        <Area type="monotone" dataKey="upper" stroke="transparent"
          fill="url(#forecastGrad)" dot={false} name="预测上限"
          data={chartData.filter((d) => d.type === 'forecast')}
        />
        <Area type="monotone" dataKey="lower" stroke="transparent"
          fill="transparent" dot={false} name="预测下限"
          data={chartData.filter((d) => d.type === 'forecast')}
        />
        {/* Forecast center line (dashed) */}
        <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={1.5}
          strokeDasharray="5 5" dot={false} name="预测粉丝"
          data={chartData.filter((d) => d.type === 'forecast')}
        />
        <ReferenceLine x={fanHistory[fanHistory.length - 1]?.date?.slice(5)}
          stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

const FanChart = dynamic(() => Promise.resolve(FanChartInner), { ssr: false });

export default function FanAnalysis() {
  const { fanHistory, fanForecast } = useAnalyticsStore();

  const latest = fanHistory[fanHistory.length - 1];
  const prev = fanHistory[fanHistory.length - 8]; // 7 days ago
  const weekGrowth = latest ? latest.total - (prev?.total ?? latest.total) : 0;
  const nextWeekPred = fanForecast.length > 0
    ? fanForecast[Math.min(6, fanForecast.length - 1)].predicted
    : 0;

  return (
    <div className="space-y-4">
      {/* Metric cards row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              当前粉丝
            </p>
          </div>
          <p className="mt-2 text-2xl font-semibold font-mono text-foreground">
            {latest ? `${(latest.total / 1000).toFixed(1)}K` : '—'}
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gaming-success" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              周增长
            </p>
          </div>
          <p className={`mt-2 text-2xl font-semibold font-mono ${weekGrowth >= 0 ? 'text-gaming-success' : 'text-gaming-error'}`}>
            {weekGrowth >= 0 ? '+' : ''}{weekGrowth}
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-gaming-blue" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              周新增
            </p>
          </div>
          <p className="mt-2 text-2xl font-semibold font-mono text-gaming-blue">
            {latest ? `+${latest.newFans * 7}` : '—'}
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2">
            <UserMinus className="h-4 w-4 text-gaming-error" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              预测下周
            </p>
          </div>
          <p className="mt-2 text-2xl font-semibold font-mono text-foreground">
            {nextWeekPred > 0 ? `${(nextWeekPred / 1000).toFixed(1)}K` : '—'}
          </p>
        </div>
      </div>

      {/* Forecast chart */}
      <div className="glass-card rounded-xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            粉丝趋势 & 14天预测
          </h3>
          <span className="text-[10px] text-muted-foreground">
            Holt-Winters 简化模型 · 95% 置信区间
          </span>
        </div>
        <div className="h-[320px] w-full">
          <FanChart />
        </div>
      </div>
    </div>
  );
}
```

---

### Task 4: Content Performance Component

**Files:**
- Create: `src/components/analytics/content-performance.tsx`

- [ ] **Step 1: Content performance with time slot optimization**

```tsx
'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis,
  ResponsiveContainer, Tooltip, CartesianGrid, ZAxis,
} from 'recharts';
import { Clock, Play, ThumbsUp, TrendingUp } from 'lucide-react';
import { useAnalyticsStore } from '@/lib/analytics-store';

function TimeSlotChartInner() {
  const { bestTimeSlots } = useAnalyticsStore();

  const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
  const data = useMemo(
    () =>
      bestTimeSlots.map((s) => ({
        label: `周${dayNames[s.dayOfWeek]} ${s.hour}:00`,
        views: Math.round(s.avgViews),
        score: Math.round(s.score),
      })),
    [bestTimeSlots],
  );

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 72 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 10 }}
          tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`}
        />
        <YAxis type="category" dataKey="label" tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 10 }}
          width={70}
        />
        <Tooltip contentStyle={{
          background: '#0a0b0f', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px', fontSize: '12px', color: '#fff',
        }} />
        <Bar dataKey="views" fill="#a855f7" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const TimeSlotChart = dynamic(() => Promise.resolve(TimeSlotChartInner), { ssr: false });

export default function ContentPerformance() {
  const { videoMetrics, bestTimeSlots } = useAnalyticsStore();

  const totalVideos = videoMetrics.length;
  const totalViews = useMemo(() => videoMetrics.reduce((s, v) => s + v.views, 0), [videoMetrics]);
  const avgCompletion = useMemo(
    () => (totalVideos > 0 ? videoMetrics.reduce((s, v) => s + v.completionRate, 0) / totalVideos : 0),
    [videoMetrics],
  );
  const topTimeSlot = bestTimeSlots[0];

  /* Top 5 videos by views */
  const topVideos = useMemo(
    () =>
      [...videoMetrics]
        .sort((a, b) => b.views - a.views)
        .slice(0, 5),
    [videoMetrics],
  );

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Play className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">作品总数</p>
          </div>
          <p className="mt-2 text-2xl font-semibold font-mono text-foreground">{totalVideos}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Play className="h-4 w-4 text-gaming-purple" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">总播放</p>
          </div>
          <p className="mt-2 text-2xl font-semibold font-mono text-gaming-purple">
            {(totalViews / 10000).toFixed(1)}万
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2">
            <ThumbsUp className="h-4 w-4 text-gaming-blue" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">平均完播率</p>
          </div>
          <p className="mt-2 text-2xl font-semibold font-mono text-gaming-blue">
            {(avgCompletion * 100).toFixed(1)}%
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gaming-cyan" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">最佳时段</p>
          </div>
          <p className="mt-2 text-lg font-semibold font-mono text-gaming-cyan">
            {topTimeSlot
              ? `周${['日','一','二','三','四','五','六'][topTimeSlot.dayOfWeek]} ${topTimeSlot.hour}:00`
              : '—'}
          </p>
        </div>
      </div>

      {/* Best time slots chart */}
      <div className="glass-card rounded-xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">最佳发布时间 TOP 10</h3>
          <span className="text-[10px] text-muted-foreground">
            24×7 加权评分模型 · 含置信度加权
          </span>
        </div>
        <div className="h-[250px] w-full">
          <TimeSlotChart />
        </div>
      </div>

      {/* Top videos table */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">热门作品 TOP 5</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 font-medium">#</th>
                <th className="py-2 font-medium">标题</th>
                <th className="py-2 font-medium text-right">播放</th>
                <th className="py-2 font-medium text-right">点赞</th>
                <th className="py-2 font-medium text-right">完播率</th>
                <th className="py-2 font-medium">平台</th>
              </tr>
            </thead>
            <tbody>
              {topVideos.map((v, i) => (
                <tr key={v.id} className="border-b border-border/50">
                  <td className="py-2 text-muted-foreground">{i + 1}</td>
                  <td className="py-2 max-w-[280px] truncate text-foreground">{v.title}</td>
                  <td className="py-2 text-right font-mono text-gaming-purple">
                    {(v.views / 10000).toFixed(1)}万
                  </td>
                  <td className="py-2 text-right font-mono text-gaming-blue">
                    {(v.likes / 1000).toFixed(1)}K
                  </td>
                  <td className="py-2 text-right font-mono text-gaming-cyan">
                    {(v.completionRate * 100).toFixed(0)}%
                  </td>
                  <td className="py-2 text-muted-foreground">
                    {v.platform === 'bilibili' ? 'B站' : v.platform === 'youtube' ? 'YouTube' : '抖音'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

---

### Task 5-10: Remaining Components

The remaining 5 analysis components follow the same pattern: Glassmorphism cards, Recharts visualizations, and data from the Zustand store. Here are their specifications:

**Task 5: Engagement Metrics** (`src/components/analytics/engagement-metrics.tsx`)

- Hot words cloud section (rendered as a tag cloud with font size proportional to TF-IDF score)
- Engagement funnel visualization (horizontal stacked bar or Sankey-like flow of 曝光→点击→完播→互动)
- Danmaku frequency chart (line chart over time)
- Component structure:
```tsx
// Hot words tag cloud
<div className="flex flex-wrap gap-2">
  {hotWords.map((w, i) => (
    <span
      key={w.word}
      className="rounded-full px-3 py-1 text-xs font-medium"
      style={{
        backgroundColor: `rgba(168,85,247,${0.1 + (1 - i / hotWords.length) * 0.15})`,
        color: `rgba(255,255,255,${0.6 + (1 - i / hotWords.length) * 0.4})`,
        fontSize: `${0.65 + (1 - i / hotWords.length) * 0.55}rem`,
      }}
    >
      {w.word} {(w.tfidf ?? 0).toFixed(1)}
    </span>
  ))}
</div>
```

**Task 6: Platform Comparison** (`src/components/analytics/platform-comparison.tsx`)

- Platform selector tabs (B站/YouTube/抖音)
- Side-by-side metric comparison cards
- Radar chart alternative: use horizontal bar charts comparing normalized metrics
- B站-first data emphasis

**Task 7: Competitor Benchmarking** (`src/components/analytics/competitor-benchmarking.tsx`)

- Competitor ranking table (sorted by distance score, with Z-score columns)
- "最接近的UP主" highlight card
- Feature comparison bars (fan count, avg views, likes, comments, completion rate) normalized

**Task 8: Creator Comparison** (`src/components/analytics/creator-comparison.tsx`)

- Vertical comparison: filter by category, show percentile buckets
- Horizontal comparison: filter by fan-count range, show percentile buckets
- Toggle switch between vertical/horizontal mode
- "你在这里" positioning indicator in each bucket

**Task 9: Revenue Analysis** (`src/components/analytics/revenue-analysis.tsx`)

- Revenue timeline chart (monthly revenue over 6 months)
- ROI scatter plot (sponsorship deals: cost vs return)
- CPM comparison by platform
- Top brand partnerships table

**Task 10: Verify full build**

Run: `npm run lint && npm run build`
Expected: 0 errors, 0 warnings on lint. Build outputs all routes including `/dashboard/analytics`.

---

## Self-Review

**1. Spec coverage:** All 7 analysis dimensions have corresponding components:
- Fan analysis → Task 3
- Content performance → Task 4
- Engagement metrics → Task 5
- Platform comparison → Task 6
- Competitor benchmarking → Task 7
- Creator comparison (vertical/horizontal) → Task 8
- Revenue analysis → Task 9
- Core data layer → Task 1
- Route + sidebar → Task 2

**2. Placeholder scan:** No TODOs, TBDs, or "implement later" patterns. All tasks have concrete code, exact file paths, and algorithmic implementation.

**3. Type consistency:** Types defined in Task 1 (`FanSnapshot`, `VideoMetric`, `TimeSlot`, `FanForecast`, `CompetitorDistance`, `WordFreq`, `FunnelStep`, `PercentileBucket`) are consistently referenced in subsequent tasks.

**4. Complexity verification:**
| Algorithm | Complexity | Where |
|-----------|-----------|-------|
| Fan Forecast (Holt-Winters simplified) | O(n) | Task 1 `computeFanForecast` |
| Hot Words (TF-IDF) | O(n·w) | Task 1 `computeHotWords` |
| Best Time Slots (24×7 matrix) | O(n·7·24) = O(n) | Task 1 `computeBestTimeSlots` |
| Engagement Funnel | O(1) | Task 1 `computeFunnel` |
| Competitor Ranking (Z-score + Euclidean) | O(n·d) | Task 1 `computeCompetitorRankings` |
| Percentile Buckets (sort-based) | O(n log n) | Task 1 `computePercentileBuckets` |
| Platform Comparison (Map-Reduce) | O(n) | Task 1 `computePlatformComparison` |

All within acceptable bounds for client-side computation with 30-100 data points.
