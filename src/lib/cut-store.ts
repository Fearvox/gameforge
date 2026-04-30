import { create } from 'zustand';

/* ── types ── */

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3';
export type TrackType = 'video' | 'broll' | 'audio' | 'subtitle';

export interface Clip {
  id: string;
  trackId: string;
  name: string;
  /** Start time in seconds */
  start: number;
  /** Duration in seconds */
  duration: number;
  /** In point (source trim) in seconds */
  inPoint: number;
  /** Out point (source trim) in seconds */
  outPoint: number;
  /** Volume 0-100 */
  volume: number;
  /** Opacity 0-100 */
  opacity: number;
  /** Speed multiplier */
  speed: number;
  /** Whether this clip is locked */
  locked?: boolean;
  /** Asset ID reference (from /assets) */
  assetId?: string;
  /** MIME type for display */
  mimeType?: string;
  /** AI marker IDs associated with this clip */
  markerIds?: string[];
  /** D4 audit */
  createdAt: string;
  updatedAt: string;
}

export interface Track {
  id: string;
  type: TrackType;
  name: string;
  clips: Clip[];
  /** Whether the track is muted/hidden */
  muted?: boolean;
  /** Whether the track is locked */
  locked?: boolean;
}

export interface AIMarker {
  id: string;
  name: string;
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
  /** Confidence 0-100 */
  confidence: number;
  /** Type of highlight */
  type: 'combat' | 'story' | 'moment' | 'reaction';
  /** Whether user has accepted this marker */
  accepted?: boolean;
  /** Whether user has ignored this marker */
  ignored?: boolean;
  /** User-adjusted start/end times */
  adjustedStart?: number;
  adjustedEnd?: number;
}

export type ExportStatus = 'queued' | 'rendering' | 'success' | 'failed' | 'needs-action';

export interface ExportTask {
  id: string;
  name: string;
  status: ExportStatus;
  progress: number;
  /** e.g. '1080p', '720p' */
  resolution: string;
  /** Aspect ratio used for this export */
  aspectRatio: AspectRatio;
  /** Error details for failed/needs-action */
  failReason?: string;
  /** CTA label for needs-action */
  cta?: string;
  /** D4 audit */
  createdAt: string;
  updatedAt: string;
  /** D5 audit: status change reason */
  statusReason?: string;
}

export interface DraftState {
  projectId: string;
  projectName: string;
  tracks: Track[];
  markers: AIMarker[];
  aspectRatio: AspectRatio;
  /** Total project duration in seconds */
  totalDuration: number;
  savedAt: string;
}

export interface ConflictInfo {
  projectId: string;
  reason: 'modified' | 'deleted';
  otherUser?: string;
}

export interface AuditEvent {
  operator: string;
  action: 'create-export' | 'cancel-export' | 'retry-export' | 'add-clip' | 'remove-clip' | 'split-clip' | 'move-clip' | 'conflict-resolve' | 'draft-save' | 'draft-restore' | 'marker-accept' | 'marker-ignore' | 'marker-adjust';
  targetIds: string[];
  result: 'success' | 'partial' | 'failed';
  detail?: string;
  timestamp: string;
}

/* ── A2 undo/redo history ── */

interface HistoryEntry {
  tracks: Track[];
  markers: AIMarker[];
  aspectRatio: AspectRatio;
}

const MAX_HISTORY = 20; // A2: at least 20 steps

/* ── state interface ── */

export interface CutState {
  /* Project */
  projectId: string;
  projectName: string;

  /* Timeline data */
  tracks: Track[];
  markers: AIMarker[];
  aspectRatio: AspectRatio;
  totalDuration: number;

  /* Playback */
  currentTime: number;
  playing: boolean;

  /* Selection */
  selectedClipId: string | null;
  selectedMarkerId: string | null;

  /* UI state */
  zoom: number; // 10-200, default 50
  snapEnabled: boolean;
  leftPanelTab: 'highlights' | 'media';
  rightPanelTab: 'properties' | 'effects' | 'transitions';
  /** A7: filter query for media library */
  mediaFilter: string;

  /* AI */
  aiAnalyzing: boolean;
  aiError: string | null;

  /* Export */
  exports: ExportTask[];
  exportConcurrency: number; // C3: max 2

