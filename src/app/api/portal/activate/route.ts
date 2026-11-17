import { NextResponse } from 'next/server';
import { activateAccount } from '@/lib/portal';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = activateAccount(String(body.token || ''), String(body.password || ''));
    return NextResponse.json({ ok: true, email: result.email });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not set the password.' }, { status: 400 });
  }
}
