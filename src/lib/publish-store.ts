import { create } from 'zustand';

/* ── types ── */

export type PlatformState = 'connected' | 'expiring' | 'disconnected';

export interface Platform {
  id: string;
  name: string;
  icon: string;
  state: PlatformState;
  hint?: string;
}

export type PublishStatus =
  | 'scheduled'
  | 'pending'
  | 'publishing'
  | 'success'
  | 'failed'
  | 'needs-action';

export interface QueueItem {
  id: string;
  title: string;
  platform: string;
  status: PublishStatus;
  statusLabel: string;
  scheduledTime?: string;
  progress?: number;
  failReason?: string;
  cta?: string;
  completedAgo?: string;
  /** D4 audit: ISO timestamp of creation */
  createdAt: string;
  /** D4 audit: ISO timestamp of last update */
  updatedAt: string;
  /** D4 audit: reason for current status */
  statusReason?: string;
}

export type FilterKey = 'all' | 'pending' | 'published' | 'action';

export interface PublishState {
  platforms: Platform[];
  queue: QueueItem[];
  activeFilter: FilterKey;
  /** Global error state — drives ErrorBanner visibility */
  error: string | null;
  /** Conflict state — drives ConflictModal visibility */
  conflict: { existingId: string; newId: string; pendingItem: QueueItem } | null;

  /* Platform actions */
  connectPlatform: (id: string) => void;
  disconnectPlatform: (id: string) => void;
  reconnectPlatform: (id: string) => void;

  /* Queue actions */
  setFilter: (filter: FilterKey) => void;
  createSchedule: (item: Omit<QueueItem, 'createdAt' | 'updatedAt' | 'statusReason'>) => void;
  reauthorizeItem: (id: string) => void;
  retryItem: (id: string) => void;
  dismissError: () => void;
  dismissConflict: () => void;
  overrideConflict: () => void;

  /* D3 input validation */
  validateTitle: (title: string) => { valid: boolean; error?: string };
}

/* ── helpers ── */

const now = () => new Date().toISOString();

const initialPlatforms: Platform[] = [
  { id: 'bilibili', name: 'B站', icon: '📺', state: 'connected' },
  { id: 'youtube', name: 'YouTube', icon: '▶️', state: 'connected' },
  {
    id: 'douyin',
    name: '抖音',
    icon: '🎵',
    state: 'expiring',
    hint: 'Token 2h 后过期',
  },
  { id: 'twitch', name: 'Twitch', icon: '📡', state: 'disconnected' },
];

const initialQueue: QueueItem[] = [
  {
    id: '1',
    title: '原神 4.5 深渊攻略',
    platform: 'B站 18:00 + YouTube 20:00',
    status: 'scheduled',
    statusLabel: '已排程',
    scheduledTime: '今天 18:00',
    createdAt: '2026-04-28T10:00:00Z',
    updatedAt: '2026-04-28T10:00:00Z',
    statusReason: '用户排程',
  },
  {
    id: '2',
    title: '鸣潮天梯榜',
    platform: 'B站',
    status: 'pending',
    statusLabel: '待完善',
    failReason: '封面待确认',
    createdAt: '2026-04-28T11:00:00Z',
    updatedAt: '2026-04-28T14:00:00Z',
    statusReason: '封面缺失，等待用户上传',
  },
  {
    id: '3',
    title: '绝区零 Day 1',
    platform: 'YouTube',
    status: 'needs-action',
    statusLabel: '需人工处理',
    failReason: 'OAuth 过期',
    cta: '重新授权',
    createdAt: '2026-04-27T09:00:00Z',
    updatedAt: '2026-04-29T08:00:00Z',
    statusReason: 'YouTube OAuth token expired',
  },
  {
    id: '4',
    title: '绝区零 B站 首发',
    platform: 'B站',
    status: 'publishing',
    statusLabel: '发布中...',
    progress: 67,
    createdAt: '2026-04-29T06:00:00Z',
    updatedAt: '2026-04-29T16:30:00Z',
    statusReason: 'Upload in progress',
  },
  {
    id: '5',
    title: '原神 4.6 新角色前瞻',
    platform: 'YouTube + B站',
    status: 'success',
    statusLabel: '已发布',
    completedAgo: '2 天前',
    createdAt: '2026-04-26T12:00:00Z',
    updatedAt: '2026-04-27T18:00:00Z',
    statusReason: 'Published successfully',
  },
];

/* ── store ── */

