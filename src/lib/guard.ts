import { NextResponse } from 'next/server';
import { getCurrentSession, type AdminSession } from '@/lib/auth';

export function requireRole(roles: string[]) {
  const session = getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  if (!roles.includes(session.role)) return NextResponse.json({ error: 'You do not have access to this.' }, { status: 403 });
  return session;
}

export function denied(value: AdminSession | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}
