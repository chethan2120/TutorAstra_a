import { NextResponse } from 'next/server';
import { denied, requireRole } from '@/lib/guard';
import { readAttachment } from '@/lib/portal';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = requireRole(['admin', 'teacher', 'student']);
  if (denied(session)) return session;
  try {
    const file = readAttachment(session, Number(params.id));
    return new NextResponse(new Uint8Array(file.buffer), {
      headers: {
        'Content-Type': file.mime,
        'Content-Disposition': `attachment; filename="${file.filename}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not open the file.' }, { status: 403 });
  }
}
