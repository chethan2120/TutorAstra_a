import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getDb, hashPassword, logActivity } from '@/lib/db';
import type { AdminSession } from '@/lib/auth';

const ACTIVE = ['Scheduled', 'Rescheduled', 'Completed', 'No Show'];
const UPLOAD_DIR = path.join(process.cwd(), 'data', 'private-uploads');

export function queueEmail(recipient: string, subject: string, body: string, relatedType: string, relatedId: string) {
  const db = getDb();
  const configured = Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);
  db.prepare(`
    INSERT INTO email_log (recipient, subject, body, status, error, related_type, related_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    recipient,
    subject,
    body,
    configured ? 'queued' : 'not_configured',
    configured ? null : 'No SMTP_HOST or SMTP_FROM is configured. The class record was kept.',
    relatedType,
    relatedId
  );
}

function localToUtc(date: string, time: string, timeZone: string) {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  let utc = Date.UTC(year, month - 1, day, hour, minute);
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  for (let i = 0; i < 4; i += 1) {
    const parts = Object.fromEntries(fmt.formatToParts(new Date(utc)).map((part) => [part.type, part.value]));
    const seen = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute));
    const wanted = Date.UTC(year, month - 1, day, hour, minute);
    utc += wanted - seen;
  }
  return new Date(utc);
}

function overlaps(db: ReturnType<typeof getDb>, personColumn: 'teacher_id' | 'student_id', personId: number, start: string, end: string) {
  return db.prepare(`
    SELECT id FROM class_sessions
    WHERE ${personColumn} = ?
      AND status IN ('Scheduled', 'Rescheduled')
      AND starts_at IS NOT NULL
      AND starts_at < ?
      AND ends_at > ?
  `).get(personId, end, start) as { id: number } | undefined;
}

export function enrolmentBalance(enrolmentId: number) {
  const db = getDb();
  const enrolment = db.prepare('SELECT * FROM enrolments WHERE id = ?').get(enrolmentId) as { total_classes: number };
  const rows = db.prepare(`SELECT status, COUNT(*) AS count FROM class_sessions WHERE enrolment_id = ? GROUP BY status`).all(enrolmentId) as { status: string; count: number }[];
  const count = (status: string) => rows.find((row) => row.status === status)?.count || 0;
  const consumed = ACTIVE.reduce((sum, status) => sum + count(status), 0);
  return {
    total: enrolment.total_classes,
    scheduled: count('Scheduled') + count('Rescheduled'),
    completed: count('Completed'),
    cancelled: count('Cancelled'),
    leaveApproved: count('Leave Approved'),
    carriedForward: count('Credit'),
    remaining: enrolment.total_classes - consumed,
  };
}

export function createPortalUser(actor: AdminSession, input: { name: string; email: string; role: 'student' | 'teacher'; timezone?: string; phone?: string }) {
  const db = getDb();
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.');
  if (input.name.trim().length < 2) throw new Error('Enter the full name.');
  if (input.role !== 'student' && input.role !== 'teacher') throw new Error('Choose student or teacher.');
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) throw new Error('An account with this email already exists.');

  const temp = crypto.randomBytes(24).toString('hex');
  const info = db.prepare(`
    INSERT INTO users (email, password_hash, name, role, is_active, timezone, must_set_password, phone)
    VALUES (?, ?, ?, ?, 1, ?, 1, ?)
  `).run(email, hashPassword(temp), input.name.trim(), input.role, input.timezone || 'Asia/Dubai', String(input.phone || '').trim().slice(0, 24));
  const userId = Number(info.lastInsertRowid);
  const token = crypto.randomBytes(24).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO invite_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)').run(userId, tokenHash, expires);
  queueEmail(
    email,
    'Set your TutorAstra password',
    'Use the secure activation link from your TutorAstra administrator. This message does not contain a password.',
    'user',
    String(userId)
  );
  logActivity(actor.email, 'CREATE_USER', 'user', String(userId), `Created ${input.role} ${email}`);
  return { id: userId, email, activationPath: `/set-password?token=${token}` };
}

export function activateAccount(token: string, password: string) {
  if (password.length < 8) throw new Error('Use at least 8 characters.');
  const db = getDb();
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const row = db.prepare(`
    SELECT * FROM invite_tokens WHERE token_hash = ? AND used_at IS NULL
  `).get(tokenHash) as { id: number; user_id: number; expires_at: string } | undefined;
  if (!row || new Date(row.expires_at).getTime() < Date.now()) throw new Error('This activation link is no longer valid.');
  const user = db.prepare('SELECT email FROM users WHERE id = ?').get(row.user_id) as { email: string };
  const run = db.transaction(() => {
    db.prepare('UPDATE users SET password_hash = ?, must_set_password = 0 WHERE id = ?').run(hashPassword(password), row.user_id);
    db.prepare('UPDATE invite_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = ?').run(row.id);
  });
  run();
  return { email: user.email };
}

export function setUserActive(actor: AdminSession, userId: number, active: boolean) {
  const db = getDb();
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as { role: string } | undefined;
  if (!user || user.role === 'admin') throw new Error('That account cannot be changed here.');
  db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(active ? 1 : 0, userId);
  logActivity(actor.email, active ? 'ACTIVATE_USER' : 'DEACTIVATE_USER', 'user', String(userId), '');
}

export function createEnrolment(actor: AdminSession, input: { studentId: number; subjectId: number; teacherId: number; totalClasses: number }) {
  const db = getDb();
  if (!Number.isInteger(input.totalClasses) || input.totalClasses < 1 || input.totalClasses > 500) {
    throw new Error('Enter a class count between 1 and 500.');
  }
  const student = db.prepare(`SELECT id FROM users WHERE id = ? AND role = 'student' AND is_active = 1`).get(input.studentId);
  const teacher = db.prepare(`SELECT id FROM users WHERE id = ? AND role = 'teacher' AND is_active = 1`).get(input.teacherId);
  const subject = db.prepare('SELECT id, name FROM subjects WHERE id = ?').get(input.subjectId) as { id: number; name: string } | undefined;
  if (!student || !teacher || !subject) throw new Error('Choose an active student, teacher and subject.');
  const existing = db.prepare('SELECT id FROM enrolments WHERE student_id = ? AND subject_id = ?').get(input.studentId, input.subjectId);
  if (existing) throw new Error('This student is already enrolled in that subject.');
  const info = db.prepare(`
    INSERT INTO enrolments (student_id, subject_id, teacher_id, total_classes, status)
    VALUES (?, ?, ?, ?, 'active')
  `).run(input.studentId, input.subjectId, input.teacherId, input.totalClasses);
  logActivity(actor.email, 'CREATE_ENROLMENT', 'enrolment', String(info.lastInsertRowid), subject.name);
  return { id: Number(info.lastInsertRowid) };
}

type Slot = { day: number; time: string };

export function scheduleEnrolment(actor: AdminSession, input: {
  enrolmentId: number;
  durationMinutes: number;
  startDate: string;
  timezone: string;
  slots: Slot[];
  notes?: string;
}) {
  const db = getDb();
  if (![30, 45, 60, 90, 120].includes(input.durationMinutes)) throw new Error('Choose a class duration of 30, 45, 60, 90 or 120 minutes.');
  if (!input.slots.length) throw new Error('Add at least one weekly day and time.');
  try {
    Intl.DateTimeFormat('en-US', { timeZone: input.timezone }).format(new Date());
  } catch {
    throw new Error('Choose a valid timezone.');
  }
  const enrolment = db.prepare('SELECT * FROM enrolments WHERE id = ?').get(input.enrolmentId) as {
    id: number; student_id: number; teacher_id: number; subject_id: number; total_classes: number;
  } | undefined;
  if (!enrolment) throw new Error('Enrolment not found.');
  const balance = enrolmentBalance(enrolment.id);
  if (balance.remaining < 1) throw new Error('This enrolment has no remaining classes.');

  const credits = db.prepare(`
    SELECT id FROM class_sessions WHERE enrolment_id = ? AND status = 'Credit' ORDER BY id
  `).all(enrolment.id) as { id: number }[];
  const maxNumber = (db.prepare('SELECT COALESCE(MAX(session_number), 0) AS n FROM class_sessions WHERE enrolment_id = ?').get(enrolment.id) as { n: number }).n;
  const planned: { start: Date; end: Date; creditId?: number }[] = [];
  const cursor = new Date(`${input.startDate}T00:00:00Z`);
  if (Number.isNaN(cursor.getTime())) throw new Error('Choose a valid start date.');

  for (let day = 0; day < 800 && planned.length < balance.remaining; day += 1) {
    const probe = new Date(cursor.getTime() + day * 24 * 60 * 60 * 1000);
    const weekday = new Intl.DateTimeFormat('en-US', { timeZone: input.timezone, weekday: 'short' }).format(probe);
    const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const dow = map[weekday];
    const dateLabel = new Intl.DateTimeFormat('en-CA', { timeZone: input.timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(probe);
    for (const slot of input.slots) {
      if (planned.length >= balance.remaining) break;
      if (slot.day !== dow) continue;
      if (!/^\d{2}:\d{2}$/.test(slot.time)) throw new Error('Use times as HH:MM.');
      const start = localToUtc(dateLabel, slot.time, input.timezone);
      if (start.getTime() < Date.now() - 60 * 1000) continue;
      const end = new Date(start.getTime() + input.durationMinutes * 60 * 1000);
      const startIso = start.toISOString();
      const endIso = end.toISOString();
      if (planned.some((item) => item.start < end && item.end > start)) throw new Error('Two of the chosen weekly times overlap.');
      if (overlaps(db, 'teacher_id', enrolment.teacher_id, startIso, endIso) || overlaps(db, 'student_id', enrolment.student_id, startIso, endIso)) {
        throw new Error(`That time overlaps an existing class on ${dateLabel} at ${slot.time}.`);
      }
      const credit = credits[planned.length];
      planned.push({ start, end, creditId: credit?.id });
    }
  }
  if (!planned.length) throw new Error('No future classes matched those days.');

  const subject = db.prepare('SELECT name FROM subjects WHERE id = ?').get(enrolment.subject_id) as { name: string };
  const people = db.prepare(`
    SELECT s.email AS student_email, s.name AS student_name, t.email AS teacher_email, t.name AS teacher_name
    FROM users s, users t WHERE s.id = ? AND t.id = ?
  `).get(enrolment.student_id, enrolment.teacher_id) as { student_email: string; student_name: string; teacher_email: string; teacher_name: string };

  const save = db.transaction(() => {
    let number = maxNumber;
    planned.forEach((item, index) => {
      const credit = index < credits.length ? credits[index] : undefined;
      if (credit) {
        db.prepare(`
          UPDATE class_sessions
          SET starts_at = ?, ends_at = ?, timezone = ?, duration_minutes = ?, status = 'Scheduled', notes = ?
          WHERE id = ?
        `).run(item.start.toISOString(), item.end.toISOString(), input.timezone, input.durationMinutes, input.notes || '', credit.id);
        db.prepare(`
          INSERT INTO class_history (session_id, action, from_status, to_status, to_starts_at, reason, actor_email)
          VALUES (?, 'SCHEDULE_CREDIT', 'Credit', 'Scheduled', ?, ?, ?)
        `).run(credit.id, item.start.toISOString(), input.notes || '', actor.email);
      } else {
        number += 1;
        const info = db.prepare(`
          INSERT INTO class_sessions (
            enrolment_id, student_id, teacher_id, subject_id, session_number,
            starts_at, ends_at, timezone, duration_minutes, status, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Scheduled', ?)
        `).run(
          enrolment.id, enrolment.student_id, enrolment.teacher_id, enrolment.subject_id, number,
          item.start.toISOString(), item.end.toISOString(), input.timezone, input.durationMinutes, input.notes || ''
        );
        db.prepare(`
          INSERT INTO class_history (session_id, action, to_status, to_starts_at, reason, actor_email)
          VALUES (?, 'SCHEDULE', 'Scheduled', ?, ?, ?)
        `).run(info.lastInsertRowid, item.start.toISOString(), input.notes || '', actor.email);
      }
    });
  });
  save();

  const summary = `${planned.length} ${subject.name} classes were scheduled for ${people.student_name} with ${people.teacher_name}. Timezone: ${input.timezone}.`;
  queueEmail(people.student_email, 'Your TutorAstra classes are scheduled', summary, 'enrolment', String(enrolment.id));
  queueEmail(people.teacher_email, 'New TutorAstra classes on your schedule', summary, 'enrolment', String(enrolment.id));
  logActivity(actor.email, 'SCHEDULE_CLASSES', 'enrolment', String(enrolment.id), summary);
  return { created: planned.length, zoom: 'not_configured' as const, emailStatus: process.env.SMTP_HOST && process.env.SMTP_FROM ? 'queued' as const : 'not_configured' as const };
}

export function rescheduleSession(actor: AdminSession, input: { sessionId: number; date: string; time: string; timezone: string; reason: string }) {
  const db = getDb();
  if (input.reason.trim().length < 3) throw new Error('Add a reason for the change.');
  const session = db.prepare('SELECT * FROM class_sessions WHERE id = ?').get(input.sessionId) as {
    id: number; status: string; starts_at: string; student_id: number; teacher_id: number; timezone: string; duration_minutes: number; enrolment_id: number;
  } | undefined;
  if (!session || !['Scheduled', 'Rescheduled'].includes(session.status)) throw new Error('Only a scheduled class can be moved.');
  const start = localToUtc(input.date, input.time, input.timezone);
  const end = new Date(start.getTime() + session.duration_minutes * 60 * 1000);
  const startIso = start.toISOString();
  const endIso = end.toISOString();
  const teacherHit = overlaps(db, 'teacher_id', session.teacher_id, startIso, endIso);
  const studentHit = overlaps(db, 'student_id', session.student_id, startIso, endIso);
  if ((teacherHit && teacherHit.id !== session.id) || (studentHit && studentHit.id !== session.id)) {
    throw new Error('The new time overlaps another class.');
  }
  const run = db.transaction(() => {
    db.prepare(`UPDATE class_sessions SET starts_at = ?, ends_at = ?, timezone = ?, status = 'Rescheduled' WHERE id = ?`).run(startIso, endIso, input.timezone, session.id);
    db.prepare(`
      INSERT INTO class_history (session_id, action, from_status, to_status, from_starts_at, to_starts_at, reason, actor_email)
      VALUES (?, 'RESCHEDULE', ?, 'Rescheduled', ?, ?, ?, ?)
    `).run(session.id, session.status, session.starts_at, startIso, input.reason.trim(), actor.email);
  });
  run();
  const people = db.prepare(`SELECT email, name, role FROM users WHERE id IN (?, ?)`).all(session.student_id, session.teacher_id) as { email: string; name: string }[];
  people.forEach((person) => {
    queueEmail(person.email, 'A TutorAstra class was rescheduled', `${input.reason.trim()} New time: ${startIso} (${input.timezone}).`, 'session', String(session.id));
  });
  logActivity(actor.email, 'RESCHEDULE', 'session', String(session.id), input.reason.trim());
}

export function canSeeEnrolment(session: AdminSession, enrolment: { student_id: number; teacher_id: number }) {
  if (session.role === 'admin') return true;
  const db = getDb();
  const me = db.prepare('SELECT id FROM users WHERE email = ?').get(session.email) as { id: number } | undefined;
  if (!me) return false;
  if (session.role === 'teacher') return me.id === enrolment.teacher_id;
  if (session.role === 'student') return me.id === enrolment.student_id;
  return false;
}

export function currentUser(session: AdminSession) {
  const db = getDb();
  return db.prepare('SELECT id, email, name, role, timezone, is_active, avatar, access_json FROM users WHERE email = ?').get(session.email) as {
    id: number; email: string; name: string; role: string; timezone: string; is_active: number; avatar: string | null; access_json: string | null;
  };
}

export function listDirectory() {
  const db = getDb();
  return {
    students: db.prepare(`SELECT id, name, email, phone, role, is_active, timezone FROM users WHERE role = 'student' ORDER BY name`).all(),
    teachers: db.prepare(`SELECT id, name, email, phone, role, is_active, timezone FROM users WHERE role = 'teacher' ORDER BY name`).all(),
    subjects: db.prepare('SELECT id, name, details FROM subjects ORDER BY name').all(),
    enrolments: db.prepare(`
      SELECT e.id, e.total_classes, e.status, s.name AS student_name, s.email AS student_email,
             t.name AS teacher_name, sub.name AS subject_name, e.student_id, e.teacher_id, e.subject_id
      FROM enrolments e
      JOIN users s ON s.id = e.student_id
      JOIN users t ON t.id = e.teacher_id
      JOIN subjects sub ON sub.id = e.subject_id
      ORDER BY e.id DESC
    `).all().map((row: any) => ({ ...row, balance: enrolmentBalance(row.id) })),
  };
}

export function sessionsFor(session: AdminSession, enrolmentId?: number) {
  const db = getDb();
  const me = currentUser(session);
  let sql = `
    SELECT c.*, sub.name AS subject_name, st.name AS student_name, te.name AS teacher_name
    FROM class_sessions c
    JOIN subjects sub ON sub.id = c.subject_id
    JOIN users st ON st.id = c.student_id
    JOIN users te ON te.id = c.teacher_id
    WHERE 1 = 1
  `;
  const params: unknown[] = [];
  if (session.role === 'student') {
    sql += ' AND c.student_id = ?';
    params.push(me.id);
  } else if (session.role === 'teacher') {
    sql += ' AND c.teacher_id = ?';
    params.push(me.id);
  }
  if (enrolmentId) {
    sql += ' AND c.enrolment_id = ?';
    params.push(enrolmentId);
  }
  sql += ' ORDER BY COALESCE(c.starts_at, c.created_at), c.session_number';
  return db.prepare(sql).all(...params);
}

export function joinWindow(session: AdminSession, sessionId: number) {
  const db = getDb();
  const me = currentUser(session);
  const row = db.prepare('SELECT * FROM class_sessions WHERE id = ?').get(sessionId) as {
    id: number; student_id: number; teacher_id: number; starts_at: string | null; ends_at: string | null; zoom_join_url: string | null; zoom_start_url: string | null; status: string;
  } | undefined;
  if (!row) throw new Error('Class not found.');
  const allowed = session.role === 'admin' || (session.role === 'teacher' && me.id === row.teacher_id) || (session.role === 'student' && me.id === row.student_id);
  if (!allowed) throw new Error('You cannot join this class.');
  if (!row.starts_at || !['Scheduled', 'Rescheduled'].includes(row.status)) {
    return { available: false, message: 'This class is not scheduled.' };
  }
  const start = new Date(row.starts_at).getTime();
  const end = new Date(row.ends_at || row.starts_at).getTime();
  if (Date.now() < start - 15 * 60 * 1000) {
    return { available: false, message: 'Your meeting link will be available 15 minutes before class.' };
  }
  if (Date.now() > end + 30 * 60 * 1000) {
    return { available: false, message: 'This class window has closed.' };
  }
  const url = session.role === 'teacher' ? row.zoom_start_url || row.zoom_join_url : row.zoom_join_url;
  if (!url) {
    return { available: false, message: 'Zoom is not connected for this class yet. The schedule itself is saved.' };
  }
  return { available: true, url };
}

export function postMessage(session: AdminSession, enrolmentId: number, body: string, file?: { name: string; type: string; buffer: Buffer }) {
  const db = getDb();
  const me = currentUser(session);
  const enrolment = db.prepare('SELECT * FROM enrolments WHERE id = ?').get(enrolmentId) as { id: number; student_id: number; teacher_id: number };
  if (!enrolment || !canSeeEnrolment(session, enrolment)) throw new Error('You cannot use this conversation.');
  const text = body.trim();
  if (!text && !file) throw new Error('Write a message or attach a file.');
  if (file) {
    const limits: Record<string, number> = {
      'application/pdf': 8 * 1024 * 1024,
      'image/jpeg': 8 * 1024 * 1024,
      'image/png': 8 * 1024 * 1024,
      'image/webp': 8 * 1024 * 1024,
      'audio/webm': 15 * 1024 * 1024,
      'audio/mpeg': 15 * 1024 * 1024,
      'audio/mp4': 15 * 1024 * 1024,
      'audio/wav': 15 * 1024 * 1024,
      'video/mp4': 25 * 1024 * 1024,
      'video/webm': 25 * 1024 * 1024,
    };
    if (!limits[file.type] || file.buffer.length > limits[file.type]) {
      throw new Error('Attach a PDF, image, voice note or video within the size limit.');
    }
  }
  const save = db.transaction(() => {
    const info = db.prepare('INSERT INTO messages (enrolment_id, sender_id, body) VALUES (?, ?, ?)').run(enrolmentId, me.id, text);
    const messageId = Number(info.lastInsertRowid);
    db.prepare('INSERT INTO message_reads (message_id, user_id) VALUES (?, ?)').run(messageId, me.id);
    if (file) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      const stored = `${messageId}-${crypto.randomBytes(6).toString('hex')}`;
      fs.writeFileSync(path.join(UPLOAD_DIR, stored), file.buffer);
      db.prepare(`
        INSERT INTO message_attachments (message_id, filename, mime, size, storage_path)
        VALUES (?, ?, ?, ?, ?)
      `).run(messageId, file.name.replace(/[^\w.\- ]/g, ''), file.type, file.buffer.length, stored);
    }
    return messageId;
  });
  return save();
}

export function listMessages(session: AdminSession, enrolmentId: number) {
  const db = getDb();
  const me = currentUser(session);
  const enrolment = db.prepare('SELECT * FROM enrolments WHERE id = ?').get(enrolmentId) as { student_id: number; teacher_id: number };
  if (!enrolment || !canSeeEnrolment(session, enrolment)) throw new Error('You cannot view this conversation.');
  const messages = db.prepare(`
    SELECT m.id, m.body, m.created_at, m.sender_id, u.name AS sender_name
    FROM messages m JOIN users u ON u.id = m.sender_id
    WHERE m.enrolment_id = ?
    ORDER BY m.id DESC LIMIT 400
  `).all(enrolmentId) as { id: number; body: string; created_at: string; sender_id: number; sender_name: string }[];
  messages.forEach((message) => {
    db.prepare('INSERT OR IGNORE INTO message_reads (message_id, user_id) VALUES (?, ?)').run(message.id, me.id);
  });
  return messages.reverse().map((message) => ({
    ...message,
    attachments: db.prepare('SELECT id, filename, mime, size FROM message_attachments WHERE message_id = ?').all(message.id),
  }));
}

export function readAttachment(session: AdminSession, attachmentId: number) {
  const db = getDb();
  const row = db.prepare(`
    SELECT a.*, m.enrolment_id FROM message_attachments a
    JOIN messages m ON m.id = a.message_id WHERE a.id = ?
  `).get(attachmentId) as { storage_path: string; mime: string; filename: string; enrolment_id: number } | undefined;
  if (!row) throw new Error('File not found.');
  const enrolment = db.prepare('SELECT * FROM enrolments WHERE id = ?').get(row.enrolment_id) as { student_id: number; teacher_id: number };
  if (!canSeeEnrolment(session, enrolment)) throw new Error('You cannot open this file.');
  const full = path.join(UPLOAD_DIR, row.storage_path);
  return { buffer: fs.readFileSync(full), mime: row.mime, filename: row.filename };
}

export function requestLeave(session: AdminSession, sessionId: number, reason: string) {
  if (session.role !== 'student') throw new Error('Only a student can request leave.');
  if (reason.trim().length < 3) throw new Error('Add a short reason.');
  const db = getDb();
  const me = currentUser(session);
  const cls = db.prepare('SELECT * FROM class_sessions WHERE id = ?').get(sessionId) as {
    id: number; student_id: number; teacher_id: number; subject_id: number; enrolment_id: number; starts_at: string; status: string; session_number: number; timezone: string; duration_minutes: number;
  };
  if (!cls || cls.student_id !== me.id) throw new Error('That class is not yours.');
  if (!['Scheduled', 'Rescheduled'].includes(cls.status) || !cls.starts_at) throw new Error('This class cannot take a leave request.');
  const start = new Date(cls.starts_at).getTime();
  if (start - Date.now() < 12 * 60 * 60 * 1000) throw new Error('Leave must be requested at least 12 hours before the class.');
  const month = new Intl.DateTimeFormat('en-CA', { timeZone: cls.timezone || 'Asia/Dubai', year: 'numeric', month: '2-digit' }).format(new Date(cls.starts_at));
  const prior = db.prepare(`
    SELECT l.id, c.starts_at, c.timezone FROM leave_requests l
    JOIN class_sessions c ON c.id = l.session_id
    WHERE l.student_id = ? AND l.subject_id = ? AND l.status = 'Leave Approved'
  `).all(me.id, cls.subject_id) as { starts_at: string; timezone: string }[];
  const used = prior.filter((item) => new Intl.DateTimeFormat('en-CA', { timeZone: item.timezone || 'Asia/Dubai', year: 'numeric', month: '2-digit' }).format(new Date(item.starts_at)) === month).length;
  if (used >= 2) throw new Error('This subject already has two approved leave requests this month.');

  const nextNumber = (db.prepare('SELECT COALESCE(MAX(session_number), 0) AS n FROM class_sessions WHERE enrolment_id = ?').get(cls.enrolment_id) as { n: number }).n + 1;
  const run = db.transaction(() => {
    db.prepare(`UPDATE class_sessions SET status = 'Leave Approved' WHERE id = ?`).run(cls.id);
    const replacement = db.prepare(`
      INSERT INTO class_sessions (
        enrolment_id, student_id, teacher_id, subject_id, session_number, timezone, duration_minutes, status, notes, replacement_for
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Credit', ?, ?)
    `).run(cls.enrolment_id, cls.student_id, cls.teacher_id, cls.subject_id, nextNumber, cls.timezone, cls.duration_minutes, `Replacement for session ${cls.session_number}`, cls.id);
    const leave = db.prepare(`
      INSERT INTO leave_requests (session_id, student_id, subject_id, reason, status, replacement_session_id)
      VALUES (?, ?, ?, ?, 'Leave Approved', ?)
    `).run(cls.id, me.id, cls.subject_id, reason.trim(), replacement.lastInsertRowid);
    db.prepare(`
      INSERT INTO class_history (session_id, action, from_status, to_status, reason, actor_email)
      VALUES (?, 'LEAVE', ?, 'Leave Approved', ?, ?)
    `).run(cls.id, cls.status, reason.trim(), me.email);
    db.prepare('INSERT INTO messages (enrolment_id, sender_id, body) VALUES (?, ?, ?)').run(
      cls.enrolment_id,
      me.id,
      `Leave approved for session ${cls.session_number}. Reason: ${reason.trim()}`
    );
    return { leaveId: Number(leave.lastInsertRowid), replacementId: Number(replacement.lastInsertRowid) };
  });
  const result = run();
  const teacher = db.prepare('SELECT email FROM users WHERE id = ?').get(cls.teacher_id) as { email: string };
  queueEmail(teacher.email, 'A student leave was approved', reason.trim(), 'leave', String(result.leaveId));
  queueEmail(me.email, 'Your TutorAstra leave was approved', 'One replacement credit was added. It is not a second copy of the original class.', 'leave', String(result.leaveId));
  return result;
}

function questionsFrom(text: string) {
  const sentences = text.replace(/\s+/g, ' ').split(/(?<=[.?!])\s/).map((line) => line.trim()).filter((line) => line.length > 40).slice(0, 4);
  if (sentences.length < 2) throw new Error('The file did not contain enough readable study material.');
  return [
    ...sentences.slice(0, 3).map((sentence, index) => ({
      kind: 'mcq',
      prompt: `Which statement matches your uploaded notes?`,
      options: [sentence, sentences[(index + 1) % sentences.length], 'This statement is not in the uploaded material.'],
      answer: sentence,
      explanation: 'The correct option is taken from the file you uploaded.',
    })),
    {
      kind: 'written',
      prompt: `Explain this idea from your notes in your own words: ${sentences[0].slice(0, 180)}`,
      options: null as string[] | null,
      answer: '',
      explanation: 'Written answers are saved for the teacher. They are not marked as a final grade by this page.',
    },
  ];
}

export function startAssessment(session: AdminSession, subject: string, filename: string, buffer: Buffer, mime: string) {
  if (session.role !== 'student') throw new Error('Only a student can start an assessment.');
  const db = getDb();
  const me = currentUser(session);
  if (mime !== 'application/pdf' && mime !== 'text/plain') throw new Error('Upload a PDF of up to 3 pages. A clear image is listed, but image reading is not connected yet.');
  const raw = buffer.toString('latin1');
  const pages = raw.match(/\/Type\s*\/Page\b/g);
  if (mime === 'application/pdf' && pages && pages.length > 3) throw new Error('Upload no more than three pages.');
  const text = mime === 'text/plain' ? buffer.toString('utf8') : raw.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ');
  const built = questionsFrom(text);
  const started = new Date();
  const deadline = new Date(started.getTime() + 20 * 60 * 1000);
  const save = db.transaction(() => {
    const info = db.prepare(`
      INSERT INTO assessments (student_id, subject, material_text, started_at, deadline_at, max_score, status)
      VALUES (?, ?, ?, ?, ?, ?, 'in_progress')
    `).run(me.id, subject, text.slice(0, 8000), started.toISOString(), deadline.toISOString(), 3);
    const assessmentId = Number(info.lastInsertRowid);
    const insert = db.prepare(`
      INSERT INTO assessment_questions (assessment_id, kind, prompt, options_json, answer, explanation)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    built.forEach((question) => {
      insert.run(assessmentId, question.kind, question.prompt, question.options ? JSON.stringify(question.options) : null, question.answer, question.explanation);
    });
    return assessmentId;
  });
  const id = save();
  return { id, deadline: deadline.toISOString(), questions: getAssessment(session, id).questions };
}

