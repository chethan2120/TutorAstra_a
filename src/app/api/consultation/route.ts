import { NextResponse } from 'next/server';
import { createEnquiry } from '@/lib/db';

const SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Science',
  'English',
  'Computer Science',
  'Commerce',
  'More Subjects',
  'Other Subjects',
];

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function digitCount(value: string) {
  return (value.match(/\d/g) || []).length;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name || '');
    const email = String(body.email || '');
    const phone = String(body.phone || '');

    if (body.kind === 'demo') {
      if (!name.trim() || name.trim().length < 2) {
        return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
      }
      if (digitCount(phone) < 7) {
        return NextResponse.json({ error: 'Please enter a valid phone number.' }, { status: 400 });
      }
      const enquiryId = createEnquiry({
        type: 'contact',
        name: name.trim(),
        email: '',
        phone: phone.trim(),
        preferred_contact_method: 'Phone',
        subject: 'Book a demo',
        message: 'Demo request from the website popup. Name and phone only.',
      });
      return NextResponse.json({ ok: true, id: enquiryId });
    }
    const grade = String(body.grade || '');
    const subject = String(body.subject || '');
    const consultationDate = String(body.consultationDate || '');
    const message = String(body.message || '');

    if (!name.trim() || name.trim().length < 2) {
      return NextResponse.json({ error: 'Please enter your full name.' }, { status: 400 });
    }
    if (!isValidEmail(email.trim())) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (digitCount(phone) < 7) {
      return NextResponse.json({ error: 'Please enter a valid phone number.' }, { status: 400 });
    }
    if (!grade.trim()) {
      return NextResponse.json({ error: 'Please select the student grade.' }, { status: 400 });
    }
    if (!SUBJECTS.includes(subject)) {
      return NextResponse.json({ error: 'Please select a preferred subject.' }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(consultationDate)) {
      return NextResponse.json({ error: 'Please choose a preferred consultation date.' }, { status: 400 });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const chosen = new Date(`${consultationDate}T00:00:00`);
    if (Number.isNaN(chosen.getTime()) || chosen < today) {
      return NextResponse.json({ error: 'Please choose a consultation date from today onwards.' }, { status: 400 });
    }
    if (message.trim().length < 5) {
      return NextResponse.json({ error: 'Please add a short message of at least 5 characters.' }, { status: 400 });
    }

    const enquiryId = createEnquiry({
      type: 'contact',
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      grade: grade.trim(),
      interested_stream: subject,
      preferred_contact_method: 'Consultation',
      subject: `Free Consultation — ${subject}`,
      message: [
        `Preferred consultation date: ${consultationDate}`,
        `Student grade: ${grade.trim()}`,
        `Preferred subject: ${subject}`,
        '',
        message.trim(),
      ].join('\n'),
    });

    return NextResponse.json({
      success: true,
      enquiryId,
      message: 'Your consultation request has been received. A member of the TutorAstra team will confirm a time with you.',
    });
  } catch (err) {
    console.error('Error in consultation API:', err);
    return NextResponse.json(
      { error: 'We could not save your request just now. Please try again.' },
      { status: 500 }
    );
  }
}