  /* Draft / auto-save */
  draftSaved: boolean;
  draftSavedAt: string | null;
  draftRecovered: boolean;
  showDraftRestore: boolean;
  draftConflict: ConflictInfo | null;

  /* Error */
  error: string | null;

  /* Audit */
  auditLog: AuditEvent[];

  /* A2: Undo/Redo history */
  _past: HistoryEntry[];
  _future: HistoryEntry[];

  /* Actions */
  setProjectName: (name: string) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  setCurrentTime: (t: number) => void;
  setPlaying: (p: boolean) => void;
  setSelectedClip: (id: string | null) => void;
  setSelectedMarker: (id: string | null) => void;
  setZoom: (z: number) => void;
  toggleSnap: () => void;
  setLeftPanelTab: (t: 'highlights' | 'media') => void;
  setRightPanelTab: (t: 'properties' | 'effects' | 'transitions') => void;
  setMediaFilter: (q: string) => void;

  /* Track/Clip actions */
  addClipToTrack: (trackId: string, clip: Omit<Clip, 'createdAt' | 'updatedAt'>) => void;
  removeClip: (clipId: string) => void;
  moveClip: (clipId: string, newTrackId: string, newStart: number) => void;
  splitClip: (clipId: string, atTime: number) => void;
  updateClip: (clipId: string, updates: Partial<Clip>) => void;

  /* AI marker actions */
  triggerAIAnalysis: () => void;
  acceptMarker: (markerId: string) => void;
  ignoreMarker: (markerId: string) => void;
  adjustMarker: (markerId: string, start: number, end: number) => void;

  /* Export actions */
  createExport: (name: string, resolution: string, ratio: AspectRatio) => void;
  cancelExport: (id: string) => void;
  retryExport: (id: string) => void;

  /* Draft actions */
  saveDraft: () => void;
  restoreDraft: () => void;
  discardDraft: () => void;
  dismissDraftPrompt: () => void;

  /* Conflict actions */
  simulateConflict: () => void;
  dismissConflict: () => void;
  resolveConflict: (keepLocal: boolean) => void;

  /* Error actions */
  setError: (msg: string | null) => void;
  dismissError: () => void;
  simulateAuthError: () => void;
  /** D3: Real session check via /api/cut/session */
  verifySession: () => Promise<void>;

  /* A2: Undo/Redo */
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  /* Derived */
  getClipById: (id: string) => Clip | undefined;
  getSelectedClip: () => Clip | undefined;
  getTrackClips: (trackId: string) => Clip[];
  getAcceptedMarkers: () => AIMarker[];
  getActiveExports: () => ExportTask[];
}

/* ── helpers ── */

const now = () => new Date().toISOString();
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

function snapshot(state: CutState): HistoryEntry {
  return {
    tracks: JSON.parse(JSON.stringify(state.tracks)),
    markers: JSON.parse(JSON.stringify(state.markers)),
    aspectRatio: state.aspectRatio,
  };
}

function applySnapshot(entry: HistoryEntry): Partial<CutState> {
  return {
    tracks: JSON.parse(JSON.stringify(entry.tracks)),
    markers: JSON.parse(JSON.stringify(entry.markers)),
    aspectRatio: entry.aspectRatio,
  };
}

function pushHistory(state: CutState): { _past: HistoryEntry[]; _future: HistoryEntry[] } {
  const entry = snapshot(state);
  const past = [...state._past, entry].slice(-MAX_HISTORY);
  return { _past: past, _future: [] };
}

/* ── mock AI markers ── */

const mockMarkers: AIMarker[] = [
  { id: 'm1', name: '新角色大招展示', start: 135, end: 168, confidence: 96, type: 'combat' },
  { id: 'm2', name: 'Boss 战高燃瞬间', start: 330, end: 372, confidence: 91, type: 'combat' },
  { id: 'm3', name: '剧情关键对话', start: 520, end: 545, confidence: 87, type: 'story' },
  { id: 'm4', name: '角色表情特写', start: 180, end: 195, confidence: 82, type: 'reaction' },
  { id: 'm5', name: '环境远景切换', start: 600, end: 630, confidence: 78, type: 'moment' },
  { id: 'm6', name: '技能连招展示', start: 400, end: 430, confidence: 93, type: 'combat' },
];

/* ── initial data ── */

const ts = now();

