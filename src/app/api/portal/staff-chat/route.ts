import { NextResponse } from 'next/server';
import { denied, requireRole } from '@/lib/guard';
import { postTeacherAdminMessage, punch, teacherAdminThread } from '@/lib/portal';

export async function GET(request: Request) {
  const session = requireRole(['teacher', 'admin']);
  if (denied(session)) return session;
  try {
    const teacherId = Number(new URL(request.url).searchParams.get('teacherId') || 0);
    return NextResponse.json({ messages: teacherAdminThread(session, teacherId || undefined) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load messages.' }, { status: 403 });
  }
}

export async function POST(request: Request) {
  const session = requireRole(['teacher', 'admin']);
  if (denied(session)) return session;
  try {
    const body = await request.json();
    if (body.action === 'in' || body.action === 'out') {
      punch(session, body.action);
      return NextResponse.json({ ok: true });
    }
    const id = postTeacherAdminMessage(session, String(body.body || ''), body.teacherId ? Number(body.teacherId) : undefined);
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not send.' }, { status: 400 });
  }
}
