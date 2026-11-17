import { NextResponse } from 'next/server';
import { denied, requireRole } from '@/lib/guard';
import { rescheduleSession, scheduleEnrolment } from '@/lib/portal';

export async function POST(request: Request) {
  const session = requireRole(['admin']);
  if (denied(session)) return session;
  try {
    const body = await request.json();
    if (body.sessionId) {
      rescheduleSession(session, {
        sessionId: Number(body.sessionId),
        date: String(body.date),
        time: String(body.time),
        timezone: String(body.timezone || 'Asia/Dubai'),
        reason: String(body.reason || ''),
      });
      return NextResponse.json({ ok: true });
    }
    const result = scheduleEnrolment(session, {
      enrolmentId: Number(body.enrolmentId),
      durationMinutes: Number(body.durationMinutes),
      startDate: String(body.startDate),
      timezone: String(body.timezone || 'Asia/Dubai'),
      notes: String(body.notes || ''),
      slots: Array.isArray(body.slots) ? body.slots.map((slot: { day: number; time: string }) => ({ day: Number(slot.day), time: String(slot.time) })) : [],
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not schedule.' }, { status: 400 });
  }
}
