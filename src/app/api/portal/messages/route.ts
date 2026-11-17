import { NextResponse } from 'next/server';
import { denied, requireRole } from '@/lib/guard';
import { listMessages, postMessage } from '@/lib/portal';

export async function GET(request: Request) {
  const session = requireRole(['admin', 'teacher', 'student']);
  if (denied(session)) return session;
  const enrolmentId = Number(new URL(request.url).searchParams.get('enrolmentId'));
  try {
    return NextResponse.json({ messages: listMessages(session, enrolmentId) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load messages.' }, { status: 403 });
  }
}

export async function POST(request: Request) {
  const session = requireRole(['admin', 'teacher', 'student']);
  if (denied(session)) return session;
  try {
    const form = await request.formData();
    const file = form.get('file');
    const saved = postMessage(
      session,
      Number(form.get('enrolmentId')),
      String(form.get('body') || ''),
      file instanceof File && file.size ? { name: file.name, type: file.type, buffer: Buffer.from(await file.arrayBuffer()) } : undefined
    );
    return NextResponse.json({ ok: true, id: saved });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not send the message.' }, { status: 400 });
  }
}