const initialTracks: Track[] = [
  {
    id: 'track-video', type: 'video', name: '主视频',
    clips: [
      {
        id: 'c1', trackId: 'track-video', name: '原神4.7_实机_01.mp4',
        start: 0, duration: 510, inPoint: 0, outPoint: 510,
        volume: 100, opacity: 100, speed: 1, assetId: 'a1',
        createdAt: ts, updatedAt: ts,
        markerIds: ['m1', 'm2', 'm3'],
      },
    ],
  },
  {
    id: 'track-broll', type: 'broll', name: 'B-Roll',
    clips: [
      {
        id: 'c2', trackId: 'track-broll', name: '鸣潮_角色演示.mp4',
        start: 120, duration: 180, inPoint: 0, outPoint: 180,
        volume: 0, opacity: 80, speed: 1, assetId: 'a2',
        createdAt: ts, updatedAt: ts,
      },
      {
        id: 'c3', trackId: 'track-broll', name: '封面_v3.png',
        start: 330, duration: 90, inPoint: 0, outPoint: 90,
        volume: 0, opacity: 100, speed: 1,
        createdAt: ts, updatedAt: ts,
      },
    ],
  },
  {
    id: 'track-audio', type: 'audio', name: '音频',
    clips: [
      {
        id: 'c4', trackId: 'track-audio', name: '原声',
        start: 0, duration: 510, inPoint: 0, outPoint: 510,
        volume: 100, opacity: 100, speed: 1, locked: true, assetId: 'a1',
        createdAt: ts, updatedAt: ts,
      },
      {
        id: 'c5', trackId: 'track-audio', name: 'BGM_战斗_高燃.mp3',
        start: 60, duration: 450, inPoint: 0, outPoint: 450,
        volume: 80, opacity: 100, speed: 1, assetId: 'a4',
        createdAt: ts, updatedAt: ts,
      },
    ],
  },
  {
    id: 'track-subtitle', type: 'subtitle', name: '字幕',
    clips: [
      {
        id: 'c6', trackId: 'track-subtitle', name: '新角色技能演示...',
        start: 100, duration: 40, inPoint: 0, outPoint: 40,
        volume: 0, opacity: 100, speed: 1,
        createdAt: ts, updatedAt: ts,
      },
      {
        id: 'c7', trackId: 'track-subtitle', name: 'Boss 战开始...',
        start: 260, duration: 30, inPoint: 0, outPoint: 30,
        volume: 0, opacity: 100, speed: 1,
        createdAt: ts, updatedAt: ts,
      },
      {
        id: 'c8', trackId: 'track-subtitle', name: '角色大招释放...',
        start: 380, duration: 35, inPoint: 0, outPoint: 35,
        volume: 0, opacity: 100, speed: 1,
        createdAt: ts, updatedAt: ts,
      },
    ],
  },
];

const initialExports: ExportTask[] = [
  {
    id: 'exp1', name: '原神4.7_测评_16:9.mp4', status: 'rendering', progress: 65,
    resolution: '1080p', aspectRatio: '16:9', createdAt: ts, updatedAt: ts,
  },
  {
    id: 'exp2', name: '原神4.7_测评_9:16.mp4', status: 'queued', progress: 0,
    resolution: '720p', aspectRatio: '9:16', createdAt: ts, updatedAt: ts,
  },
];

/* ── store ── */

