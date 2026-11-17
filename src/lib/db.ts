import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { INITIAL_COURSES, INITIAL_PACKAGES, INITIAL_SETTINGS } from './initialData';
import { ALL_CURRICULA } from './curriculumData';

const isVercel = Boolean(process.env.VERCEL);
const DB_DIR = isVercel ? '/tmp' : path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'ednxt.db');

// Ensure directory exists
if (!fs.existsSync(DB_DIR)) {
  try {
    fs.mkdirSync(DB_DIR, { recursive: true });
  } catch (e) {
    // Ignore if directory already exists
  }
}

// On Vercel, copy the seeded database from project root to /tmp if not already there
if (isVercel) {
  const sourceDb = path.join(process.cwd(), 'data', 'ednxt.db');
  if (fs.existsSync(sourceDb) && !fs.existsSync(DB_PATH)) {
    try {
      fs.copyFileSync(sourceDb, DB_PATH);
    } catch (e) {
      console.warn('Could not copy source db to /tmp, will initialize fresh:', e);
    }
  }
}

let dbInstance: Database.Database | null = null;
let isDbInitialized = false;

export function hashPassword(password: string): string {
  const salt = 'ednxt_secure_salt_2026';
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export function getDb(): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = new Database(DB_PATH);
  dbInstance.pragma('journal_mode = WAL');

  // Initialize Tables only if not already done in this process
  if (!isDbInitialized) {
    initTables(dbInstance);
    isDbInitialized = true;
  }
  ensurePortalSchema(dbInstance);

  return dbInstance;
}

