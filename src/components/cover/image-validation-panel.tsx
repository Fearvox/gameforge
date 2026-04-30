'use client';

import { CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';
import { useCoverStore } from '@/lib/cover-store';

/* ── B2: Image validation results panel ──
 * Shows per-file validation results with pass/warn/fail icons.
 * Appears as an overlay when triggered.
 */

export default function ImageValidationPanel() {
  const { imageValidationResults, clearImageValidation } = useCoverStore();

  if (imageValidationResults.length === 0) return null;

  const failCount = imageValidationResults.filter((r) => r.status === 'fail').length;
  const warnCount = imageValidationResults.filter((r) => r.status === 'warn').length;
  const passCount = imageValidationResults.filter((r) => r.status === 'pass').length;

  return (
    <div className="fixed bottom-16 right-4 z-40 w-[320px] rounded-xl border border-border bg-sidebar shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <h3 className="text-[11px] font-semibold text-foreground">
          图片校验结果
          <span className="ml-2 text-[10px] text-muted-foreground">
            ✓{passCount} ⚠{warnCount} ✕{failCount}
          </span>
        </h3>
        <button onClick={clearImageValidation} className="p-0.5 text-muted-foreground/40 hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Results list */}
      <div className="max-h-[200px] space-y-1 overflow-y-auto p-2">
        {imageValidationResults.map((r, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${
              r.status === 'fail'
                ? 'bg-gaming-error/6'
                : r.status === 'warn'
                ? 'bg-gaming-warning/6'
                : 'bg-gaming-success/6'
            }`}
          >
            {r.status === 'pass' && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-gaming-success" />}
            {r.status === 'warn' && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-gaming-warning" />}
            {r.status === 'fail' && <XCircle className="h-3.5 w-3.5 shrink-0 text-gaming-error" />}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-medium text-foreground">{r.file}</p>
              {r.reason && (
                <p className={`text-[9px] ${
                  r.status === 'fail' ? 'text-gaming-error' : 'text-gaming-warning'
                }`}>
                  {r.reason}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer: format/size hints */}
      <div className="border-t border-border px-3 py-2">
        <p className="text-[9px] text-muted-foreground/55">
          支持格式: PNG, JPG, WebP, GIF · 最大 10MB · 推荐 1920×1080
        </p>
      </div>
    </div>
  );
}
