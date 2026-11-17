import { NextResponse } from 'next/server';
import { denied, requireRole } from '@/lib/guard';
import { createPortalUser, listDirectory, setUserActive } from '@/lib/portal';

export async function GET() {
  const session = requireRole(['admin']);
  if (denied(session)) return session;
  return NextResponse.json(listDirectory());
}

export async function POST(request: Request) {
  const session = requireRole(['admin']);
  if (denied(session)) return session;
  try {
    const body = await request.json();
    if (body.userId && typeof body.active === 'boolean') {
      setUserActive(session, Number(body.userId), body.active);
      return NextResponse.json({ ok: true });
    }
    const created = createPortalUser(session, body);
    return NextResponse.json({
      ok: true,
      id: created.id,
      email: created.email,
      activationPath: created.activationPath,
      emailStatus: 'not_configured',
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not save the account.' }, { status: 400 });
  }
}