function initTables(db: Database.Database) {
  // Fast check: if users table already exists, avoid running the heavy migration and seed loops
  try {
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
    if (tableCheck) {
      return;
    }
  } catch (e) {
    // continue to full initialization
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      tagline TEXT,
      stream TEXT NOT NULL,
      curriculum TEXT NOT NULL,
      grades TEXT NOT NULL,
      price_aed INTEGER NOT NULL,
      duration TEXT NOT NULL,
      description TEXT NOT NULL,
      learning_outcomes TEXT NOT NULL,
      image_url TEXT,
      badge TEXT,
      is_published INTEGER DEFAULT 1,
      is_featured INTEGER DEFAULT 0,
      schedule_info TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS course_packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      subtitle TEXT,
      streams_included TEXT NOT NULL,
      price_aed INTEGER NOT NULL,
      billing_period TEXT DEFAULT 'per term',
      features TEXT NOT NULL,
      is_popular INTEGER DEFAULT 0,
      is_published INTEGER DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS curriculum_topics (
      id TEXT PRIMARY KEY,
      curriculum TEXT NOT NULL,
      subject TEXT NOT NULL,
      grade TEXT NOT NULL,
      term INTEGER NOT NULL,
      term_title TEXT NOT NULL,
      duration TEXT NOT NULL,
      topics_json TEXT NOT NULL,
      learning_approach TEXT,
      assessments_json TEXT,
      capstone TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS enquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL, -- 'free_trial' or 'contact'
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      student_name TEXT,
      grade TEXT,
      curriculum TEXT,
      interested_stream TEXT,
      preferred_contact_method TEXT,
      subject TEXT,
      message TEXT,
      status TEXT DEFAULT 'New', -- 'New', 'Contacted', 'Trial Scheduled', 'Converted', 'Closed'
      internal_notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admin_activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_email TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS website_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default users if none exists or ensure demo users are present
  const demoUsers = [
    { email: 'admin@gmail.com', pass: 'demo123', name: 'Super Admin', role: 'admin' },
    { email: 'teacher@gmail.com', pass: 'demo123', name: 'Dr. Sarah Mitchell (Lead Faculty)', role: 'teacher' },
    { email: 'student@gmail.com', pass: 'demo123', name: 'Ethan Jenkins (Student / Parent)', role: 'student' },
    { email: 'admin@ednxt.co', pass: 'Admin@EdNxt2026!', name: 'Lead Administrator', role: 'admin' },
  ];

  for (const u of demoUsers) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(u.email);
    const passHash = hashPassword(u.pass);
    if (!existing) {
      db.prepare(`
        INSERT INTO users (email, password_hash, name, role)
        VALUES (?, ?, ?, ?)
      `).run(u.email, passHash, u.name, u.role);
    } else {
      db.prepare(`
        UPDATE users SET password_hash = ?, name = ?, role = ? WHERE email = ?
      `).run(passHash, u.name, u.role, u.email);
    }
  }

  // Seed default courses if none exist
  const coursesCount = db.prepare('SELECT count(*) as count FROM courses').get() as { count: number };
  if (coursesCount.count === 0) {
    const insertCourse = db.prepare(`
      INSERT INTO courses (
        slug, title, tagline, stream, curriculum, grades, price_aed, duration,
        description, learning_outcomes, image_url, badge, is_published, is_featured, schedule_info
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const c of INITIAL_COURSES) {
      insertCourse.run(
        c.slug, c.title, c.tagline, c.stream, c.curriculum, c.grades, c.price_aed, c.duration,
        c.description, c.learning_outcomes, c.image_url, c.badge, c.is_published, c.is_featured, c.schedule_info
      );
    }
  }

  // Seed default packages if none exist
  const packageCount = db.prepare('SELECT count(*) as count FROM course_packages').get() as { count: number };
  if (packageCount.count === 0) {
    const insertPkg = db.prepare(`
      INSERT INTO course_packages (slug, name, subtitle, streams_included, price_aed, billing_period, features, is_popular, is_published)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of INITIAL_PACKAGES) {
      insertPkg.run(p.slug, p.name, p.subtitle, p.streams_included, p.price_aed, p.billing_period, p.features, p.is_popular, p.is_published);
    }
  }

  // Seed curriculum topics if none exist
  const curriculumCount = db.prepare('SELECT count(*) as count FROM curriculum_topics').get() as { count: number };
  if (curriculumCount.count === 0) {
    const insertTopic = db.prepare(`
      INSERT INTO curriculum_topics (id, curriculum, subject, grade, term, term_title, duration, topics_json, learning_approach, assessments_json, capstone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const t of ALL_CURRICULA) {
      insertTopic.run(
        t.id,
        t.curriculum,
        t.subject,
        t.grade,
        t.term,
        t.termTitle,
        t.duration,
        JSON.stringify(t.topics),
        t.learningApproach,
        JSON.stringify(t.assessments),
        t.capstone || ''
      );
    }
  }

  // Seed website settings if none exist
  const settingsCount = db.prepare('SELECT count(*) as count FROM website_settings').get() as { count: number };
  if (settingsCount.count === 0) {
    const insertSetting = db.prepare(`
      INSERT INTO website_settings (key, value) VALUES (?, ?)
    `);

    for (const [key, value] of Object.entries(INITIAL_SETTINGS)) {
      insertSetting.run(key, value);
    }
  }
}

// ----------------- QUERY HELPER EXPORTS -----------------

// Courses
export function getAllCourses() {
  const db = getDb();
  return db.prepare('SELECT * FROM courses ORDER BY id ASC').all();
}

export function getPublishedCourses() {
  const db = getDb();
  return db.prepare('SELECT * FROM courses WHERE is_published = 1 ORDER BY id ASC').all();
}

export function getCourseBySlug(slug: string) {
  const db = getDb();
  return db.prepare('SELECT * FROM courses WHERE slug = ?').get(slug);
}

export function createCourse(data: any) {
  const db = getDb();
  const info = db.prepare(`
    INSERT INTO courses (
      slug, title, tagline, stream, curriculum, grades, price_aed, duration,
      description, learning_outcomes, image_url, badge, is_published, is_featured, schedule_info
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.slug, data.title, data.tagline, data.stream, data.curriculum,
    typeof data.grades === 'string' ? data.grades : JSON.stringify(data.grades || []),
    Number(data.price_aed) || 0, data.duration || '12 Weeks per Term',
    data.description || '',
    typeof data.learning_outcomes === 'string' ? data.learning_outcomes : JSON.stringify(data.learning_outcomes || []),
    data.image_url || '', data.badge || '', data.is_published ? 1 : 0, data.is_featured ? 1 : 0,
    data.schedule_info || ''
  );
  return info.lastInsertRowid;
}

export function updateCourse(id: number, data: any) {
  const db = getDb();
  db.prepare(`
    UPDATE courses SET
      slug = ?, title = ?, tagline = ?, stream = ?, curriculum = ?, grades = ?,
      price_aed = ?, duration = ?, description = ?, learning_outcomes = ?,
      image_url = ?, badge = ?, is_published = ?, is_featured = ?, schedule_info = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    data.slug, data.title, data.tagline, data.stream, data.curriculum,
    typeof data.grades === 'string' ? data.grades : JSON.stringify(data.grades || []),
    Number(data.price_aed) || 0, data.duration,
    data.description,
    typeof data.learning_outcomes === 'string' ? data.learning_outcomes : JSON.stringify(data.learning_outcomes || []),
    data.image_url, data.badge, data.is_published ? 1 : 0, data.is_featured ? 1 : 0,
    data.schedule_info, id
  );
}

export function deleteCourse(id: number) {
  const db = getDb();
  db.prepare('DELETE FROM courses WHERE id = ?').run(id);
}

// Course Packages
export function getAllPackages() {
  const db = getDb();
  return db.prepare('SELECT * FROM course_packages ORDER BY id ASC').all();
}

export function updatePackage(id: number, data: any) {
  const db = getDb();
  db.prepare(`
    UPDATE course_packages SET
      name = ?, subtitle = ?, streams_included = ?, price_aed = ?,
      billing_period = ?, features = ?, is_popular = ?, is_published = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    data.name, data.subtitle,
    typeof data.streams_included === 'string' ? data.streams_included : JSON.stringify(data.streams_included || []),
    Number(data.price_aed) || 0, data.billing_period || 'per term',
    typeof data.features === 'string' ? data.features : JSON.stringify(data.features || []),
    data.is_popular ? 1 : 0, data.is_published ? 1 : 0, id
  );
}

// Curriculum
export function getAllCurriculum() {
  const db = getDb();
  return db.prepare('SELECT * FROM curriculum_topics ORDER BY curriculum, subject, grade, term ASC').all();
}

export function getCurriculumTopicById(id: string) {
  const db = getDb();
  return db.prepare('SELECT * FROM curriculum_topics WHERE id = ?').get(id);
}

export function updateCurriculumTopic(id: string, data: any) {
  const db = getDb();
  db.prepare(`
    UPDATE curriculum_topics SET
      term_title = ?, duration = ?, topics_json = ?, learning_approach = ?,
      assessments_json = ?, capstone = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    data.term_title, data.duration,
    typeof data.topics_json === 'string' ? data.topics_json : JSON.stringify(data.topics || []),
    data.learning_approach,
    typeof data.assessments_json === 'string' ? data.assessments_json : JSON.stringify(data.assessments || []),
    data.capstone || '', id
  );
}

// Enquiries (Free Trial & Contact)
export function createEnquiry(data: {
  type: 'free_trial' | 'contact';
  name: string;
  email: string;
  phone?: string;
  student_name?: string;
  grade?: string;
  curriculum?: string;
  interested_stream?: string;
  preferred_contact_method?: string;
  subject?: string;
  message?: string;
}) {
  const db = getDb();
  const info = db.prepare(`
    INSERT INTO enquiries (
      type, name, email, phone, student_name, grade, curriculum,
      interested_stream, preferred_contact_method, subject, message, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'New')
  `).run(
    data.type, data.name, data.email, data.phone || '', data.student_name || '',
    data.grade || '', data.curriculum || '', data.interested_stream || '',
    data.preferred_contact_method || 'WhatsApp', data.subject || '', data.message || ''
  );
  return info.lastInsertRowid;
}

export function getAllEnquiries(typeFilter?: string, statusFilter?: string, search?: string) {
  const db = getDb();
  let query = 'SELECT * FROM enquiries WHERE 1=1';
  const params: any[] = [];

  if (typeFilter && typeFilter !== 'all') {
    query += ' AND type = ?';
    params.push(typeFilter);
  }

  if (statusFilter && statusFilter !== 'all') {
    query += ' AND status = ?';
    params.push(statusFilter);
  }

  if (search && search.trim() !== '') {
    query += ' AND (name LIKE ? OR email LIKE ? OR student_name LIKE ? OR phone LIKE ?)';
    const s = `%${search.trim()}%`;
    params.push(s, s, s, s);
  }

  query += ' ORDER BY created_at DESC';
  return db.prepare(query).all(...params);
}

export function getEnquiryById(id: number) {
  const db = getDb();
  return db.prepare('SELECT * FROM enquiries WHERE id = ?').get(id);
}

export function updateEnquiryStatus(id: number, status: string, internal_notes?: string) {
  const db = getDb();
  if (internal_notes !== undefined) {
    db.prepare(`
      UPDATE enquiries SET status = ?, internal_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(status, internal_notes, id);
  } else {
    db.prepare(`
      UPDATE enquiries SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(status, id);
  }
}

export function deleteEnquiry(id: number) {
  const db = getDb();
  db.prepare('DELETE FROM enquiries WHERE id = ?').run(id);
}

// Activity Log
export function logActivity(admin_email: string, action: string, target_type: string, target_id?: string, details?: string) {
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO admin_activity_log (admin_email, action, target_type, target_id, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(admin_email, action, target_type, target_id || '', details || '');
  } catch (e) {
    console.error('Failed to log admin activity:', e);
  }
}

export function getRecentActivities(limit = 15) {
  const db = getDb();
  return db.prepare('SELECT * FROM admin_activity_log ORDER BY created_at DESC LIMIT ?').all(limit);
}

// Dashboard Statistics
export function getDashboardStats() {
  const db = getDb();
  const totalEnquiries = db.prepare('SELECT count(*) as count FROM enquiries').get() as { count: number };
  const newEnquiries = db.prepare("SELECT count(*) as count FROM enquiries WHERE status = 'New'").get() as { count: number };
  const freeTrialRequests = db.prepare("SELECT count(*) as count FROM enquiries WHERE type = 'free_trial'").get() as { count: number };
  const contactMessages = db.prepare("SELECT count(*) as count FROM enquiries WHERE type = 'contact'").get() as { count: number };
  const activeCourses = db.prepare('SELECT count(*) as count FROM courses WHERE is_published = 1').get() as { count: number };
  const convertedEnquiries = db.prepare("SELECT count(*) as count FROM enquiries WHERE status = 'Converted'").get() as { count: number };

  return {
    totalEnquiries: totalEnquiries.count,
    newEnquiries: newEnquiries.count,
    freeTrialRequests: freeTrialRequests.count,
    contactMessages: contactMessages.count,
    activeCourses: activeCourses.count,
    convertedEnquiries: convertedEnquiries.count
  };
}

// Settings
export function getAllSettings(): Record<string, string> {
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM website_settings').all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return settings;
}

export function getSetting(key: string, defaultValue = ''): string {
  const db = getDb();
  const row = db.prepare('SELECT value FROM website_settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row ? row.value : defaultValue;
}

export function updateSetting(key: string, value: string) {
  const db = getDb();
  db.prepare(`
    INSERT INTO website_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `).run(key, value);
}

export function updateSettingsBatch(record: Record<string, string>) {
  const db = getDb();
  const upsert = db.prepare(`
    INSERT INTO website_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `);
  const transaction = db.transaction((entries: [string, string][]) => {
    for (const [k, v] of entries) {
      upsert.run(k, v);
    }
  });
  transaction(Object.entries(record));
}

// Users
export function getUserByEmail(email: string): { id: number; email: string; name: string; role: string; password_hash: string } | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
}

export function verifyUserCredentials(email: string, passwordPlain: string) {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!user) return null;
  if (user.is_active === 0) return null;
  const hash = hashPassword(passwordPlain);
  if (user.password_hash === hash) {
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }
  return null;
}

function ensurePortalSchema(db: Database.Database) {
  const cols = db.prepare('PRAGMA table_info(users)').all() as { name: string }[];
  const names = new Set(cols.map((col) => col.name));
  if (!names.has('is_active')) db.exec('ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1');
  if (!names.has('timezone')) db.exec("ALTER TABLE users ADD COLUMN timezone TEXT DEFAULT 'Asia/Dubai'");
  if (!names.has('must_set_password')) db.exec('ALTER TABLE users ADD COLUMN must_set_password INTEGER DEFAULT 0');

  db.exec(`
    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );
    CREATE TABLE IF NOT EXISTS enrolments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      subject_id INTEGER NOT NULL,
      teacher_id INTEGER,
      total_classes INTEGER NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, subject_id)
    );
    CREATE TABLE IF NOT EXISTS class_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enrolment_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      teacher_id INTEGER,
      subject_id INTEGER NOT NULL,
      session_number INTEGER NOT NULL,
      starts_at TEXT,
      ends_at TEXT,
      timezone TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      status TEXT NOT NULL,
      notes TEXT DEFAULT '',
      zoom_meeting_id TEXT,
      zoom_join_url TEXT,
      zoom_start_url TEXT,
      replacement_for INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS class_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      from_status TEXT,
      to_status TEXT,
      from_starts_at TEXT,
      to_starts_at TEXT,
      reason TEXT,
      actor_email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enrolment_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      body TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS message_reads (
      message_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (message_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS message_attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      mime TEXT NOT NULL,
      size INTEGER NOT NULL,
      storage_path TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS leave_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL UNIQUE,
      student_id INTEGER NOT NULL,
      subject_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL,
      requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      replacement_session_id INTEGER
    );
    CREATE TABLE IF NOT EXISTS recordings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      storage_key TEXT NOT NULL,
      status TEXT DEFAULT 'available',
      watched_seconds INTEGER DEFAULT 0,
      consumed_at TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      material_text TEXT NOT NULL,
      started_at TEXT NOT NULL,
      deadline_at TEXT NOT NULL,
      submitted_at TEXT,
      score INTEGER,
      max_score INTEGER,
      status TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS assessment_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assessment_id INTEGER NOT NULL,
      kind TEXT NOT NULL,
      prompt TEXT NOT NULL,
      options_json TEXT,
      answer TEXT,
      explanation TEXT
    );
    CREATE TABLE IF NOT EXISTS assessment_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assessment_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      answer TEXT,
      awarded INTEGER DEFAULT 0,
      feedback TEXT
    );
    CREATE TABLE IF NOT EXISTS email_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipient TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL,
      error TEXT,
      related_type TEXT,
      related_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS invite_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_student ON class_sessions(student_id, starts_at);
    CREATE INDEX IF NOT EXISTS idx_sessions_teacher ON class_sessions(teacher_id, starts_at);
    CREATE INDEX IF NOT EXISTS idx_messages_enrolment ON messages(enrolment_id, id);
    CREATE TABLE IF NOT EXISTS staff_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      recipient_id INTEGER,
      body TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS staff_attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      mime TEXT NOT NULL,
      size INTEGER NOT NULL,
      storage_path TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS attendance_punches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      punched_in_at TEXT NOT NULL,
      punched_out_at TEXT
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      audience TEXT NOT NULL DEFAULT 'all',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS notification_reads (
      notification_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      PRIMARY KEY (notification_id, user_id)
    );
  `);
  for (const statement of [
    'ALTER TABLE users ADD COLUMN avatar TEXT',
    'ALTER TABLE users ADD COLUMN access_json TEXT DEFAULT ""',
    'ALTER TABLE users ADD COLUMN phone TEXT DEFAULT ""',
    'ALTER TABLE subjects ADD COLUMN details TEXT DEFAULT ""',
  ]) {
    try { db.exec(statement); } catch { /* column already exists */ }
  }

  const subjectCount = db.prepare('SELECT COUNT(*) AS count FROM subjects').get() as { count: number };
  if (subjectCount.count === 0) {
    const insert = db.prepare('INSERT INTO subjects (name) VALUES (?)');
    for (const name of ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Science', 'English', 'Computer Science', 'Commerce']) {
      insert.run(name);
    }
  }
  ensureDemoRoster(db);
}

function ensureDemoRoster(db: Database.Database) {
  const password = hashPassword('demo123');
  const people: [string, string, string][] = [
    ['teacher1@gmail.com', 'Teacher 1', 'teacher'],
    ['teacher2@gmail.com', 'Teacher 2', 'teacher'],
    ['student1@gmail.com', 'Student 1', 'student'],
    ['student2@gmail.com', 'Student 2', 'student'],
    ['student3@gmail.com', 'Student 3', 'student'],
    ['student4@gmail.com', 'Student 4', 'student'],
  ];
  const insertUser = db.prepare(`
    INSERT INTO users (email, password_hash, name, role, is_active, timezone, must_set_password)
    VALUES (?, ?, ?, ?, 1, 'Asia/Dubai', 0)
  `);
  for (const [email, name, role] of people) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (!existing) insertUser.run(email, password, name, role);
  }
  const teacher = db.prepare(`SELECT id FROM users WHERE email = 'teacher1@gmail.com'`).get() as { id: number } | undefined;
  const science = db.prepare(`SELECT id FROM subjects WHERE name = 'Science'`).get() as { id: number } | undefined;
  if (!teacher || !science) return;
  const students = ['student1@gmail.com', 'student2@gmail.com', 'student3@gmail.com', 'student4@gmail.com'];
  students.forEach((email, index) => {
    const student = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: number } | undefined;
    if (!student) return;
    let enrolment = db.prepare('SELECT id FROM enrolments WHERE student_id = ? AND subject_id = ?').get(student.id, science.id) as { id: number } | undefined;
    if (!enrolment) {
      const info = db.prepare(`
        INSERT INTO enrolments (student_id, teacher_id, subject_id, total_classes, status)
        VALUES (?, ?, ?, 8, 'active')
      `).run(student.id, teacher.id, science.id);
      enrolment = { id: Number(info.lastInsertRowid) };
    }
    const existingSessions = db.prepare('SELECT COUNT(*) AS count FROM class_sessions WHERE enrolment_id = ?').get(enrolment.id) as { count: number };
    if (existingSessions.count > 0) return;
    const start = new Date();
    start.setUTCHours(12 + index, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() + 1 + (index % 3));
    const insertSession = db.prepare(`
      INSERT INTO class_sessions (
        enrolment_id, student_id, teacher_id, subject_id, session_number,
        starts_at, ends_at, timezone, duration_minutes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Asia/Dubai', 60, 'Scheduled')
    `);
    for (let number = 1; number <= 2; number += 1) {
      const begins = new Date(start.getTime() + (number - 1) * 2 * 24 * 60 * 60 * 1000);
      const ends = new Date(begins.getTime() + 60 * 60 * 1000);
      insertSession.run(enrolment.id, student.id, teacher.id, science.id, number, begins.toISOString(), ends.toISOString());
    }
  });
}

export function updateUserPassword(email: string, newPasswordPlain: string) {
  const db = getDb();
  const newHash = hashPassword(newPasswordPlain);
  db.prepare('UPDATE users SET password_hash = ? WHERE email = ?').run(newHash, email);
}
