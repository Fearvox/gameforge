'use client';

import { Tag, FolderInput, Trash2, Download } from 'lucide-react';
import { useAssetsStore } from '@/lib/assets-store';

export default function BatchActions() {
  const { selectedIds, clearSelection, openConfirm } = useAssetsStore();
  const count = selectedIds.size;

  if (count === 0) return null;

  return (
    <div className="glass-card flex items-center justify-between rounded-xl px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">已选 {count} 项</span>
        <button
          onClick={clearSelection}
          className="text-[10px] text-muted-foreground hover:text-foreground"
        >
          取消选择
        </button>
      </div>
      <div className="flex gap-2">
        <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          <Tag className="h-3.5 w-3.5" />
          批量打标
        </button>
        <button
          onClick={() => openConfirm('move', [...selectedIds])}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <FolderInput className="h-3.5 w-3.5" />
          移动到
        </button>
        <button
          onClick={() => openConfirm('delete', [...selectedIds])}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gaming-error transition-colors hover:bg-gaming-error/10"
        >
          <Trash2 className="h-3.5 w-3.5" />
          批量删除
        </button>
        <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          <Download className="h-3.5 w-3.5" />
          导出
        </button>
      </div>
    </div>
  );
}
