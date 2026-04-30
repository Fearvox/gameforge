import { NextRequest, NextResponse } from 'next/server';

/* ── A2 + D3: Backend file validation endpoint ──
 *
 * POST /api/assets/validate
 * Body: { files: { name: string; size: number; type: string }[] }
 * Returns: { results: { name: string; valid: boolean; error?: string }[] }
 *
 * D3: In production, this would verify a short-lived signed upload URL.
 * Here we validate size/type constraints server-side (backend half of A2 dual-validation).
 */

const MAX_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
const ALLOWED_EXTENSIONS = new Set([
  'mp4', 'mov', 'webm', 'avi',
  'jpg', 'jpeg', 'png', 'gif', 'webp',
  'mp3', 'wav', 'ogg', 'flac', 'aac',
]);

interface FileMeta {
  name: string;
  size: number;
  type: string;
}

interface ValidationResult {
  name: string;
  valid: boolean;
  error?: string;
}

function validateFile(file: FileMeta): ValidationResult {
  // D1: Sanitize filename for safe output
  const sanitizedName = file.name.replace(/[<>&"']/g, '');

  // Size check
  if (file.size > MAX_SIZE) {
    return {
      name: sanitizedName,
      valid: false,
      error: `文件大小 ${(file.size / 1073741824).toFixed(1)}GB 超过服务器 2GB 限制`,
    };
  }

  // Empty file check
  if (file.size === 0) {
    return { name: sanitizedName, valid: false, error: '文件为空' };
  }

  // Extension check (backend validation — A2 "前端+后端双校验")
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return {
      name: sanitizedName,
      valid: false,
      error: `服务器不支持 .${ext} 格式（仅允许 ${[...ALLOWED_EXTENSIONS].join(', ')}）`,
    };
  }

  // MIME type cross-check
  const mimeMap: Record<string, string[]> = {
    mp4: ['video/mp4'], mov: ['video/quicktime'], webm: ['video/webm'],
    jpg: ['image/jpeg'], jpeg: ['image/jpeg'], png: ['image/png'],
    gif: ['image/gif'], webp: ['image/webp'],
    mp3: ['audio/mpeg'], wav: ['audio/wav'], ogg: ['audio/ogg'],
  };
  const expectedMimes = mimeMap[ext];
  if (expectedMimes && file.type && !expectedMimes.includes(file.type)) {
    return {
      name: sanitizedName,
      valid: false,
      error: `MIME 类型 ${file.type} 与扩展名 .${ext} 不匹配`,
    };
  }

  return { name: sanitizedName, valid: true };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const files: FileMeta[] = body.files;

    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: '请提供文件列表' },
        { status: 400 },
      );
    }

    // D3: In production, verify auth token / signed URL here
    // Mock: 5% chance of simulated auth failure for B6 testing
    const authHeader = request.headers.get('authorization');
    if (authHeader === 'Bearer expired-token') {
      return NextResponse.json(
        { error: '会话已过期，请重新登录', code: 'SESSION_EXPIRED' },
        { status: 401 },
      );
    }

    const results = files.map(validateFile);
    return NextResponse.json({ results });
  } catch {
    // D5: Don't leak internal details
    return NextResponse.json(
      { error: '请求格式错误' },
      { status: 400 },
    );
  }
}
