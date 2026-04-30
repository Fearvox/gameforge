import { create } from 'zustand';

/* ── types ── */

export type AssetType = 'video' | 'image' | 'audio' | 'unknown';
export type AssetStatus = 'ready' | 'uploading' | 'processing' | 'pending-review' | 'failed';
export type ViewMode = 'grid' | 'list';

export interface AssetTag {
  id: string;
  name: string;
  color: string;
  count: number;
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  status: AssetStatus;
  size: number; // bytes
  /** ISO timestamp */
  uploadedAt: string;
  /** Upload progress 0-100, only for uploading */
  progress?: number;
  /** Duration in seconds, for video/audio */
  duration?: number;
  /** Resolution string, for video/image */
  resolution?: string;
  /** Thumbnail URL or placeholder */
  thumbnail?: string;
  /** Tags applied to this asset */
  tagIds: string[];
  /** Failure reason, for failed/pending-review */
  failReason?: string;
  /** D4 audit */
  createdAt: string;
  updatedAt: string;
  /** D4 audit: who created */
  createdBy?: string;
  /** D4 audit: reason for current status */
  statusReason?: string;
}

export type SortKey = 'newest' | 'oldest' | 'name' | 'size';

export interface UploadItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: AssetType;
  progress: number;
  status: 'waiting' | 'uploading' | 'done' | 'failed';
  error?: string;
}

export interface BatchResult {
  success: string[]; // asset IDs
  failed: { id: string; name: string; reason: string }[];
}

export interface ConflictInfo {
  assetId: string;
  assetName: string;
  reason: 'deleted' | 'moved' | 'modified';
}

export interface AuditEvent {
  operator: string;
  action: 'delete' | 'move' | 'tag-add' | 'tag-remove' | 'upload' | 'retry';
  targetIds: string[];
  result: 'success' | 'partial' | 'failed';
  detail?: string;
  timestamp: string;
}

export interface AssetsState {
  /* Data */
  assets: Asset[];
  tags: AssetTag[];
  auditLog: AuditEvent[];

  /* UI state */
  searchQuery: string;
  typeFilter: AssetType | 'all';
  tagFilter: string | null; // tag ID
  statusFilter: AssetStatus | 'all';
  viewMode: ViewMode;
  sortKey: SortKey;
  selectedIds: Set<string>;
  previewAssetId: string | null;
  page: number;
  pageSize: number;

  /* Upload state */
  uploads: UploadItem[];
  uploadOpen: boolean;

  /* Dialog state */
  confirmDialog: { type: 'delete' | 'move'; assetIds: string[] } | null;

  /* Error/conflict state */
  error: string | null;
  conflict: ConflictInfo | null;
  batchResult: BatchResult | null;

  /* Actions — filter/search */
  setSearchQuery: (q: string) => void;
  setTypeFilter: (t: AssetType | 'all') => void;
  setTagFilter: (tagId: string | null) => void;
  setStatusFilter: (s: AssetStatus | 'all') => void;
  setViewMode: (v: ViewMode) => void;
  setSortKey: (s: SortKey) => void;
  setPage: (p: number) => void;

  /* Actions — selection */
  toggleSelect: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;

  /* Actions — preview */
  setPreviewAsset: (id: string | null) => void;

  /* Actions — upload */
  openUpload: () => void;
  closeUpload: () => void;
  addUploadFiles: (files: File[]) => void;
  removeUpload: (id: string) => void;
  startUpload: () => void;

  /* Actions — tags */
  createTag: (name: string) => void;
  addTagToAssets: (tagId: string, assetIds: string[]) => void;
  removeTagFromAssets: (tagId: string, assetIds: string[]) => void;

  /* Actions — CRUD */
  deleteAssets: (ids: string[]) => void;
  moveAssets: (ids: string[], tagId: string) => void;
  retryAsset: (id: string) => void;

  /* Actions — batch */
  batchDelete: () => void;
  batchMove: (tagId: string) => void;

  /* Actions — dialogs/conflict */
  openConfirm: (type: 'delete' | 'move', assetIds: string[]) => void;
  closeConfirm: () => void;
  setError: (msg: string | null) => void;
  dismissError: () => void;
  dismissConflict: () => void;
  dismissBatchResult: () => void;
  simulateConflict: () => void;

