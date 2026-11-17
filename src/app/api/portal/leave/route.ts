import { NextResponse } from 'next/server';
import { denied, requireRole } from '@/lib/guard';
import { requestLeave } from '@/lib/portal';

export async function POST(request: Request) {
  const session = requireRole(['student']);
  if (denied(session)) return session;
  try {
    const body = await request.json();
    const result = requestLeave(session, Number(body.sessionId), String(body.reason || ''));
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Leave was not approved.' }, { status: 400 });
  }
}
