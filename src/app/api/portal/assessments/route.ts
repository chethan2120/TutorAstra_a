import { NextResponse } from 'next/server';
import { denied, requireRole } from '@/lib/guard';
import { getAssessment, startAssessment, submitAssessment } from '@/lib/portal';

export async function POST(request: Request) {
  const session = requireRole(['student']);
  if (denied(session)) return session;
  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'Upload a PDF or text file of no more than three pages.' }, { status: 400 });
    const started = startAssessment(session, String(form.get('subject') || 'General'), file.name, Buffer.from(await file.arrayBuffer()), file.type || 'application/pdf');
    return NextResponse.json({ ok: true, ...started });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'The assessment could not start.' }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  const session = requireRole(['student', 'teacher', 'admin']);
  if (denied(session)) return session;
  try {
    const body = await request.json();
    if (body.answers) {
      const result = submitAssessment(session, Number(body.id), body.answers);
      return NextResponse.json({ ok: true, ...result });
    }
    return NextResponse.json(getAssessment(session, Number(body.id)));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not update the assessment.' }, { status: 400 });
  }
}
