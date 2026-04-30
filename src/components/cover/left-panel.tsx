'use client';

import { Search, AlertTriangle, RefreshCw, Play, Music, Image as ImageIcon } from 'lucide-react';
import { useCoverStore, type CoverCategory } from '@/lib/cover-store';
import { useAssetsStore, type Asset } from '@/lib/assets-store';
import { NoTemplateResults } from '@/components/cover/empty-states';

const CATEGORIES: { label: string; value: CoverCategory }[] = [
  { label: '全部', value: '全部' },
  { label: '游戏', value: '游戏' },
  { label: '角色', value: '角色' },
  { label: '攻略', value: '攻略' },
  { label: '高光', value: '高光' },
];

/* ── Asset Item (A1: from /assets store) ── */

function AssetItem({ asset }: { asset: Asset }) {
  const { replaceImage, selectedId, addImageElement } = useCoverStore();

  const iconMap = {
    video: <Play className="h-3 w-3 text-muted-foreground/30" />,
    audio: <Music className="h-3 w-3 text-muted-foreground/30" />,
    image: <ImageIcon className="h-3 w-3 text-muted-foreground/30" />,
    unknown: <Play className="h-3 w-3 text-muted-foreground/30" />,
  };
  const bgMap = {
    video: 'bg-gaming-purple/10',
    audio: 'bg-gaming-cyan/10',
    image: 'bg-gaming-warning/10',
    unknown: 'bg-muted/30',
  };

  function handleImport() {
    // A1: If an image element is selected, replace it; otherwise add new
    if (selectedId) {
      const el = useCoverStore.getState().elements.find((e) => e.id === selectedId);
      if (el?.type === 'image') {
        replaceImage(selectedId, asset.thumbnail ?? `/api/assets/${asset.id}`);
        return;
      }
    }
    // Add as new image element
    addImageElement();
    const newId = useCoverStore.getState().selectedId;
    if (newId) {
      replaceImage(newId, asset.thumbnail ?? `/api/assets/${asset.id}`);
    }
  }

  // B2: Unsupported format → show warning
  const isUnsupported = asset.type === 'unknown' || asset.type === 'audio';

  return (
    <div
      onClick={isUnsupported ? undefined : handleImport}
      className={`flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors ${
        isUnsupported ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-accent'
      }`}
      title={isUnsupported ? `${asset.name} — 格式不支持` : `点击导入 ${asset.name}`}
    >
      <div className={`flex h-7 w-10 shrink-0 items-center justify-center rounded ${bgMap[asset.type]}`}>
        {iconMap[asset.type]}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] font-medium text-foreground">{asset.name}</p>
        <p className="text-[9px] text-muted-foreground">
          {asset.resolution ?? ''} {asset.duration ? `· ${Math.floor(asset.duration / 60)}:${String(Math.floor(asset.duration % 60)).padStart(2, '0')}` : ''}
        </p>
      </div>
      {isUnsupported && (
        <span className="text-[8px] text-gaming-warning">待处理</span>
      )}
    </div>
  );
}

