import { NextResponse } from 'next/server';
import { denied, requireRole } from '@/lib/guard';
import { joinWindow } from '@/lib/portal';

export async function GET(request: Request) {
  const session = requireRole(['admin', 'teacher', 'student']);
  if (denied(session)) return session;
  const id = Number(new URL(request.url).searchParams.get('id'));
  try {
    return NextResponse.json(joinWindow(session, id));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not open the class.' }, { status: 403 });
  }
}
