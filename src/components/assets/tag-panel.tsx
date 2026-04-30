'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAssetsStore } from '@/lib/assets-store';

export default function TagPanel() {
  const { tags, tagFilter, setTagFilter, getTagCounts, createTag } = useAssetsStore();
  const counts = getTagCounts();
  const [newTagName, setNewTagName] = useState('');
  const [adding, setAdding] = useState(false);

  function handleCreate() {
    if (!newTagName.trim()) return;
    createTag(newTagName.trim());
    setNewTagName('');
    setAdding(false);
  }

  return (
    <div className="glass-card rounded-xl p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">标签</h3>
      <div className="space-y-1">
        {tags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => setTagFilter(tagFilter === tag.id ? null : tag.id)}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors ${
              tagFilter === tag.id
                ? 'bg-gaming-purple/15 text-gaming-purple'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              {tag.name}
            </span>
            <span className="font-mono text-[10px]">{counts[tag.id] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* New tag */}
      {adding ? (
        <div className="mt-2 flex gap-1">
          <input
            autoFocus
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            className="flex-1 rounded-md border border-border bg-background/50 px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gaming-purple"
            placeholder="标签名称"
          />
          <button
            onClick={handleCreate}
            className="rounded-md bg-gaming-purple/15 px-2 py-1 text-xs text-gaming-purple"
          >
            添加
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground transition-colors hover:border-gaming-purple hover:text-gaming-purple"
        >
          <Plus className="h-3 w-3" />
          新建标签
        </button>
      )}
    </div>
  );
}