export const usePublishStore = create<PublishState>((set, get) => ({
  platforms: initialPlatforms,
  queue: initialQueue,
  activeFilter: 'all',
  error: null,
  conflict: null,

  /* ── Platform actions ── */

  connectPlatform: (id) =>
    set((s) => ({
      platforms: s.platforms.map((p) =>
        p.id === id ? { ...p, state: 'connected' as const, hint: undefined } : p,
      ),
    })),

  disconnectPlatform: (id) =>
    set((s) => ({
      platforms: s.platforms.map((p) =>
        p.id === id ? { ...p, state: 'disconnected' as const, hint: undefined } : p,
      ),
      // When a platform is disconnected, mark related queued items as needs-action
      queue: s.queue.map((q) =>
        q.platform.includes(get().platforms.find((p) => p.id === id)?.name ?? '') &&
        q.status === 'scheduled'
          ? {
              ...q,
              status: 'needs-action' as const,
              statusLabel: '需人工处理',
              failReason: '平台已断开连接',
              cta: '重新连接',
              updatedAt: now(),
              statusReason: `Platform ${id} disconnected by user`,
            }
          : q,
      ),
    })),

  reconnectPlatform: (id) => {
    // Simulate: reconnect triggers OAuth flow, sets to expiring (pending token refresh)
    set((s) => ({
      platforms: s.platforms.map((p) =>
        p.id === id
          ? { ...p, state: 'expiring' as const, hint: 'Token 刷新中...' }
          : p,
      ),
    }));
    // Simulate async token refresh (2s)
    setTimeout(() => {
      set((s) => ({
        platforms: s.platforms.map((p) =>
          p.id === id ? { ...p, state: 'connected' as const, hint: undefined } : p,
        ),
        // Restore related needs-action items to scheduled
        queue: s.queue.map((q) =>
          q.statusReason?.includes(`Platform ${id}`) && q.status === 'needs-action'
            ? {
                ...q,
                status: 'scheduled' as const,
                statusLabel: '已排程',
                failReason: undefined,
                cta: undefined,
                updatedAt: now(),
                statusReason: `Reauthorized via ${id} OAuth`,
              }
            : q,
        ),
      }));
    }, 2000);
  },

  /* ── Queue actions ── */

  setFilter: (filter) => set({ activeFilter: filter }),

  createSchedule: (item) => {
    const ts = now();
    const newItem: QueueItem = { ...item, createdAt: ts, updatedAt: ts, statusReason: 'User scheduled' };

    // B4 conflict detection: check if an existing scheduled item shares the same platform AND time
    const conflict = get().queue.find(
      (q) =>
        q.id !== newItem.id &&
        q.status === 'scheduled' &&
        q.platform === newItem.platform &&
        q.scheduledTime === newItem.scheduledTime,
    );

    if (conflict) {
      // Set conflict state — ConflictModal will appear
      set({ conflict: { existingId: conflict.id, newId: newItem.id, pendingItem: newItem } });
      return;
    }

    // No conflict — add to queue
    set((s) => ({ queue: [...s.queue, newItem] }));
  },

  reauthorizeItem: (id) => {
    const item = get().queue.find((q) => q.id === id);
    if (!item) return;

    // B2: simulate rate-limit — if too many reauth attempts
    const recentReauths = get().queue.filter(
      (q) => q.statusReason?.includes('Reauth attempt') && q.id !== id,
    );
    if (recentReauths.length >= 3) {
      set({
        error: '重新授权频率过高，请 60 秒后重试（B2 限流保护）',
      });
      return;
    }

    // Simulate: mark as publishing, then transition
    set((s) => ({
      queue: s.queue.map((q) =>
        q.id === id
          ? {
              ...q,
              status: 'publishing' as const,
              statusLabel: '授权中...',
              progress: 0,
              failReason: undefined,
              cta: undefined,
              updatedAt: now(),
              statusReason: `Reauth attempt started`,
            }
          : q,
      ),
    }));

    // Simulate progress + success
    setTimeout(() => {
      set((s) => ({
        queue: s.queue.map((q) =>
          q.id === id ? { ...q, progress: 50 } : q,
        ),
      }));
    }, 1000);

    setTimeout(() => {
      set((s) => ({
        queue: s.queue.map((q) =>
          q.id === id
            ? {
                ...q,
                status: 'scheduled' as const,
                statusLabel: '已排程',
                progress: undefined,
                updatedAt: now(),
                statusReason: 'Reauthorized successfully, re-queued',
              }
            : q,
        ),
      }));
    }, 2500);
  },

  retryItem: (id) => {
    // B3 idempotency: check if already publishing
    const item = get().queue.find((q) => q.id === id);
    if (!item || item.status === 'publishing') return;

    set((s) => ({
      queue: s.queue.map((q) =>
        q.id === id
          ? {
              ...q,
              status: 'publishing' as const,
              statusLabel: '重试中...',
              progress: 0,
              updatedAt: now(),
              statusReason: 'Manual retry triggered',
            }
          : q,
      ),
    }));

    setTimeout(() => {
      set((s) => ({
        queue: s.queue.map((q) =>
          q.id === id
            ? {
                ...q,
                status: 'success' as const,
                statusLabel: '已发布',
                progress: undefined,
                completedAgo: '刚刚',
                updatedAt: now(),
                statusReason: 'Retry succeeded',
              }
            : q,
        ),
      }));
    }, 3000);
  },

  dismissError: () => set({ error: null }),

  dismissConflict: () => set({ conflict: null }),

  overrideConflict: () => {
    const conflict = get().conflict;
    if (!conflict) return;
    // Remove the existing item and add the pending one
    set((s) => ({
      conflict: null,
      queue: [
        ...s.queue.filter((q) => q.id !== conflict.existingId),
        conflict.pendingItem,
      ],
    }));
  },

  /* ── D3 Input validation ── */

  validateTitle: (title) => {
    if (!title || title.trim().length === 0) {
      return { valid: false, error: '标题不能为空' };
    }
    if (title.length > 100) {
      return { valid: false, error: '标题不能超过 100 字' };
    }
    if (/<script|javascript:|on\w+=/i.test(title)) {
      return { valid: false, error: '标题包含非法字符' };
    }
    return { valid: true };
  },
}));
