import { NextResponse } from 'next/server';
import { denied, requireRole } from '@/lib/guard';
import { createEnrolment } from '@/lib/portal';

export async function POST(request: Request) {
  const session = requireRole(['admin']);
  if (denied(session)) return session;
  try {
    const body = await request.json();
    const created = createEnrolment(session, {
      studentId: Number(body.studentId),
      subjectId: Number(body.subjectId),
      teacherId: Number(body.teacherId),
      totalClasses: Number(body.totalClasses),
    });
    return NextResponse.json({ ok: true, ...created });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not enrol the student.' }, { status: 400 });
  }
}
