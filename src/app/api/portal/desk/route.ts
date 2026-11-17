import { NextResponse } from 'next/server';
import { denied, requireRole } from '@/lib/guard';
import { addSubject, alignEnrolment, calendarFor, cancelSession, deletePortalUser, listAttendance, listLeaves, listNotifications, markNotificationsRead, markSession, personPreview, postNotification, saveProfile, updatePortalUser } from '@/lib/portal';

export async function GET(request: Request) {
  const session = requireRole(['admin', 'teacher', 'student']);
  if (denied(session)) return session;
  const url = new URL(request.url);
  const kind = url.searchParams.get('kind');
  try {
    if (kind === 'calendar') return NextResponse.json(calendarFor(session, url.searchParams.get('userId') ? Number(url.searchParams.get('userId')) : undefined));
    if (kind === 'notifications') return NextResponse.json({ notifications: listNotifications(session) });
    if (kind === 'preview') {
      if (session.role !== 'admin') return NextResponse.json({ error: 'Only admin can open this record.' }, { status: 403 });
      return NextResponse.json(personPreview(Number(url.searchParams.get('userId'))));
    }
    if (kind === 'attendance') {
      if (session.role !== 'admin') return NextResponse.json({ error: 'Only admin can open every attendance record.' }, { status: 403 });
      return NextResponse.json(listAttendance());
    }
    if (kind === 'leave') {
      if (session.role !== 'admin') return NextResponse.json({ error: 'Only admin can open every leave.' }, { status: 403 });
      return NextResponse.json({ leaves: listLeaves() });
    }
    return NextResponse.json({ error: 'Unknown request.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load.' }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const session = requireRole(['admin', 'teacher', 'student']);
  if (denied(session)) return session;
  try {
    const body = await request.json();
    if (body.kind === 'subject') {
      if (session.role !== 'admin') return NextResponse.json({ error: 'Only admin can add a subject.' }, { status: 403 });
      return NextResponse.json(addSubject(session, String(body.name || ''), String(body.details || '')));
    }
    if (body.kind === 'user') {
      if (session.role !== 'admin') return NextResponse.json({ error: 'Only admin can edit accounts.' }, { status: 403 });
      updatePortalUser(session, Number(body.userId), { name: body.name, active: body.active, phone: body.phone });
      return NextResponse.json({ ok: true });
    }
    if (body.kind === 'delete-user') {
      if (session.role !== 'admin') return NextResponse.json({ error: 'Only admin can delete accounts.' }, { status: 403 });
      deletePortalUser(session, Number(body.userId));
      return NextResponse.json({ ok: true });
    }
    if (body.kind === 'align') {
      if (session.role !== 'admin') return NextResponse.json({ error: 'Only admin can update a course.' }, { status: 403 });
      alignEnrolment(session, { enrolmentId: Number(body.enrolmentId), totalClasses: Number(body.totalClasses), teacherId: Number(body.teacherId) });
      return NextResponse.json({ ok: true });
    }
    if (body.kind === 'attendance') {
      markSession(session, Number(body.sessionId), String(body.status || ''));
      return NextResponse.json({ ok: true });
    }
    if (body.kind === 'cancel') {
      if (session.role !== 'admin') return NextResponse.json({ error: 'Only admin can cancel a class.' }, { status: 403 });
      cancelSession(session, Number(body.sessionId), String(body.reason || ''));
      return NextResponse.json({ ok: true });
    }
    if (body.kind === 'notification') {
      if (session.role !== 'admin') return NextResponse.json({ error: 'Only admin can send a notification.' }, { status: 403 });
      return NextResponse.json(postNotification(session, String(body.title || ''), String(body.body || ''), String(body.audience || 'all')));
    }
    if (body.kind === 'read-notifications') {
      markNotificationsRead(session);
      return NextResponse.json({ ok: true });
    }
    if (body.kind === 'profile') {
      saveProfile(session, body);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'Unknown request.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not save.' }, { status: 400 });
  }
}