export function getAssessment(session: AdminSession, id: number) {
  const db = getDb();
  const me = currentUser(session);
  const assessment = db.prepare('SELECT * FROM assessments WHERE id = ?').get(id) as { id: number; student_id: number; status: string; deadline_at: string; subject: string; score: number | null; max_score: number };
  if (!assessment) throw new Error('Assessment not found.');
  if (session.role === 'student' && assessment.student_id !== me.id) throw new Error('This assessment is not yours.');
  if (session.role === 'teacher') {
    const linked = db.prepare('SELECT id FROM enrolments WHERE student_id = ? AND teacher_id = ?').get(assessment.student_id, me.id);
    if (!linked) throw new Error('This student is not assigned to you.');
  }
  const questions = db.prepare('SELECT id, kind, prompt, options_json, explanation, answer FROM assessment_questions WHERE assessment_id = ?').all(id) as any[];
  return {
    ...assessment,
    questions: questions.map((question) => ({
      id: question.id,
      kind: question.kind,
      prompt: question.prompt,
      options: question.options_json ? JSON.parse(question.options_json) : null,
      explanation: assessment.status === 'submitted' ? question.explanation : undefined,
      answer: assessment.status === 'submitted' && question.kind === 'mcq' ? question.answer : undefined,
    })),
  };
}

