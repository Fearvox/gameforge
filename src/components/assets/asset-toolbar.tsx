'use client';

import { Search, Grid3X3, List, Upload } from 'lucide-react';
import { useAssetsStore, type AssetType, type SortKey } from '@/lib/assets-store';

const TYPE_FILTERS: { key: AssetType | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'video', label: '视频' },
  { key: 'image', label: '图片' },
  { key: 'audio', label: '音频' },
];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: '最新上传' },
  { key: 'oldest', label: '最早上传' },
  { key: 'name', label: '名称' },
  { key: 'size', label: '大小' },
];

export default function AssetToolbar() {
  const {
    searchQuery, setSearchQuery,
    typeFilter, setTypeFilter,
    viewMode, setViewMode,
    sortKey, setSortKey,
    openUpload,
  } = useAssetsStore();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative flex-1 min-w-[180px] max-w-sm">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索素材名称/标签..."
          className="w-full rounded-lg border border-border bg-background/50 py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gaming-purple"
        />
      </div>

      {/* Type filter */}
      <div className="flex gap-1">
        {TYPE_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTypeFilter(key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              typeFilter === key
                ? 'bg-gaming-purple/15 text-gaming-purple'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <select
        value={sortKey}
        onChange={(e) => setSortKey(e.target.value as SortKey)}
        className="rounded-lg border border-border bg-background/50 px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-gaming-purple"
      >
        {SORT_OPTIONS.map(({ key, label }) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>

      {/* View toggle */}
      <div className="flex gap-0.5 rounded-lg border border-border p-0.5">
        <button
          onClick={() => setViewMode('grid')}
          className={`rounded-md p-1.5 transition-colors ${
            viewMode === 'grid' ? 'bg-gaming-purple/15 text-gaming-purple' : 'text-muted-foreground'
          }`}
        >
          <Grid3X3 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`rounded-md p-1.5 transition-colors ${
            viewMode === 'list' ? 'bg-gaming-purple/15 text-gaming-purple' : 'text-muted-foreground'
          }`}
        >
          <List className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Upload CTA */}
      <button
        onClick={openUpload}
        className="flex items-center gap-1.5 rounded-lg gradient-gaming px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
      >
        <Upload className="h-3.5 w-3.5" />
        上传素材
      </button>
    </div>
  );
}
