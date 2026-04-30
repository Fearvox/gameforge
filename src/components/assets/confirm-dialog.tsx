'use client';

import { X, Trash2, FolderInput } from 'lucide-react';
import { useAssetsStore } from '@/lib/assets-store';

export default function ConfirmDialog() {
  const { confirmDialog, closeConfirm, deleteAssets, batchDelete, batchMove, tags } = useAssetsStore();

  if (!confirmDialog) return null;

  const isDelete = confirmDialog.type === 'delete';
  const count = confirmDialog.assetIds.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className={`glass-card relative w-full max-w-sm rounded-xl p-6 ${
        isDelete ? 'border border-gaming-error/30' : 'border border-gaming-blue/30'
      }`}>
        <button onClick={closeConfirm} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>

        {/* Icon + title */}
        <div className="mb-4 flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            isDelete ? 'bg-gaming-error/10' : 'bg-gaming-blue/10'
          }`}>
            {isDelete ? <Trash2 className="h-5 w-5 text-gaming-error" /> : <FolderInput className="h-5 w-5 text-gaming-blue" />}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {isDelete ? `确认删除 ${count} 个素材？` : `移动 ${count} 个素材`}
            </h3>
            {isDelete && (
              <p className="text-xs text-gaming-error/80">此操作不可撤销</p>
            )}
          </div>
        </div>

        {/* Move: tag selector */}
        {!isDelete && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {tags.filter((t) => t.id !== 'tag-all').map((tag) => (
              <button
                key={tag.id}
                onClick={() => {
                  batchMove(tag.id);
                  closeConfirm();
                }}
                className="flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent"
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
                {tag.name}
              </button>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={closeConfirm}
            className="flex-1 rounded-lg border border-border py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
          >
            取消
          </button>
          {isDelete && (
            <button
              onClick={() => {
                // B4: multi-select → batchDelete (partial failure), single → deleteAssets
                if (confirmDialog.assetIds.length > 1) {
                  batchDelete();
                } else {
                  deleteAssets(confirmDialog.assetIds);
                }
                closeConfirm();
              }}
              className="flex-1 rounded-lg bg-gaming-error py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            >
              确认删除
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