export function submitAssessment(session: AdminSession, id: number, answers: { questionId: number; answer: string }[]) {
  if (session.role !== 'student') throw new Error('Only the student can submit.');
  const db = getDb();
  const me = currentUser(session);
  const assessment = db.prepare('SELECT * FROM assessments WHERE id = ?').get(id) as { id: number; student_id: number; status: string; deadline_at: string; subject: string };
  if (!assessment || assessment.student_id !== me.id) throw new Error('This assessment is not yours.');
  if (assessment.status === 'submitted') throw new Error('This assessment is already submitted.');
  if (Date.now() > new Date(assessment.deadline_at).getTime() + 5000) {
    // still accept the saved answers once, then close
  }
  const questions = db.prepare('SELECT * FROM assessment_questions WHERE assessment_id = ?').all(id) as { id: number; kind: string; answer: string }[];
  let score = 0;
  const run = db.transaction(() => {
    questions.forEach((question) => {
      const given = answers.find((item) => item.questionId === question.id)?.answer || '';
      const awarded = question.kind === 'mcq' && given === question.answer ? 1 : 0;
      if (question.kind === 'mcq') score += awarded;
      db.prepare(`
        INSERT INTO assessment_answers (assessment_id, question_id, answer, awarded, feedback)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, question.id, given, awarded, question.kind === 'written' ? 'Saved for the teacher. This is not an automatic grade.' : awarded ? 'Matches the uploaded notes.' : 'Does not match the uploaded notes.');
    });
    db.prepare(`UPDATE assessments SET status = 'submitted', submitted_at = ?, score = ? WHERE id = ?`).run(new Date().toISOString(), score, id);
  });
  run();
  const link = db.prepare(`
    SELECT e.id, t.email FROM enrolments e JOIN users t ON t.id = e.teacher_id
    JOIN subjects s ON s.id = e.subject_id
    WHERE e.student_id = ? AND s.name = ? LIMIT 1
  `).get(me.id, assessment.subject) as { id: number; email: string } | undefined;
  queueEmail(me.email, 'Your TutorAstra assessment was saved', `Score for the checked questions: ${score} of 3. Written answers wait for the teacher.`, 'assessment', String(id));
  if (link) {
    queueEmail(link.email, 'A student submitted an assessment', `${me.name} submitted ${assessment.subject}. Score ${score} of 3.`, 'assessment', String(id));
    db.prepare('INSERT INTO messages (enrolment_id, sender_id, body) VALUES (?, ?, ?)').run(
      link.id,
      me.id,
      `Assessment submitted for ${assessment.subject}. Checked score ${score} of 3. Written answers are saved for review.`
    );
  }
  return { score, maxScore: 3 };
}

export function teacherAdminThread(session: AdminSession, teacherId?: number) {
  const db = getDb();
  const me = currentUser(session);
  if (session.role === 'student') throw new Error('Students can message only their teacher.');
  if (session.role === 'teacher') {
    return db.prepare(`
      SELECT m.id, m.body, m.created_at, m.sender_id, u.name AS sender_name
      FROM staff_messages m JOIN users u ON u.id = m.sender_id
      WHERE m.sender_id = ? OR m.recipient_id = ?
      ORDER BY m.id ASC LIMIT 400
    `).all(me.id, me.id);
  }
  if (teacherId) {
    return db.prepare(`
      SELECT m.id, m.body, m.created_at, m.sender_id, u.name AS sender_name
      FROM staff_messages m JOIN users u ON u.id = m.sender_id
      WHERE m.sender_id = ? OR m.recipient_id = ?
      ORDER BY m.id ASC LIMIT 400
    `).all(teacherId, teacherId);
  }
  return db.prepare(`
    SELECT m.id, m.body, m.created_at, m.sender_id, m.recipient_id, u.name AS sender_name
    FROM staff_messages m JOIN users u ON u.id = m.sender_id
    ORDER BY m.id ASC LIMIT 400
  `).all();
}

export function postTeacherAdminMessage(session: AdminSession, body: string, teacherId?: number, file?: { name: string; type: string; buffer: Buffer }) {
  const db = getDb();
  const me = currentUser(session);
  if (session.role === 'student') throw new Error('Students can message only their teacher.');
  const text = body.trim();
  if (!text && !file) throw new Error('Write a message or attach a file.');
  let recipient: number | null = null;
  if (session.role === 'teacher') {
    const admin = db.prepare(`SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1`).get() as { id: number } | undefined;
    if (!admin) throw new Error('No admin account is available.');
    recipient = admin.id;
  } else if (teacherId) {
    const teacher = db.prepare(`SELECT id FROM users WHERE id = ? AND role = 'teacher'`).get(teacherId);
    if (!teacher) throw new Error('Choose a teacher.');
    recipient = teacherId;
  }
  const save = db.transaction(() => {
    const info = db.prepare('INSERT INTO staff_messages (sender_id, recipient_id, body) VALUES (?, ?, ?)').run(me.id, recipient, text);
    return Number(info.lastInsertRowid);
  });
  return save();
}

export function punch(session: AdminSession, action: 'in' | 'out') {
  if (session.role !== 'teacher') throw new Error('Only a teacher punches attendance here.');
  const db = getDb();
  const me = currentUser(session);
  const open = db.prepare('SELECT * FROM attendance_punches WHERE user_id = ? AND punched_out_at IS NULL ORDER BY id DESC LIMIT 1').get(me.id) as { id: number; punched_in_at: string } | undefined;
  if (action === 'in') {
    if (open) throw new Error('You are already punched in.');
    db.prepare('INSERT INTO attendance_punches (user_id, punched_in_at) VALUES (?, ?)').run(me.id, new Date().toISOString());
  } else {
    if (!open) throw new Error('Punch in before punching out.');
    db.prepare('UPDATE attendance_punches SET punched_out_at = ? WHERE id = ?').run(new Date().toISOString(), open.id);
  }
}

export function punchState(userId: number) {
  const db = getDb();
  return db.prepare('SELECT * FROM attendance_punches WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(userId) as { punched_in_at: string; punched_out_at: string | null } | undefined;
}

export function updatePortalUser(actor: AdminSession, userId: number, input: { name?: string; active?: boolean; phone?: string }) {
  const db = getDb();
  const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(userId) as { id: number; role: string } | undefined;
  if (!user || user.role === 'admin') throw new Error('That account cannot be changed here.');
  if (input.name && input.name.trim()) db.prepare('UPDATE users SET name = ? WHERE id = ?').run(input.name.trim(), userId);
  if (typeof input.phone === 'string') db.prepare('UPDATE users SET phone = ? WHERE id = ?').run(input.phone.trim().slice(0, 24), userId);
  if (typeof input.active === 'boolean') setUserActive(actor, userId, input.active);
}

export function deletePortalUser(actor: AdminSession, userId: number) {
  const db = getDb();
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as { role: string } | undefined;
  if (!user || user.role === 'admin') throw new Error('That account cannot be deleted.');
  const classes = db.prepare('SELECT id FROM class_sessions WHERE student_id = ? OR teacher_id = ? LIMIT 1').get(userId, userId);
  if (classes) throw new Error('This person already has classes. Deactivate the account so the history stays.');
  db.prepare('DELETE FROM enrolments WHERE student_id = ? OR teacher_id = ?').run(userId, userId);
  db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  logActivity(actor.email, 'DELETE_USER', 'user', String(userId), '');
}

export function addSubject(actor: AdminSession, name: string, details = '') {
  const db = getDb();
  const clean = name.trim();
  if (clean.length < 2) throw new Error('Enter a subject name.');
  const existing = db.prepare('SELECT id FROM subjects WHERE lower(name) = lower(?)').get(clean);
  if (existing) throw new Error('That subject is already on the list.');
  const info = db.prepare('INSERT INTO subjects (name, details) VALUES (?, ?)').run(clean, details.trim().slice(0, 500));
  logActivity(actor.email, 'ADD_SUBJECT', 'subject', String(info.lastInsertRowid), clean);
  return { id: Number(info.lastInsertRowid), name: clean };
}

export function alignEnrolment(actor: AdminSession, input: { enrolmentId: number; totalClasses: number; teacherId: number }) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM enrolments WHERE id = ?').get(input.enrolmentId) as { id: number; total_classes: number } | undefined;
  if (!row) throw new Error('Enrolment not found.');
  const teacher = db.prepare(`SELECT id FROM users WHERE id = ? AND role = 'teacher'`).get(input.teacherId);
  if (!teacher) throw new Error('Select a teacher.');
  if (!Number.isInteger(input.totalClasses) || input.totalClasses < 1 || input.totalClasses > 200) throw new Error('Enter between 1 and 200 classes.');
  const used = row.total_classes - enrolmentBalance(row.id).remaining;
  if (input.totalClasses < used) throw new Error(`This course already has ${used} classes placed. Use at least ${used}.`);
  db.prepare('UPDATE enrolments SET total_classes = ?, teacher_id = ? WHERE id = ?').run(input.totalClasses, input.teacherId, row.id);
  db.prepare(`UPDATE class_sessions SET teacher_id = ? WHERE enrolment_id = ? AND status IN ('Scheduled', 'Rescheduled', 'Credit')`).run(input.teacherId, row.id);
  logActivity(actor.email, 'ALIGN_ENROLMENT', 'enrolment', String(row.id), `total ${input.totalClasses}`);
}

export function personPreview(userId: number) {
  const db = getDb();
  const person = db.prepare(`SELECT id, name, email, role, phone, is_active, timezone FROM users WHERE id = ? AND role != 'admin'`).get(userId);
  if (!person) throw new Error('Person not found.');
  const subjects = db.prepare(`
    SELECT DISTINCT sub.id, sub.name, sub.details
    FROM enrolments e JOIN subjects sub ON sub.id = e.subject_id
    WHERE e.student_id = ? OR e.teacher_id = ?
    ORDER BY sub.name
  `).all(userId, userId);
  const sessions = db.prepare(`
    SELECT c.id, c.starts_at, c.ends_at, c.status, c.duration_minutes, c.session_number,
           sub.name AS subject_name, st.name AS student_name, te.name AS teacher_name
    FROM class_sessions c
    JOIN subjects sub ON sub.id = c.subject_id
    JOIN users st ON st.id = c.student_id
    JOIN users te ON te.id = c.teacher_id
    WHERE c.student_id = ? OR c.teacher_id = ?
    ORDER BY COALESCE(c.starts_at, c.created_at) DESC
    LIMIT 40
  `).all(userId, userId);
  return { person, subjects, sessions };
}

export function listAttendance() {
  const db = getDb();
  const sessions = db.prepare(`
    SELECT c.id, c.starts_at, c.ends_at, c.status, c.duration_minutes, c.session_number,
           sub.name AS subject_name, st.name AS student_name, st.id AS student_id,
           te.name AS teacher_name, te.id AS teacher_id
    FROM class_sessions c
    JOIN subjects sub ON sub.id = c.subject_id
    JOIN users st ON st.id = c.student_id
    JOIN users te ON te.id = c.teacher_id
    ORDER BY COALESCE(c.starts_at, c.created_at) DESC
    LIMIT 300
  `).all();
  const punches = db.prepare(`
    SELECT p.id, p.punched_in_at, p.punched_out_at, u.name, u.id AS user_id
    FROM attendance_punches p JOIN users u ON u.id = p.user_id
    ORDER BY p.id DESC LIMIT 40
  `).all();
  return { sessions, punches };
}

export function markSession(actor: AdminSession, sessionId: number, status: string) {
  if (!['Completed', 'No Show'].includes(status)) throw new Error('Mark the class as Completed or No Show.');
  const db = getDb();
  const me = currentUser(actor);
  const row = db.prepare('SELECT * FROM class_sessions WHERE id = ?').get(sessionId) as { id: number; status: string; teacher_id: number; starts_at: string } | undefined;
  if (!row || !['Scheduled', 'Rescheduled'].includes(row.status)) throw new Error('Only a scheduled class can be marked.');
  if (actor.role === 'teacher' && row.teacher_id !== me.id) throw new Error('You can mark only your own class.');
  if (actor.role === 'student') throw new Error('A student cannot mark attendance.');
  db.prepare('UPDATE class_sessions SET status = ? WHERE id = ?').run(status, sessionId);
  db.prepare(`
    INSERT INTO class_history (session_id, action, from_status, to_status, from_starts_at, reason, actor_email)
    VALUES (?, 'ATTENDANCE', ?, ?, ?, ?, ?)
  `).run(sessionId, row.status, status, row.starts_at, status, actor.email);
}

export function cancelSession(actor: AdminSession, sessionId: number, reason: string) {
  const db = getDb();
  if (reason.trim().length < 3) throw new Error('Add a reason for the cancellation.');
  const row = db.prepare('SELECT * FROM class_sessions WHERE id = ?').get(sessionId) as { id: number; status: string; starts_at: string } | undefined;
  if (!row || !['Scheduled', 'Rescheduled'].includes(row.status)) throw new Error('Only a scheduled class can be cancelled.');
  db.prepare(`UPDATE class_sessions SET status = 'Cancelled', notes = ? WHERE id = ?`).run(reason.trim(), sessionId);
  db.prepare(`
    INSERT INTO class_history (session_id, action, from_status, to_status, from_starts_at, reason, actor_email)
    VALUES (?, 'CANCEL', ?, 'Cancelled', ?, ?, ?)
  `).run(sessionId, row.status, row.starts_at, reason.trim(), actor.email);
}

export function listNotifications(session: AdminSession) {
  const db = getDb();
  const me = currentUser(session);
  const audience = session.role === 'admin' ? '%' : session.role === 'teacher' ? 'teachers' : 'students';
  return db.prepare(`
    SELECT n.*, EXISTS(SELECT 1 FROM notification_reads r WHERE r.notification_id = n.id AND r.user_id = ?) AS seen
    FROM notifications n
    WHERE n.audience = 'all' OR n.audience = ? OR ? = 'admin'
    ORDER BY n.id DESC LIMIT 100
  `).all(me.id, audience, session.role);
}

export function postNotification(actor: AdminSession, title: string, body: string, audience: string) {
  if (!['all', 'teachers', 'students'].includes(audience)) throw new Error('Choose who receives this.');
  if (title.trim().length < 2 || body.trim().length < 2) throw new Error('Write a title and a message.');
  const db = getDb();
  const info = db.prepare('INSERT INTO notifications (title, body, audience, created_at) VALUES (?, ?, ?, ?)').run(title.trim(), body.trim(), audience, new Date().toISOString());
  return { id: Number(info.lastInsertRowid) };
}

export function markNotificationsRead(session: AdminSession) {
  const db = getDb();
  const me = currentUser(session);
  const rows = listNotifications(session) as { id: number }[];
  const insert = db.prepare('INSERT OR IGNORE INTO notification_reads (notification_id, user_id) VALUES (?, ?)');
  rows.forEach((row) => insert.run(row.id, me.id));
}

export function calendarFor(session: AdminSession, userId?: number) {
  const db = getDb();
  const me = currentUser(session);
  let personId = me.id;
  if (session.role === 'admin' && userId) personId = userId;
  if (session.role !== 'admin' && userId && userId !== me.id) throw new Error('You can only open your own calendar.');
  const person = db.prepare('SELECT id, name, role FROM users WHERE id = ?').get(personId) as { id: number; name: string; role: string };
  if (!person) throw new Error('Person not found.');
  const column = person.role === 'teacher' ? 'teacher_id' : 'student_id';
  const sessions = db.prepare(`
    SELECT c.id, c.starts_at, c.ends_at, c.status, c.duration_minutes, sub.name AS subject_name, st.name AS student_name, te.name AS teacher_name
    FROM class_sessions c
    JOIN subjects sub ON sub.id = c.subject_id
    JOIN users st ON st.id = c.student_id
    JOIN users te ON te.id = c.teacher_id
    WHERE c.${column} = ? AND c.starts_at IS NOT NULL AND c.status IN ('Scheduled', 'Rescheduled')
    ORDER BY c.starts_at
  `).all(personId);
  return { person, sessions };
}

export function saveProfile(session: AdminSession, input: { name?: string; password?: string; avatar?: string; accessUserId?: number; access?: Record<string, boolean> }) {
  const db = getDb();
  const me = currentUser(session);
  if (input.name && input.name.trim()) db.prepare('UPDATE users SET name = ? WHERE id = ?').run(input.name.trim(), me.id);
  if (input.password) {
    if (input.password.length < 6) throw new Error('Use at least 6 characters.');
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(input.password), me.id);
  }
  if (typeof input.avatar === 'string') {
    if (input.avatar.length > 250000) throw new Error('Use a smaller profile image.');
    db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(input.avatar, me.id);
  }
  if (session.role === 'admin' && input.accessUserId && input.access) {
    db.prepare('UPDATE users SET access_json = ? WHERE id = ? AND role != ?').run(JSON.stringify(input.access), input.accessUserId, 'admin');
  }
}

export function listLeaves() {
  const db = getDb();
  return db.prepare(`
    SELECT l.id, l.status, l.reason, l.requested_at, u.name AS person_name, u.role, c.starts_at, sub.name AS subject_name
    FROM leave_requests l
    JOIN users u ON u.id = l.student_id
    JOIN class_sessions c ON c.id = l.session_id
    JOIN subjects sub ON sub.id = c.subject_id
    ORDER BY l.id DESC LIMIT 100
  `).all();
}