export default function LeftPanel() {
  const {
    templates, activeTemplateId,
    templateCategory, setTemplateCategory,
    templateSearch, setTemplateSearch,
    applyTemplate,
    templateLoadError, templateLoadRetries,
  } = useCoverStore();

  /* A1: Get assets from /assets store — show all, including unsupported (B2 "待处理") */
  const assets = useAssetsStore((s) => s.assets);
  const allAssets = assets;
  const unsupportedAssets = allAssets.filter((a) => a.type === 'unknown' || a.type === 'audio');

  /* Filter templates by category + search (A1) */
  const filtered = templates.filter((t) => {
    const catOk = templateCategory === '全部' || t.category === templateCategory;
    const searchOk = !templateSearch || t.name.toLowerCase().includes(templateSearch.toLowerCase());
    return catOk && searchOk;
  });

  return (
    <div className="flex h-full flex-col border-r border-border bg-sidebar overflow-hidden">
      {/* Header */}
      <div className="p-3 pb-2">
        <h2 className="text-[11px] font-semibold text-foreground">模板库</h2>
      </div>

      {/* B1: Template load error */}
      {templateLoadError && (
        <div className="mx-3 mb-2 rounded-lg border border-gaming-error/20 bg-gaming-error/6 p-2">
          <div className="flex items-start gap-1.5">
            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-gaming-error" />
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-medium text-gaming-error">{templateLoadError}</p>
              <p className="text-[8px] text-muted-foreground/50">重试次数: {templateLoadRetries}</p>
              <div className="mt-1 flex gap-2">
                <button
                  onClick={() => useCoverStore.getState().simulateTemplateLoadError()}
                  className="flex items-center gap-0.5 text-[9px] font-medium text-gaming-error hover:underline"
                >
                  <RefreshCw className="h-2.5 w-2.5" />
                  重新加载
                </button>
                <button className="text-[9px] text-muted-foreground hover:text-foreground">
                  从空白创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search (A1) */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background/40 px-2 py-1.5">
          <Search className="h-3 w-3 text-muted-foreground/35" />
          <input
            value={templateSearch}
            onChange={(e) => setTemplateSearch(e.target.value)}
            placeholder="搜索模板..."
            className="flex-1 bg-transparent text-[10px] text-foreground placeholder:text-muted-foreground/35 outline-none"
          />
        </div>
      </div>

      {/* Category tabs (A1) */}
      <div className="flex flex-wrap gap-1.5 px-3 pb-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setTemplateCategory(cat.value)}
            className={`rounded-full px-3 py-1 text-[9px] font-semibold transition-colors ${
              templateCategory === cat.value
                ? 'bg-gaming-blue/12 text-gaming-blue'
                : 'bg-background/50 text-muted-foreground/55 hover:text-foreground'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Template grid (A1) — 2 columns */}
      <div className="flex-1 overflow-y-auto px-3">
        <div className="grid grid-cols-2 gap-2">
          {filtered.map((tpl) => {
            const isActive = tpl.id === activeTemplateId;
            return (
              <button
                key={tpl.id}
                onClick={() => applyTemplate(tpl.id)}
                className={`flex flex-col items-center justify-center rounded-lg p-2 transition-colors ${
                  isActive
                    ? 'border-[1.5px] border-gaming-blue/40 bg-gaming-purple/10'
                    : 'border border-border bg-background/30 hover:border-gaming-blue/20'
                }`}
                style={{ height: 80 }}
              >
                <span className="text-lg leading-none opacity-30">{tpl.thumbnail}</span>
                <span className="mt-1 text-[8px] font-medium text-foreground/60">{tpl.name}</span>
                <span className="mt-0.5 rounded-full bg-gaming-blue/15 px-1.5 py-px text-[7px] font-medium text-gaming-blue">
                  {tpl.aspectRatio}
                </span>
              </button>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div>
            <NoTemplateResults />
            <div className="text-center">
              <button
                onClick={() => { setTemplateSearch(''); setTemplateCategory('全部'); }}
                className="text-[10px] text-gaming-blue hover:underline"
              >
                清除筛选
              </button>
            </div>
          </div>
        )}

        {/* A1: Asset library section — all assets, unsupported marked "待处理" */}
        <div className="mt-3 border-t border-border pt-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-semibold text-foreground">素材库</h3>
            <span className="text-[10px] text-muted-foreground">{allAssets.length} 个</span>
          </div>
          <div className="mt-2 space-y-1">
            {allAssets.length > 0 ? allAssets.map((asset) => (
              <AssetItem key={asset.id} asset={asset} />
            )) : (
              <p className="py-2 text-center text-[10px] text-muted-foreground/35">暂无素材</p>
            )}
          </div>
          {/* B2: Unsupported format hint */}
          {unsupportedAssets.length > 0 && (
            <p className="mt-1 text-[8px] text-gaming-warning">
              {unsupportedAssets.length} 个素材格式不支持，标记为{'"待处理"'}
            </p>
          )}
        </div>

        {filtered.length > 0 && (
          <p className="py-3 text-center text-[10px] text-muted-foreground/35">
            共 {filtered.length} 个模板
          </p>
        )}
      </div>
    </div>
  );
}
