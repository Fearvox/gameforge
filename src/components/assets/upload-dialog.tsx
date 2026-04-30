'use client';

import { useCallback, useRef, useState } from 'react';
import { X, Upload, CheckCircle2, Loader2, Clock, AlertTriangle } from 'lucide-react';
import { useAssetsStore, type UploadItem } from '@/lib/assets-store';

function UploadRow({ item }: { item: UploadItem }) {
  const { removeUpload } = useAssetsStore();
  const statusIcon = {
    done: <CheckCircle2 className="h-4 w-4 text-gaming-success" />,
    uploading: <Loader2 className="h-4 w-4 animate-spin text-gaming-blue" />,
    waiting: <Clock className="h-4 w-4 text-muted-foreground/50" />,
    failed: <X className="h-4 w-4 text-gaming-error" />,
  }[item.status];

  return (
    <div className="flex items-center gap-3 rounded-lg bg-background/50 px-3 py-2">
      {statusIcon}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-foreground">{item.name}</p>
        {item.status === 'uploading' && (
          <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gaming-blue transition-all"
              style={{ width: `${item.progress}%` }}
            />
          </div>
        )}
      </div>
      <span className="shrink-0 text-[10px] font-mono text-muted-foreground">
        {item.status === 'done' ? '✓' : item.status === 'uploading' ? `${item.progress}%` : ''}
      </span>
      {item.status !== 'uploading' && (
        <button onClick={() => removeUpload(item.id)} className="text-muted-foreground hover:text-foreground">
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

export default function UploadDialog() {
  const { uploadOpen, closeUpload, uploads, addUploadFiles, startUpload } = useAssetsStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileErrors, setFileErrors] = useState<{ name: string; reason: string }[]>([]);

  const [validating, setValidating] = useState(false);

  /** A2/B2: frontend validation → backend API validation (dual check) */
  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files?.length) return;
    const MAX_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
    const ALLOWED_EXT = /\.(mp4|mov|webm|jpg|jpeg|png|gif|webp|mp3|wav|ogg)$/i;

    // Frontend pre-filter
    const candidates: File[] = [];
    const localErrors: { name: string; reason: string }[] = [];
    Array.from(files).forEach((f) => {
      if (f.size > MAX_SIZE) {
        localErrors.push({ name: f.name, reason: `文件大小 ${(f.size / 1073741824).toFixed(1)}GB 超过 2GB 限制` });
        return;
      }
      if (!ALLOWED_EXT.test(f.name)) {
        localErrors.push({ name: f.name, reason: `不支持的文件类型 (.${f.name.split('.').pop()})` });
        return;
      }
      candidates.push(f);
    });

    if (candidates.length === 0) {
      setFileErrors(localErrors);
      return;
    }

    // A2: Backend validation via POST /api/assets/validate
    setValidating(true);
    try {
      const res = await fetch('/api/assets/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: candidates.map((f) => ({ name: f.name, size: f.size, type: f.type })),
        }),
      });

      if (!res.ok) {
        // B6: Session expired / permission error
        if (res.status === 401 || res.status === 403) {
          const data = await res.json();
          useAssetsStore.getState().setError(data.error ?? '会话已过期，请重新登录');
          return;
        }
        throw new Error(`Server validation failed: ${res.status}`);
      }

      const { results } = await res.json();
      const backendErrors: { name: string; reason: string }[] = [];
      const validated: File[] = [];

      results.forEach((r: { name: string; valid: boolean; error?: string }, i: number) => {
        if (r.valid) {
          validated.push(candidates[i]);
        } else {
          backendErrors.push({ name: r.name, reason: r.error ?? '校验失败' });
        }
      });

      setFileErrors([...localErrors, ...backendErrors]);
      if (validated.length > 0) addUploadFiles(validated);
    } catch {
      setFileErrors([...localErrors, { name: '网络错误', reason: '无法连接到服务器，请重试' }]);
    } finally {
      setValidating(false);
    }
  }, [addUploadFiles]);

  if (!uploadOpen) return null;

  const hasFiles = uploads.length > 0;
  const allDone = hasFiles && uploads.every((u) => u.status === 'done' || u.status === 'failed');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-card relative w-full max-w-lg rounded-xl p-6">
        <button onClick={closeUpload} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>

        <h3 className="mb-4 text-sm font-semibold text-foreground">上传素材</h3>

        {/* Drop zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          onClick={() => fileRef.current?.click()}
          className="mb-4 flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-dashed border-border p-8 transition-colors hover:border-gaming-purple"
        >
          {validating ? (
            <Loader2 className="h-8 w-8 animate-spin text-gaming-blue" />
          ) : (
            <Upload className="h-8 w-8 text-muted-foreground/50" />
          )}
          <p className="text-xs text-muted-foreground">
            {validating ? '正在校验文件...' : '拖拽文件到这里，或点击选择'}
          </p>
          <p className="text-[10px] text-muted-foreground/50">支持 MP4/MOV/WebM/JPG/PNG/MP3/WAV（最大 2GB）</p>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="video/*,image/*,audio/*"
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
        </div>

        {/* B2: File-level validation errors */}
        {fileErrors.length > 0 && (
          <div className="mb-4 space-y-1">
            {fileErrors.map((err, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-gaming-error/10 px-3 py-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-gaming-error" />
                <span className="min-w-0 flex-1 truncate text-xs text-gaming-error">
                  {err.name}: {err.reason}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Upload queue */}
        {hasFiles && (
          <div className="mb-4 max-h-48 space-y-1.5 overflow-y-auto">
            {uploads.map((item) => (
              <UploadRow key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* C3: concurrent limit hint */}
        {hasFiles && !allDone && (
          <p className="mb-2 text-[10px] text-muted-foreground/60">
            最多同时上传 3 个文件（C3 并发上限）
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {!allDone ? (
            <button
              onClick={startUpload}
              disabled={!hasFiles}
              className="flex-1 rounded-lg gradient-gaming py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              开始上传
            </button>
          ) : (
            <button
              onClick={closeUpload}
              className="flex-1 rounded-lg gradient-gaming py-2 text-xs font-semibold text-white"
            >
              完成
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
