'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useCoverStore } from '@/lib/cover-store';
import TopBar from '@/components/cover/top-bar';
import LeftPanel from '@/components/cover/left-panel';
import CanvasEditor from '@/components/cover/canvas-editor';
import RightPanel from '@/components/cover/right-panel';
import StatusBar from '@/components/cover/status-bar';
import DraftRestore from '@/components/cover/draft-restore';
import ConflictModal from '@/components/cover/conflict-modal';
import ImageValidationPanel from '@/components/cover/image-validation-panel';
import PreviewErrorBanner from '@/components/cover/preview-error-banner';
import { EmptyCanvas, SkeletonCanvas, SkeletonTemplates } from '@/components/cover/empty-states';

export default function CoverPage() {
  const [loading, setLoading] = useState(true);
  const {
    elements, previewError,
    simulateConflict, simulateAuthError, verifySession,
    simulateTemplateLoadError, simulateImageValidationError, simulatePreviewError,
    saveDraft, setShowDraftRestore,
  } = useCoverStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      // A6: Simulate draft detection after loading
      setShowDraftRestore(true);
    }, 600);
    // B6/D3: Real session verification on mount
    verifySession();
    return () => clearTimeout(timer);
  }, [verifySession, setShowDraftRestore]);

  // A7: Auto-save draft every 30s (C3 debounce pattern)
  useEffect(() => {
    const interval = setInterval(() => {
      saveDraft();
    }, 30_000);
    return () => clearInterval(interval);
  }, [saveDraft]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      const s = useCoverStore.getState();
      if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        saveDraft();
      }
      if (e.key === 'z' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        e.preventDefault();
        s.undo();
      }
      if ((e.key === 'z' && (e.metaKey || e.ctrlKey) && e.shiftKey) || (e.key === 'y' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        s.redo();
      }
    }
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [saveDraft]);

  // A8: Check if there are any elements
  const hasElements = elements.length > 0;

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col overflow-hidden -m-4 md:-m-6">
      {/* Top Bar + Demo triggers */}
      <div className="relative">
        <TopBar />
        {/* B-path demo triggers */}
        <div className="absolute right-4 top-1 flex flex-wrap gap-1.5">
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
          <button
            onClick={simulateTemplateLoadError}
            className="flex items-center gap-1 rounded-lg border border-gaming-cyan/30 px-2 py-1 text-[9px] font-medium text-gaming-cyan transition-colors hover:bg-gaming-cyan/10"
          >
            <RefreshCw className="h-2.5 w-2.5" />
            B1 模板失败
          </button>
          <button
            onClick={simulateImageValidationError}
            className="flex items-center gap-1 rounded-lg border border-gaming-purple/30 px-2 py-1 text-[9px] font-medium text-gaming-purple transition-colors hover:bg-gaming-purple/10"
          >
            <AlertTriangle className="h-2.5 w-2.5" />
            B2 图片校验
          </button>
          <button
            onClick={simulatePreviewError}
            className="flex items-center gap-1 rounded-lg border border-gaming-blue/30 px-2 py-1 text-[9px] font-medium text-gaming-blue transition-colors hover:bg-gaming-blue/10"
          >
            <AlertTriangle className="h-2.5 w-2.5" />
            B3 预览失败
          </button>
        </div>
      </div>

      {/* Main content: left panel + center + right panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Template Library (260px, A1) */}
        <div className="w-[260px] shrink-0 hidden lg:block">
          {loading ? <SkeletonTemplates /> : <LeftPanel />}
        </div>

        {/* Center: Canvas Editor (A2/A3/A4/A5) */}
        <div className="min-w-0 flex-1 overflow-hidden">
          {loading ? (
            /* A8-3: Skeleton loading */
            <SkeletonCanvas />
          ) : !hasElements ? (
            /* A8-1: Empty canvas — no elements */
            <EmptyCanvas />
          ) : previewError ? (
            /* B3: Preview render failure */
            <PreviewErrorBanner />
          ) : (
            <CanvasEditor />
          )}
        </div>

        {/* Right Panel: Properties + Layers + Export Queue (300px, A3/A4/A6) */}
        <div className="w-[300px] shrink-0 hidden xl:block">
          <RightPanel />
        </div>
      </div>

      {/* B2: Image validation results (overlaid) */}
      <ImageValidationPanel />

      {/* Status Bar */}
      <StatusBar />

      {/* Modals */}
      <DraftRestore />
      <ConflictModal />
    </div>
  );
}
