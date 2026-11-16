'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { SUBJECTS } from '@/components/tutorastra/SubjectsSection';

const GRADES = [
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12',
  'Other / prefer to discuss',
];

type Field = 'name' | 'email' | 'phone' | 'grade' | 'subject' | 'consultationDate' | 'message';

const empty = {
  name: '',
  email: '',
  phone: '',
  grade: '',
  subject: '',
  consultationDate: '',
  message: '',
};

function todayStamp() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function ConsultationForm() {
  const params = useSearchParams();
  const preset = params.get('subject') || '';
  const [values, setValues] = useState({ ...empty, subject: SUBJECTS.includes(preset as (typeof SUBJECTS)[number]) ? preset : '' });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const minDate = useMemo(() => todayStamp(), []);

  useEffect(() => {
    if (SUBJECTS.includes(preset as (typeof SUBJECTS)[number])) {
      setValues((current) => ({ ...current, subject: preset }));
    }
  }, [preset]);

  const set = (field: Field, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const next: Partial<Record<Field, string>> = {};
    if (values.name.trim().length < 2) next.name = 'Enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) next.email = 'Enter a valid email address.';
    if ((values.phone.match(/\d/g) || []).length < 7) next.phone = 'Enter a valid phone number.';
    if (!values.grade) next.grade = 'Select the student grade.';
    if (!values.subject) next.subject = 'Select a preferred subject.';
    if (!values.consultationDate) next.consultationDate = 'Choose a preferred date.';
    else if (values.consultationDate < minDate) next.consultationDate = 'Choose a date from today onwards.';
    if (values.message.trim().length < 5) next.message = 'Add a short message (at least 5 characters).';
    return next;
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setSuccess(null);
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      const response = await fetch('/api/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'We could not save your request.');
      setSuccess(data.message);
      setValues({ ...empty });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'We could not save your request.');
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = (field: Field) =>
    `w-full rounded-2xl border bg-white px-4 py-3 text-sm text-[#241536] outline-none transition focus:border-[#6527B8] focus:ring-2 focus:ring-[#F4CC45]/70 ${
      errors[field] ? 'border-rose-400' : 'border-[#E9E1F1]'
    }`;

  return (
    <section id="consultation" data-header-tone="dark" className="relative overflow-hidden bg-[#240047] py-20 sm:py-24">
      <div className="relative mx-auto grid max-w-7xl items-start gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8" data-no-reveal>
        <div className="text-white" data-reveal="left">
          <div className="relative mb-6 aspect-[4/3] overflow-hidden rounded-lg">
            <Image
              src="/images/hero/tutor-guidance.png"
              alt="A student writing while a tutor points to the notebook"
              fill
              sizes="(min-width: 1024px) 480px, 100vw"
              className="object-cover object-[center_20%]"
            />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#F4CC45]">Free consultation</p>
          <h2 className="ta-rule font-display mt-3 text-4xl font-semibold leading-tight sm:text-5xl">
            Let&apos;s Build Your Learning Journey Together.
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-white/80">
            Share a few details and we will use them to prepare a conversation about goals, subject and schedule. This form is saved to the TutorAstra enquiry desk. It does not confirm a class until we reply.
          </p>
        </div>

        <div className="rounded-[2rem] border border-[#E9E1F1] bg-[#FAF8FF] p-6 sm:p-8" data-reveal="fade">
          {success ? (
            <div className="flex min-h-[420px] flex-col items-start justify-center" role="status">
              <CheckCircle2 className="h-10 w-10 text-[#6527B8]" />
              <h3 className="mt-4 text-2xl font-semibold text-[#310064]">Request received</h3>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-[#746B80]">{success}</p>
              <button
                type="button"
                onClick={() => setSuccess(null)}
                className="mt-6 rounded-full bg-[#310064] px-5 py-3 text-sm font-semibold text-white"
              >
                Send another request
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-[#310064] sm:col-span-2">
                Full Name
                <input className={`${fieldClass('name')} mt-1.5`} value={values.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" aria-invalid={Boolean(errors.name)} />
                {errors.name && <span className="mt-1 block text-xs text-rose-700">{errors.name}</span>}
              </label>
              <label className="block text-sm font-medium text-[#310064]">
                Email Address
                <input type="email" className={`${fieldClass('email')} mt-1.5`} value={values.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" aria-invalid={Boolean(errors.email)} />
                {errors.email && <span className="mt-1 block text-xs text-rose-700">{errors.email}</span>}
              </label>
              <label className="block text-sm font-medium text-[#310064]">
                Phone Number
                <input type="tel" className={`${fieldClass('phone')} mt-1.5`} value={values.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="tel" aria-invalid={Boolean(errors.phone)} />
                {errors.phone && <span className="mt-1 block text-xs text-rose-700">{errors.phone}</span>}
              </label>
              <label className="block text-sm font-medium text-[#310064]">
                Student Grade
                <select className={`${fieldClass('grade')} mt-1.5`} value={values.grade} onChange={(e) => set('grade', e.target.value)} aria-invalid={Boolean(errors.grade)}>
                  <option value="">Select a grade</option>
                  {GRADES.map((grade) => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
                {errors.grade && <span className="mt-1 block text-xs text-rose-700">{errors.grade}</span>}
              </label>
              <label className="block text-sm font-medium text-[#310064]">
                Preferred Subject
                <select className={`${fieldClass('subject')} mt-1.5`} value={values.subject} onChange={(e) => set('subject', e.target.value)} aria-invalid={Boolean(errors.subject)}>
                  <option value="">Select a subject</option>
                  {SUBJECTS.map((subject) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
                {errors.subject && <span className="mt-1 block text-xs text-rose-700">{errors.subject}</span>}
              </label>
              <label className="block text-sm font-medium text-[#310064] sm:col-span-2">
                Preferred Consultation Date
                <input type="date" min={minDate} className={`${fieldClass('consultationDate')} mt-1.5`} value={values.consultationDate} onChange={(e) => set('consultationDate', e.target.value)} aria-invalid={Boolean(errors.consultationDate)} />
                {errors.consultationDate && <span className="mt-1 block text-xs text-rose-700">{errors.consultationDate}</span>}
              </label>
              <label className="block text-sm font-medium text-[#310064] sm:col-span-2">
                Message
                <textarea rows={4} className={`${fieldClass('message')} mt-1.5 resize-y`} value={values.message} onChange={(e) => set('message', e.target.value)} aria-invalid={Boolean(errors.message)} />
                {errors.message && <span className="mt-1 block text-xs text-rose-700">{errors.message}</span>}
              </label>
              {formError && (
                <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 sm:col-span-2" role="alert">
                  {formError}
                </p>
              )}
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#310064] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#240047] disabled:opacity-70 sm:w-auto"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Request a Free Consultation
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

export default function ConsultationSection() {
  return (
    <Suspense fallback={<section id="consultation" className="bg-white py-24" />}>
      <ConsultationForm />
    </Suspense>
  );
}
