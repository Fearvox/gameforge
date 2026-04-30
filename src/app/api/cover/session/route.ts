import { NextRequest, NextResponse } from 'next/server';

/* ── D2/D3: Mock session verification for /cover ──
 *
 * GET /api/cover/session
 * Returns: { valid: boolean; userId: string; projectId: string }
 *
 * D3: Simulates auth failure when Authorization header contains expired token.
 * In production, this would verify JWT/session against project ownership (D2).
 */

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    // D3: Simulate expired session
    if (authHeader === 'Bearer expired-token') {
      return NextResponse.json(
        { error: '会话已过期，请重新登录', code: 'SESSION_EXPIRED' },
        { status: 401 },
      );
    }

    // D3: Simulate permission denied
    if (authHeader === 'Bearer wrong-user') {
      return NextResponse.json(
        { error: '无权访问此项目', code: 'FORBIDDEN' },
        { status: 403 },
      );
    }

    // D4: Don't expose internal details
    return NextResponse.json({
      valid: true,
      userId: 'user-1',
      projectId: 'proj-cover-001',
    });
  } catch {
    // D5: Sanitized error response
    return NextResponse.json(
      { error: '请求格式错误' },
      { status: 400 },
    );
  }
}