export const useCutStore = create<CutState>((set, get) => ({
  projectId: 'proj-1',
  projectName: '原神4.7_新角色测评_剪辑项目',

  tracks: initialTracks,
  markers: mockMarkers,
  aspectRatio: '16:9',
  totalDuration: 1122, // 18:42

  currentTime: 135, // 02:15
  playing: false,

  selectedClipId: null,
  selectedMarkerId: null,

  zoom: 50,
  snapEnabled: true,
  leftPanelTab: 'highlights',
  rightPanelTab: 'properties',
  mediaFilter: '',

  aiAnalyzing: false,
  aiError: null,

  exports: initialExports,
  exportConcurrency: 2,

  draftSaved: true,
  draftSavedAt: ts,
  draftRecovered: false,
  showDraftRestore: false,
  draftConflict: null,

  error: null,
  auditLog: [],

  _past: [],
  _future: [],

  /* ── UI actions ── */

  setProjectName: (name) => set({ projectName: name }),
  setAspectRatio: (ratio) => {
    const s = get();
    set({ ...pushHistory(s), aspectRatio: ratio });
  },
  setCurrentTime: (t) => set({ currentTime: Math.max(0, t) }),
  setPlaying: (p) => set({ playing: p }),
  setSelectedClip: (id) => set({ selectedClipId: id, selectedMarkerId: null }),
  setSelectedMarker: (id) => set({ selectedMarkerId: id, selectedClipId: null }),
  setZoom: (z) => set({ zoom: Math.max(10, Math.min(200, z)) }),
  toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),
  setLeftPanelTab: (t) => set({ leftPanelTab: t }),
  setRightPanelTab: (t) => set({ rightPanelTab: t }),
  setMediaFilter: (q) => set({ mediaFilter: q }),

  /* ── Clip actions (with undo history) ── */

  addClipToTrack: (trackId, clipData) =>
    set((s) => {
      const ts = now();
      const newClip: Clip = { ...clipData, trackId, createdAt: ts, updatedAt: ts };
      const tracks = s.tracks.map((t) =>
        t.id === trackId ? { ...t, clips: [...t.clips, newClip] } : t,
      );
      return {
        ...pushHistory(s),
        tracks,
        draftSaved: false,
        auditLog: [...s.auditLog, {
          operator: 'user', action: 'add-clip' as const,
          targetIds: [newClip.id], result: 'success' as const,
          detail: `→ ${trackId}`, timestamp: ts,
        }],
      };
    }),

  removeClip: (clipId) =>
    set((s) => {
      // Medium: check locked track/clip
      const track = s.tracks.find((t) => t.clips.some((c) => c.id === clipId));
      if (track?.locked) return s;
      const clip = track?.clips.find((c) => c.id === clipId);
      if (clip?.locked) return s;

      const ts = now();
      const tracks = s.tracks.map((t) => ({
        ...t,
        clips: t.clips.filter((c) => c.id !== clipId),
      }));
      return {
        ...pushHistory(s),
        tracks,
        selectedClipId: s.selectedClipId === clipId ? null : s.selectedClipId,
        draftSaved: false,
        auditLog: [...s.auditLog, {
          operator: 'user', action: 'remove-clip' as const,
          targetIds: [clipId], result: 'success' as const, timestamp: ts,
        }],
      };
    }),

  moveClip: (clipId, newTrackId, newStart) =>
    set((s) => {
      // Medium: check locked source track/clip
      const srcTrack = s.tracks.find((t) => t.clips.some((c) => c.id === clipId));
      if (srcTrack?.locked) return s;
      const srcClip = srcTrack?.clips.find((c) => c.id === clipId);
      if (srcClip?.locked) return s;
      // Also check destination track is not locked
      const dstTrack = s.tracks.find((t) => t.id === newTrackId);
      if (dstTrack?.locked) return s;

      const ts = now();
      let movedClip: Clip | undefined;
      const tracks = s.tracks.map((t) => {
        const clipIdx = t.clips.findIndex((c) => c.id === clipId);
        if (clipIdx >= 0) {
          const clip = { ...t.clips[clipIdx], trackId: newTrackId, start: newStart, updatedAt: ts };
          movedClip = clip;
          return { ...t, clips: t.clips.filter((c) => c.id !== clipId) };
        }
        return t;
      });
      if (movedClip) {
        const finalTracks = tracks.map((t) =>
          t.id === newTrackId ? { ...t, clips: [...t.clips, movedClip!] } : t,
        );
        return {
          ...pushHistory(s),
          tracks: finalTracks,
          draftSaved: false,
          auditLog: [...s.auditLog, {
            operator: 'user', action: 'move-clip' as const,
            targetIds: [clipId], result: 'success' as const,
            detail: `→ ${newTrackId} @${newStart}s`, timestamp: ts,
          }],
        };
      }
      return s;
    }),

  splitClip: (clipId, atTime) =>
    set((s) => {
      // Medium: check locked track/clip
      const track = s.tracks.find((t) => t.clips.some((c) => c.id === clipId));
      if (track?.locked) return s;
      const clip = track?.clips.find((c) => c.id === clipId);
      if (clip?.locked) return s;

      const ts = now();
      const tracks = s.tracks.map((t) => {
        const clipIdx = t.clips.findIndex((c) => c.id === clipId);
        if (clipIdx < 0) return t;
        const clip = t.clips[clipIdx];
        const relTime = atTime - clip.start;
        if (relTime <= 0 || relTime >= clip.duration) return t;

        const leftClip: Clip = {
          ...clip, id: `c-${uid()}`,
          duration: relTime,
          outPoint: clip.inPoint + relTime,
          updatedAt: ts,
        };
        const rightClip: Clip = {
          ...clip, id: `c-${uid()}`,
          start: atTime,
          duration: clip.duration - relTime,
          inPoint: clip.inPoint + relTime,
          updatedAt: ts,
          createdAt: ts,
        };
        const newClips = [...t.clips];
        newClips.splice(clipIdx, 1, leftClip, rightClip);
        return { ...t, clips: newClips };
      });

      return {
        ...pushHistory(s),
        tracks,
        draftSaved: false,
        auditLog: [...s.auditLog, {
          operator: 'user', action: 'split-clip' as const,
          targetIds: [clipId], result: 'success' as const,
          detail: `@${atTime}s`, timestamp: ts,
        }],
      };
    }),

  updateClip: (clipId, updates) =>
    set((s) => {
      const ts = now();
      const tracks = s.tracks.map((t) => ({
        ...t,
        clips: t.clips.map((c) =>
          c.id === clipId ? { ...c, ...updates, updatedAt: ts } : c,
        ),
      }));
      return { ...pushHistory(s), tracks, draftSaved: false };
    }),

  /* ── AI marker actions ── */

  triggerAIAnalysis: () => {
    set({ aiAnalyzing: true, aiError: null });
    // B1: Simulate AI analysis with timeout
    setTimeout(() => {
      const fail = Math.random() < 0.15; // 15% chance of failure for B1 demo
      if (fail) {
        set({
          aiAnalyzing: false,
          aiError: 'AI 分析超时，请稍后重试',
        });
      } else {
        set({
          aiAnalyzing: false,
          aiError: null,
          markers: mockMarkers.map((m) => ({ ...m, accepted: undefined, ignored: undefined })),
        });
      }
    }, 2500);
  },

  acceptMarker: (markerId) =>
    set((s) => {
      const marker = s.markers.find((m) => m.id === markerId);
      if (!marker) return s;
      const ts = now();
      const start = marker.adjustedStart ?? marker.start;
      const end = marker.adjustedEnd ?? marker.end;
      // Add to video track as a new clip
      const newClip: Clip = {
        id: `c-${uid()}`, trackId: 'track-video', name: marker.name,
        start, duration: end - start, inPoint: 0, outPoint: end - start,
        volume: 100, opacity: 100, speed: 1, markerIds: [markerId],
        createdAt: ts, updatedAt: ts,
      };
      const tracks = s.tracks.map((t) =>
        t.id === 'track-video' ? { ...t, clips: [...t.clips, newClip] } : t,
      );
      return {
        ...pushHistory(s),
        markers: s.markers.map((m) => m.id === markerId ? { ...m, accepted: true } : m),
        tracks,
        draftSaved: false,
        auditLog: [...s.auditLog, {
          operator: 'user', action: 'marker-accept' as const,
          targetIds: [markerId], result: 'success' as const,
          detail: `${marker.name} → track-video`, timestamp: ts,
        }],
      };
    }),

  ignoreMarker: (markerId) =>
    set((s) => ({
      markers: s.markers.map((m) => m.id === markerId ? { ...m, ignored: true } : m),
      auditLog: [...s.auditLog, {
        operator: 'user', action: 'marker-ignore' as const,
        targetIds: [markerId], result: 'success' as const, timestamp: now(),
      }],
    })),

  adjustMarker: (markerId, start, end) =>
    set((s) => ({
      markers: s.markers.map((m) =>
        m.id === markerId ? { ...m, adjustedStart: start, adjustedEnd: end } : m,
      ),
      auditLog: [...s.auditLog, {
        operator: 'user', action: 'marker-adjust' as const,
        targetIds: [markerId], result: 'success' as const,
        detail: `${start}s-${end}s`, timestamp: now(),
      }],
    })),

  /* ── Export actions ── */

  createExport: (name, resolution, ratio) => {
    const ts = now();
    const task: ExportTask = {
      id: `exp-${uid()}`, name, status: 'queued', progress: 0,
      resolution, aspectRatio: ratio, createdAt: ts, updatedAt: ts,
    };
    set((s) => ({
      exports: [...s.exports, task],
      auditLog: [...s.auditLog, {
        operator: 'user', action: 'create-export' as const,
        targetIds: [task.id], result: 'success' as const,
        detail: `${resolution} ${ratio}`, timestamp: ts,
      }],
    }));
    // Auto-start if under concurrency limit (C3)
    const { exports, exportConcurrency } = get();
    const activeCount = exports.filter((e) => e.status === 'rendering').length;
    if (activeCount < exportConcurrency) {
      startExportSimulation(task.id);
    }
  },

  cancelExport: (id) =>
    set((s) => ({
      exports: s.exports.filter((e) => e.id !== id),
      auditLog: [...s.auditLog, {
        operator: 'user', action: 'cancel-export' as const,
        targetIds: [id], result: 'success' as const, timestamp: now(),
      }],
    })),

  retryExport: (id) => {
    set((s) => ({
      exports: s.exports.map((e) =>
        e.id === id ? { ...e, status: 'queued' as const, progress: 0, failReason: undefined, updatedAt: now() } : e,
      ),
      auditLog: [...s.auditLog, {
        operator: 'user', action: 'retry-export' as const,
        targetIds: [id], result: 'success' as const, timestamp: now(),
      }],
    }));
    startExportSimulation(id);
  },

  /* ── Draft actions (A6) ── */

  saveDraft: () => {
    const s = get();
    const draft: DraftState = {
      projectId: s.projectId, projectName: s.projectName,
      tracks: JSON.parse(JSON.stringify(s.tracks)),
      markers: JSON.parse(JSON.stringify(s.markers)),
      aspectRatio: s.aspectRatio, totalDuration: s.totalDuration,
      savedAt: now(),
    };
    try {
      localStorage.setItem(`cut-draft-${s.projectId}`, JSON.stringify(draft));
      set({ draftSaved: true, draftSavedAt: now() });
    } catch { /* localStorage may be full */ }
  },

  restoreDraft: () => {
    const s = get();
    try {
      const raw = localStorage.getItem(`cut-draft-${s.projectId}`);
      if (!raw) return;
      const draft: DraftState = JSON.parse(raw);
      set({
        tracks: draft.tracks,
        markers: draft.markers,
        aspectRatio: draft.aspectRatio,
        totalDuration: draft.totalDuration,
        projectName: draft.projectName,
        draftRecovered: true,
        showDraftRestore: false,
        auditLog: [...s.auditLog, {
          operator: 'user', action: 'draft-restore' as const,
          targetIds: [s.projectId], result: 'success' as const,
          detail: `from ${draft.savedAt}`, timestamp: now(),
        }],
      });
    } catch { /* corrupt draft */ }
  },

  discardDraft: () => {
    const s = get();
    localStorage.removeItem(`cut-draft-${s.projectId}`);
    set({ showDraftRestore: false });
  },

  dismissDraftPrompt: () => set({ showDraftRestore: false }),

  /* ── Conflict (B3) ── */

  /* B3: Simulate multi-device conflict (demo trigger) */
  simulateConflict: () => {
    set({ draftConflict: { projectId: get().projectId, reason: 'modified', otherUser: '另一台设备' } });
  },

  dismissConflict: () => set({ draftConflict: null }),

  resolveConflict: (keepLocal) => {
    const s = get();
    if (!keepLocal) {
      // Simulate fetching remote version
      set({ draftConflict: null });
    } else {
      // Keep local, push to "server"
      set({
        draftConflict: null,
        auditLog: [...s.auditLog, {
          operator: 'user', action: 'conflict-resolve' as const,
          targetIds: [s.projectId], result: 'success' as const,
          detail: keepLocal ? 'keep-local' : 'use-remote', timestamp: now(),
        }],
      });
    }
  },

  /* ── Error ── */

  setError: (msg) => set({ error: msg }),
  dismissError: () => set({ error: null }),
  simulateAuthError: () => set({ error: '会话已过期，请重新登录（401 Unauthorized）' }),

  verifySession: async () => {
    try {
      const res = await fetch('/api/cut/session', {
        headers: { 'Authorization': 'Bearer valid-token' },
      });
      if (res.status === 401 || res.status === 403) {
        const data = await res.json();
        set({ error: data.error ?? '会话已过期，请重新登录' });
      }
    } catch {
      // Network error — don't block UI
    }
  },

  /* ── A2: Undo/Redo ── */

  undo: () =>
    set((s) => {
      if (s._past.length === 0) return s;
      const past = [...s._past];
      const entry = past.pop()!;
      return {
        ...applySnapshot(entry),
        _past: past,
        _future: [snapshot(s), ...s._future].slice(0, MAX_HISTORY),
        draftSaved: false,
      };
    }),

  redo: () =>
    set((s) => {
      if (s._future.length === 0) return s;
      const future = [...s._future];
      const entry = future.shift()!;
      return {
        ...applySnapshot(entry),
        _past: [...s._past, snapshot(s)].slice(-MAX_HISTORY),
        _future: future,
        draftSaved: false,
      };
    }),

  canUndo: () => get()._past.length > 0,
  canRedo: () => get()._future.length > 0,

  /* ── Derived ── */

  getClipById: (id) => {
    for (const track of get().tracks) {
      const clip = track.clips.find((c) => c.id === id);
      if (clip) return clip;
    }
    return undefined;
  },

  getSelectedClip: () => {
    const { selectedClipId } = get();
    if (!selectedClipId) return undefined;
    return get().getClipById(selectedClipId);
  },

  getTrackClips: (trackId) => {
    const track = get().tracks.find((t) => t.id === trackId);
    return track?.clips ?? [];
  },

  getAcceptedMarkers: () => get().markers.filter((m) => m.accepted && !m.ignored),

  getActiveExports: () => get().exports.filter((e) => e.status === 'rendering' || e.status === 'queued'),
}));

