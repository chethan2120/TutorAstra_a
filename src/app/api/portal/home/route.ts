import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { currentUser, enrolmentBalance, listDirectory, sessionsFor } from '@/lib/portal';
import { getDb } from '@/lib/db';

export async function GET() {
  const session = getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  const me = currentUser(session);
  if (!me || me.is_active === 0) return NextResponse.json({ error: 'This account is not active.' }, { status: 403 });
  const sessions = sessionsFor(session) as any[];
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: me.timezone || 'Asia/Dubai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const todays = sessions.filter((item) => item.starts_at && new Intl.DateTimeFormat('en-CA', { timeZone: item.timezone || me.timezone || 'Asia/Dubai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(item.starts_at)) === today);
  const db = getDb();
  const enrolments = (session.role === 'admin' ? listDirectory().enrolments : db.prepare(`
    SELECT e.*, sub.name AS subject_name, sub.details AS subject_details, st.name AS student_name, te.name AS teacher_name
    FROM enrolments e
    JOIN subjects sub ON sub.id = e.subject_id
    JOIN users st ON st.id = e.student_id
    JOIN users te ON te.id = e.teacher_id
    WHERE ${session.role === 'teacher' ? 'e.teacher_id' : 'e.student_id'} = ?
  `).all(me.id).map((row: any) => ({ ...row, balance: enrolmentBalance(row.id) })));
  const punch = session.role === 'teacher' ? db.prepare('SELECT * FROM attendance_punches WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(me.id) : null;
  const latestAssessment = session.role === 'student'
    ? db.prepare('SELECT id, subject, score, max_score, status, submitted_at FROM assessments WHERE student_id = ? ORDER BY id DESC LIMIT 1').get(me.id)
    : null;
  const unread = db.prepare(`
    SELECT COUNT(*) AS count FROM messages m
    JOIN enrolments e ON e.id = m.enrolment_id
    WHERE m.sender_id != ?
      AND ((? = 'teacher' AND e.teacher_id = ?) OR (? = 'student' AND e.student_id = ?))
      AND NOT EXISTS (SELECT 1 FROM message_reads r WHERE r.message_id = m.id AND r.user_id = ?)
  `).get(me.id, session.role, me.id, session.role, me.id, me.id) as { count: number };
  return NextResponse.json({ me, sessions, todays, enrolments, unread: unread.count, punch, latestAssessment });
}
