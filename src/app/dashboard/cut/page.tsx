'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useCutStore } from '@/lib/cut-store';
import TopBar from '@/components/cut/top-bar';
import LeftPanel from '@/components/cut/left-panel';
import PreviewArea from '@/components/cut/preview-area';
import Timeline from '@/components/cut/timeline';
import RightPanel from '@/components/cut/right-panel';
import StatusBar from '@/components/cut/status-bar';
import DraftRestore from '@/components/cut/draft-restore';
import ConflictModal from '@/components/cut/conflict-modal';
import { EmptyProject, NoFilterResults, SkeletonTimeline } from '@/components/cut/empty-states';

export default function CutPage() {
  const [loading, setLoading] = useState(true);
  const {
    tracks, mediaFilter,
    simulateConflict, simulateAuthError, verifySession,
  } = useCutStore();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    // B6/D3: Real session verification on mount
    verifySession();
    return () => clearTimeout(timer);
  }, [verifySession]);

  // A7: Check if project has any clips
  const hasClips = tracks.some((t) => t.clips.length > 0);

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col overflow-hidden -m-4 md:-m-6">
      {/* Top Bar + Demo triggers */}
      <div className="relative">
        <TopBar />
        {/* B3/B6 demo triggers (like /assets "模拟冲突") */}
        <div className="absolute right-4 top-1 flex gap-1.5">
          <button
            onClick={simulateConflict}
            className="flex items-center gap-1 rounded-lg border border-gaming-warning/30 px-2 py-1 text-[9px] font-medium text-gaming-warning transition-colors hover:bg-gaming-warning/10"
          >
            <AlertTriangle className="h-2.5 w-2.5" />
            模拟冲突
          </button>
          <button
            onClick={simulateAuthError}
            className="flex items-center gap-1 rounded-lg border border-gaming-error/30 px-2 py-1 text-[9px] font-medium text-gaming-error transition-colors hover:bg-gaming-error/10"
          >
            <AlertTriangle className="h-2.5 w-2.5" />
            模拟 401
          </button>
        </div>
      </div>

      {/* Main content: left panel + center + right panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: AI highlights + media (220px) */}
        <div className="w-[220px] shrink-0 hidden lg:block">
          <LeftPanel />
        </div>

        {/* Center: Preview + Timeline */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {loading ? (
            /* A7-3: Skeleton loading */
            <div className="flex-1 flex flex-col">
              <div className="flex-1 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gaming-purple border-t-transparent" />
              </div>
              <SkeletonTimeline />
            </div>
          ) : !hasClips ? (
            /* A7-1: Empty project — no clips */
            <EmptyProject />
          ) : mediaFilter && tracks.every((t) =>
              t.clips.every((c) => !c.name.toLowerCase().includes(mediaFilter.toLowerCase()))
            ) ? (
            /* A7-2: No filter results — mediaFilter active but no matching clips */
            <NoFilterResults />
          ) : (
            <>
              {/* Preview area */}
              <div className="flex-1 overflow-hidden">
                <PreviewArea />
              </div>

              {/* Timeline */}
              <div className="h-[260px] shrink-0">
                <Timeline />
              </div>
            </>
          )}
        </div>

        {/* Right Panel: Properties + Effects + Queue (300px) */}
        <div className="w-[300px] shrink-0 hidden xl:block">
          <RightPanel />
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar />

      {/* Modals */}
      <DraftRestore />
      <ConflictModal />
    </div>
  );
}