/* ── Export simulation ── */

function startExportSimulation(taskId: string) {
  // Mark as rendering
  useCutStore.setState((s) => ({
    exports: s.exports.map((e) =>
      e.id === taskId ? { ...e, status: 'rendering' as const, progress: 0, updatedAt: now() } : e,
    ),
  }));

  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 8 + 3;

    if (progress >= 100) {
      clearInterval(interval);
      // B2: 20% chance of failure for demo
      const fail = Math.random() < 0.2;
      useCutStore.setState((s) => ({
        exports: s.exports.map((e) => {
          if (e.id !== taskId) return e;
          if (fail) {
            const needsAction = Math.random() < 0.5;
            return {
              ...e,
              status: needsAction ? 'needs-action' as const : 'failed' as const,
              progress: 100,
              failReason: needsAction ? '导出目标不可用，请重新授权' : '渲染引擎临时错误',
              cta: needsAction ? '重新授权' : undefined,
              updatedAt: now(),
              statusReason: needsAction ? 'Export target unavailable' : 'Render engine timeout',
            };
          }
          return { ...e, status: 'success' as const, progress: 100, updatedAt: now() };
        }),
        // C3: Start next queued
        auditLog: fail ? s.auditLog : [...s.auditLog, {
          operator: 'system', action: 'create-export' as const,
          targetIds: [taskId], result: 'success' as const,
          detail: 'render complete', timestamp: now(),
        }],
      }));

      // Start next queued export if under limit (regardless of success/fail — High 5 fix)
      const { exports, exportConcurrency } = useCutStore.getState();
      const activeCount = exports.filter((e) => e.status === 'rendering').length;
      const nextQueued = exports.find((e) => e.status === 'queued');
      if (nextQueued && activeCount < exportConcurrency) {
        startExportSimulation(nextQueued.id);
      }
    } else {
      useCutStore.setState((s) => ({
        exports: s.exports.map((e) =>
          e.id === taskId ? { ...e, progress: Math.min(progress, 99), updatedAt: now() } : e,
        ),
      }));
    }
  }, 500);
}

/* ── Auto-save (A6) ── */

if (typeof window !== 'undefined') {
  // Auto-save every 30s or on significant changes
  setInterval(() => {
    const s = useCutStore.getState();
    if (!s.draftSaved) {
      s.saveDraft();
    }
  }, 30_000);

  // Check for existing draft on load
  setTimeout(() => {
    const s = useCutStore.getState();
    try {
      const raw = localStorage.getItem(`cut-draft-${s.projectId}`);
      if (raw) {
        useCutStore.setState({ showDraftRestore: true });
      }
    } catch { /* no-op */ }
  }, 500);
}