  /* Derived */
  getFilteredAssets: () => Asset[];
  getTagCounts: () => Record<string, number>;
}

/* ── helpers ── */

const now = () => new Date().toISOString();

function guessType(name: string): AssetType {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return 'video';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
  if (['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(ext)) return 'audio';
  return 'unknown';
}

const TAG_COLORS = ['#a855f7', '#3b82f6', '#06b6d4', '#22c55e', '#eab308', '#ef4444', '#ec4899', '#f97316'];

/* ── initial data ── */

const initialTags: AssetTag[] = [
  { id: 'tag-all', name: '全部素材', color: '#a855f7', count: 12 },
  { id: 'tag-genshin', name: '原神', color: '#22c55e', count: 4 },
  { id: 'tag-wuthering', name: '鸣潮', color: '#3b82f6', count: 3 },
  { id: 'tag-zzz', name: '绝区零', color: '#ef4444', count: 3 },
  { id: 'tag-highlight', name: '高光', color: '#eab308', count: 2 },
  { id: 'tag-review', name: '待审核', color: '#f97316', count: 1 },
];

const initialAssets: Asset[] = [
  {
    id: 'a1', name: '原神实机录制_4.5.mp4', type: 'video', status: 'ready',
    size: 524_288_000, uploadedAt: '2026-04-28T10:00:00Z', duration: 1845,
    resolution: '1920×1080', thumbnail: '', tagIds: ['tag-genshin', 'tag-highlight'],
    createdAt: '2026-04-28T10:00:00Z', updatedAt: '2026-04-28T10:00:00Z',
  },
  {
    id: 'a2', name: '鸣潮角色演示.mp4', type: 'video', status: 'ready',
    size: 312_000_000, uploadedAt: '2026-04-28T11:00:00Z', duration: 720,
    resolution: '1920×1080', thumbnail: '', tagIds: ['tag-wuthering'],
    createdAt: '2026-04-28T11:00:00Z', updatedAt: '2026-04-28T11:00:00Z',
  },
  {
    id: 'a3', name: '绝区零封面.png', type: 'image', status: 'ready',
    size: 2_500_000, uploadedAt: '2026-04-28T12:00:00Z', resolution: '2560×1440',
    thumbnail: '', tagIds: ['tag-zzz'],
    createdAt: '2026-04-28T12:00:00Z', updatedAt: '2026-04-28T12:00:00Z',
  },
  {
    id: 'a4', name: 'BGM高燃合集.mp3', type: 'audio', status: 'ready',
    size: 8_400_000, uploadedAt: '2026-04-27T15:00:00Z', duration: 240,
    tagIds: ['tag-highlight'],
    createdAt: '2026-04-27T15:00:00Z', updatedAt: '2026-04-27T15:00:00Z',
  },
  {
    id: 'a5', name: '鸣潮_新角色爆料.mp4', type: 'video', status: 'uploading',
    size: 450_000_000, uploadedAt: '2026-04-29T06:00:00Z', progress: 67,
    tagIds: ['tag-wuthering'],
    createdAt: '2026-04-29T06:00:00Z', updatedAt: '2026-04-29T16:30:00Z',
  },
  {
    id: 'a6', name: '未知格式素材.xyz', type: 'unknown', status: 'pending-review',
    size: 15_000, uploadedAt: '2026-04-29T08:00:00Z', failReason: '格式待确认',
    tagIds: ['tag-review'],
    createdAt: '2026-04-29T08:00:00Z', updatedAt: '2026-04-29T08:00:00Z',
  },
  {
    id: 'a7', name: '原神深渊攻略片段.mp4', type: 'video', status: 'ready',
    size: 180_000_000, uploadedAt: '2026-04-27T09:00:00Z', duration: 600,
    resolution: '1920×1080', tagIds: ['tag-genshin'],
    createdAt: '2026-04-27T09:00:00Z', updatedAt: '2026-04-27T09:00:00Z',
  },
  {
    id: 'a8', name: '绝区零战斗截图.jpg', type: 'image', status: 'ready',
    size: 3_200_000, uploadedAt: '2026-04-26T14:00:00Z', resolution: '3840×2160',
    tagIds: ['tag-zzz'],
    createdAt: '2026-04-26T14:00:00Z', updatedAt: '2026-04-26T14:00:00Z',
  },
  {
    id: 'a9', name: '鸣潮OST.mp3', type: 'audio', status: 'ready',
    size: 6_700_000, uploadedAt: '2026-04-25T20:00:00Z', duration: 195,
    tagIds: ['tag-wuthering'],
    createdAt: '2026-04-25T20:00:00Z', updatedAt: '2026-04-25T20:00:00Z',
  },
  {
    id: 'a10', name: '原神角色立绘合集.png', type: 'image', status: 'ready',
    size: 5_600_000, uploadedAt: '2026-04-24T16:00:00Z', resolution: '4096×4096',
    tagIds: ['tag-genshin'],
    createdAt: '2026-04-24T16:00:00Z', updatedAt: '2026-04-24T16:00:00Z',
  },
  {
    id: 'a11', name: '绝区零PV混剪.mp4', type: 'video', status: 'failed',
    size: 620_000_000, uploadedAt: '2026-04-29T09:00:00Z',
    failReason: '上传超时，请重试', tagIds: ['tag-zzz'],
    createdAt: '2026-04-29T09:00:00Z', updatedAt: '2026-04-29T09:30:00Z',
    statusReason: 'Upload timeout after 60s',
  },
  {
    id: 'a12', name: '原神4.6前瞻壁纸.jpg', type: 'image', status: 'ready',
    size: 4_100_000, uploadedAt: '2026-04-23T11:00:00Z', resolution: '2560×1440',
    tagIds: ['tag-genshin', 'tag-highlight'],
    createdAt: '2026-04-23T11:00:00Z', updatedAt: '2026-04-23T11:00:00Z',
  },
];

/* ── store ── */

export const useAssetsStore = create<AssetsState>((set, get) => ({
  assets: initialAssets,
  tags: initialTags,
  auditLog: [],

  searchQuery: '',
  typeFilter: 'all',
  tagFilter: null,
  statusFilter: 'all',
  viewMode: 'grid',
  sortKey: 'newest',
  selectedIds: new Set<string>(),
  previewAssetId: null,
  page: 1,
  pageSize: 12,

  uploads: [],
  uploadOpen: false,

  confirmDialog: null,
  error: null,
  conflict: null,
  batchResult: null,

  /* ── Filter actions ── */

  setSearchQuery: (q) => set({ searchQuery: q, page: 1 }),
  setTypeFilter: (t) => set({ typeFilter: t, page: 1 }),
  setTagFilter: (tagId) => set({ tagFilter: tagId, page: 1 }),
  setStatusFilter: (s) => set({ statusFilter: s, page: 1 }),
  setViewMode: (v) => set({ viewMode: v }),
  setSortKey: (s) => set({ sortKey: s }),
  setPage: (p) => set({ page: p }),

  /* ── Selection ── */

  toggleSelect: (id) =>
    set((s) => {
      const next = new Set(s.selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedIds: next };
    }),

  selectAll: () =>
    set(() => ({ selectedIds: new Set(get().getFilteredAssets().map((a) => a.id)) })),

  clearSelection: () => set({ selectedIds: new Set() }),

  /* ── Preview ── */

  setPreviewAsset: (id) => set({ previewAssetId: id }),

  /* ── Upload ── */

  openUpload: () => set({ uploadOpen: true }),
  closeUpload: () => set({ uploadOpen: false, uploads: [] }),

  addUploadFiles: (files) => {
    const newUploads: UploadItem[] = files.map((f) => ({
      id: `up-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      file: f,
      name: f.name,
      size: f.size,
      type: guessType(f.name),
      progress: 0,
      status: 'waiting' as const,
    }));
    set((s) => ({ uploads: [...s.uploads, ...newUploads] }));
  },

  removeUpload: (id) =>
    set((s) => ({ uploads: s.uploads.filter((u) => u.id !== id) })),

  startUpload: () => {
    const CONCURRENT_LIMIT = 3; // C3: max 3 concurrent uploads

    /** Start a single upload simulation, chain to next when done */
    function startSingle(itemId: string, delay: number) {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress >= 100) {
          clearInterval(interval);
          set((s) => {
            const updated = s.uploads.map((u) =>
              u.id === itemId ? { ...u, progress: 100, status: 'done' as const } : u,
            );
            // A1: Start next waiting item (queue scheduling)
            const nextIdx = updated.findIndex((u) => u.status === 'waiting');
            let result = updated;
            if (nextIdx >= 0) {
              result = updated.map((u, i) =>
                i === nextIdx ? { ...u, status: 'uploading' as const } : u,
              );
              // Schedule next upload (outside set)
              setTimeout(() => startSingle(result[nextIdx].id, 300), 50);
            }

            // If all done, add to assets
            const allDone = result.every((u) => u.status === 'done' || u.status === 'failed');
            if (allDone) {
              const ts = now();
              const newAssets: Asset[] = result
                .filter((u) => u.status === 'done')
                .map((u) => ({
                  id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  name: u.name,
                  type: u.type,
                  status: 'ready' as const,
                  size: u.size,
                  uploadedAt: ts,
                  tagIds: [],
                  createdAt: ts,
                  updatedAt: ts,
                }));
              return { uploads: result, assets: [...s.assets, ...newAssets] };
            }
            return { uploads: result };
          });
        } else {
          set((s) => ({
            uploads: s.uploads.map((u) =>
              u.id === itemId ? { ...u, progress: Math.min(progress, 99) } : u,
            ),
          }));
        }
      }, delay);
    }

    // Mark first N as uploading and start their timers
    set((s) => ({
      uploads: s.uploads.map((u, i) =>
        i < CONCURRENT_LIMIT ? { ...u, status: 'uploading' as const } : u,
      ),
    }));

    const uploading = get().uploads.filter((u) => u.status === 'uploading');
    uploading.forEach((item, idx) => startSingle(item.id, 300 + idx * 100));
  },

  /* ── Tags ── */

  createTag: (name) =>
    set((s) => ({
      tags: [
        ...s.tags,
        {
          id: `tag-${Date.now()}`,
          name,
          color: TAG_COLORS[s.tags.length % TAG_COLORS.length],
          count: 0,
        },
      ],
    })),

  addTagToAssets: (tagId, assetIds) =>
    set((s) => ({
      assets: s.assets.map((a) =>
        assetIds.includes(a.id) && !a.tagIds.includes(tagId)
          ? { ...a, tagIds: [...a.tagIds, tagId], updatedAt: now() }
          : a,
      ),
      auditLog: [...s.auditLog, {
        operator: 'user', action: 'tag-add' as const, targetIds: assetIds,
        result: 'success' as const, detail: `tag=${tagId}`, timestamp: now(),
      }],
    })),

  removeTagFromAssets: (tagId, assetIds) =>
    set((s) => ({
      assets: s.assets.map((a) =>
        assetIds.includes(a.id)
          ? { ...a, tagIds: a.tagIds.filter((t) => t !== tagId), updatedAt: now() }
          : a,
      ),
      auditLog: [...s.auditLog, {
        operator: 'user', action: 'tag-remove' as const, targetIds: assetIds,
        result: 'success' as const, detail: `tag=${tagId}`, timestamp: now(),
      }],
    })),

  /* ── CRUD ── */

  deleteAssets: (ids) =>
    set((s) => ({
      assets: s.assets.filter((a) => !ids.includes(a.id)),
      selectedIds: new Set([...s.selectedIds].filter((id) => !ids.includes(id))),
      previewAssetId: ids.includes(s.previewAssetId ?? '') ? null : s.previewAssetId,
      auditLog: [...s.auditLog, {
        operator: 'user', action: 'delete' as const, targetIds: ids,
        result: 'success' as const, timestamp: now(),
      }],
    })),

  moveAssets: (ids, tagId) =>
    set((s) => ({
      assets: s.assets.map((a) =>
        ids.includes(a.id) && !a.tagIds.includes(tagId)
          ? { ...a, tagIds: [...a.tagIds, tagId], updatedAt: now() }
          : a,
      ),
      auditLog: [...s.auditLog, {
        operator: 'user', action: 'move' as const, targetIds: ids,
        result: 'success' as const, detail: `→ ${tagId}`, timestamp: now(),
      }],
    })),

  retryAsset: (id) => {
    // Mark as uploading, simulate retry
    set((s) => ({
      assets: s.assets.map((a) =>
        a.id === id ? { ...a, status: 'uploading' as const, progress: 0, failReason: undefined } : a,
      ),
    }));
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20 + 10;
      if (progress >= 100) {
        clearInterval(interval);
        set((s) => ({
          assets: s.assets.map((a) =>
            a.id === id ? { ...a, status: 'ready' as const, progress: undefined, updatedAt: now() } : a,
          ),
        }));
      } else {
        set((s) => ({
          assets: s.assets.map((a) =>
            a.id === id ? { ...a, progress: Math.min(progress, 99) } : a,
          ),
        }));
      }
    }, 400);
  },

  /* ── Batch ── */

  batchDelete: () => {
    const { selectedIds, assets } = get();
    const ids = [...selectedIds];
    // B4: simulate partial failure (last item "locked by other client")
    const success = ids.slice(0, -1);
    const failedItem = ids.length > 0 ? assets.find((a) => a.id === ids[ids.length - 1]) : null;

    set((s) => ({
      assets: s.assets.filter((a) => !success.includes(a.id)),
      selectedIds: new Set(),
      batchResult: {
        success,
        failed: failedItem
          ? [{ id: failedItem.id, name: failedItem.name, reason: '正在被其他端使用' }]
          : [],
      },
      auditLog: [...s.auditLog, {
        operator: 'user', action: 'delete' as const, targetIds: ids,
        result: failedItem ? 'partial' as const : 'success' as const,
        detail: failedItem ? `failed: ${failedItem.name} (locked)` : undefined,
        timestamp: now(),
      }],
    }));
  },

  batchMove: (tagId) => {
    const { selectedIds } = get();
    const ids = [...selectedIds];
    get().moveAssets(ids, tagId);
    set({ selectedIds: new Set() });
  },

  /* ── Dialogs / Conflict ── */

  openConfirm: (type, assetIds) => set({ confirmDialog: { type, assetIds } }),
  closeConfirm: () => set({ confirmDialog: null }),
  setError: (msg) => set({ error: msg }),
  dismissError: () => set({ error: null }),
  dismissConflict: () => set({ conflict: null }),
  dismissBatchResult: () => set({ batchResult: null }),

  simulateConflict: () => {
    const { assets } = get();
    const target = assets[0];
    if (!target) return;
    set({
      conflict: { assetId: target.id, assetName: target.name, reason: 'deleted' },
    });
    // Auto-remove after 3s (B5 auto-refresh)
    setTimeout(() => {
      set((s) => ({
        conflict: null,
        assets: s.assets.filter((a) => a.id !== target.id),
      }));
    }, 3000);
  },

  /* ── Derived ── */

  getFilteredAssets: () => {
    const { assets, searchQuery, typeFilter, tagFilter, statusFilter, sortKey } = get();
    let filtered = [...assets];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) => a.name.toLowerCase().includes(q) || a.tagIds.some((t) => {
          const tag = get().tags.find((tg) => tg.id === t);
          return tag?.name.toLowerCase().includes(q);
        }),
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((a) => a.type === typeFilter);
    }

    // Tag filter
    if (tagFilter) {
      filtered = filtered.filter((a) => a.tagIds.includes(tagFilter));
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortKey) {
        case 'newest': return b.uploadedAt.localeCompare(a.uploadedAt);
        case 'oldest': return a.uploadedAt.localeCompare(b.uploadedAt);
        case 'name': return a.name.localeCompare(b.name);
        case 'size': return b.size - a.size;
        default: return 0;
      }
    });

    return filtered;
  },

  getTagCounts: () => {
    const { assets, tags } = get();
    const counts: Record<string, number> = {};
    counts['tag-all'] = assets.length;
    tags.forEach((t) => {
      if (t.id !== 'tag-all') {
        counts[t.id] = assets.filter((a) => a.tagIds.includes(t.id)).length;
      }
    });
    return counts;
  },
}));
