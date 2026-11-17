import { createEnrolment, createPortalUser, activateAccount, scheduleEnrolment, requestLeave, joinWindow, postMessage, listMessages, startAssessment, submitAssessment, enrolmentBalance, sessionsFor } from '../src/lib/portal';
import { getDb } from '../src/lib/db';
import type { AdminSession } from '../src/lib/auth';

function session(email: string, role: string, name: string): AdminSession {
  return { email, role, name, exp: 0 };
}

async function main() {
  const admin = session('admin@gmail.com', 'admin', 'Super Admin');
  const stamp = Date.now();
  const student = createPortalUser(admin, { name: 'Portal Student', email: `student.${stamp}@example.com`, role: 'student', timezone: 'UTC' });
  const teacher = createPortalUser(admin, { name: 'Portal Teacher', email: `teacher.${stamp}@example.com`, role: 'teacher', timezone: 'UTC' });
  activateAccount(student.activationPath.split('token=')[1], 'portal-pass-1');
  const db = getDb();
  const subject = db.prepare(`SELECT id FROM subjects WHERE name = 'Science'`).get() as { id: number };
  const enrolment = createEnrolment(admin, { studentId: student.id, subjectId: subject.id, teacherId: teacher.id, totalClasses: 4 });
  const scheduled = scheduleEnrolment(admin, {
    enrolmentId: enrolment.id,
    durationMinutes: 60,
    startDate: '2026-11-18',
    timezone: 'UTC',
    slots: [{ day: 3, time: '17:00' }, { day: 5, time: '17:00' }, { day: 1, time: '17:00' }],
  });
  if (scheduled.created !== 4) throw new Error(`Expected 4 classes, got ${scheduled.created}`);
  let blocked = false;
  try {
    scheduleEnrolment(admin, { enrolmentId: enrolment.id, durationMinutes: 60, startDate: '2026-11-18', timezone: 'UTC', slots: [{ day: 1, time: '17:00' }] });
  } catch {
    blocked = true;
  }
  if (!blocked) throw new Error('A full enrolment accepted more classes.');
  const studentSession = session(`student.${stamp}@example.com`, 'student', 'Portal Student');
  const teacherSession = session(`teacher.${stamp}@example.com`, 'teacher', 'Portal Teacher');
  const rows = sessionsFor(studentSession) as { id: number }[];
  if (rows.length !== 4) throw new Error('Student cannot see the scheduled classes.');
  const teacherRows = sessionsFor(teacherSession) as { id: number }[];
  if (teacherRows.length !== 4) throw new Error('Teacher cannot see the same classes.');
  const outsider = createPortalUser(admin, { name: 'Other Student', email: `other.${stamp}@example.com`, role: 'student' });
  let hidden = false;
  try {
    joinWindow(session(`other.${stamp}@example.com`, 'student', 'Other Student'), rows[0].id);
  } catch {
    hidden = true;
  }
  if (!hidden) throw new Error('Another student could open the class.');
  const early = joinWindow(studentSession, rows[0].id);
  if (early.available || !early.message?.includes('15 minutes')) throw new Error('Join link was visible too early.');
  const messageId = postMessage(teacherSession, enrolment.id, 'Worksheet for Monday', { name: 'notes.pdf', type: 'application/pdf', buffer: Buffer.from('%PDF-1.4') });
  postMessage(studentSession, enrolment.id, 'I finished the first question.');
  const thread = listMessages(studentSession, enrolment.id);
  if (thread.length < 2) throw new Error('Teacher box did not keep both messages.');
  const leave = requestLeave(studentSession, rows[0].id, 'Family appointment');
  const balance = enrolmentBalance(enrolment.id);
  if (balance.leaveApproved !== 1 || balance.carriedForward !== 1) throw new Error(`Leave balance was wrong: ${JSON.stringify(balance)}`);
  let quota = false;
  const again = sessionsFor(studentSession) as { id: number; status: string }[];
  const next = again.find((item) => item.status === 'Scheduled');
  if (!next) throw new Error('No scheduled class remained for the quota check.');
  requestLeave(studentSession, next.id, 'Second leave this month');
  const third = (sessionsFor(studentSession) as { id: number; status: string }[]).find((item) => item.status === 'Scheduled');
  if (third) {
    try {
      requestLeave(studentSession, third.id, 'Third leave should fail');
    } catch (error) {
      quota = String(error instanceof Error ? error.message : error).includes('two approved');
    }
  }
  if (!quota) throw new Error('Monthly leave quota was not enforced.');
  const started = startAssessment(studentSession, 'Science', 'notes.txt', Buffer.from('Photosynthesis converts light into stored energy. Plants release oxygen during this process. The student should explain both ideas in class.'), 'text/plain');
  const submitted = submitAssessment(studentSession, started.id, started.questions.filter((item) => item.kind === 'mcq').map((item) => ({ questionId: item.id, answer: item.options?.[0] || '' })));
  if (typeof submitted.score !== 'number') throw new Error('Assessment did not save a score.');
  console.log(JSON.stringify({ scheduled: scheduled.created, leave, messageId, outsider: outsider.id, score: submitted.score, zoom: scheduled.zoom }));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
