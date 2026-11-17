export const DEMO_PASSWORD = 'demo123';

export const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@gmail.com', role: 'admin', login: true },
  { label: 'Teacher 1', email: 'teacher1@gmail.com', role: 'teacher', login: true },
  { label: 'Teacher 2', email: 'teacher2@gmail.com', role: 'teacher', login: false },
  { label: 'Student 1', email: 'student1@gmail.com', role: 'student', login: true },
  { label: 'Student 2', email: 'student2@gmail.com', role: 'student', login: false },
  { label: 'Student 3', email: 'student3@gmail.com', role: 'student', login: false },
  { label: 'Student 4', email: 'student4@gmail.com', role: 'student', login: false },
] as const;

export function deskPath(role: string) {
  if (role === 'teacher') return '/teacher';
  if (role === 'student') return '/student';
  return '/admin/dashboard';
}
