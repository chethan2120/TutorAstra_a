'use client';

import React, { useEffect, useState } from 'react';
import { Field, control, when } from '@/components/portal/Field';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ScheduleBoard() {
  const [data, setData] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ studentId: '', teacherId: '', subjectId: '', totalClasses: '8', startDate: '', time: '17:00', durationMinutes: '60', days: [1, 3] as number[] });
  const [move, setMove] = useState({ sessionId: '', date: '', time: '17:00', reason: '' });

  const load = () => {
    fetch('/api/portal/users').then((response) => response.json()).then(setData);
    fetch('/api/portal/home').then((response) => response.json()).then((body) => setSessions(body.sessions || []));
  };
  useEffect(() => { load(); }, []);

  function toggleDay(day: number) {
    setForm((current) => ({ ...current, days: current.days.includes(day) ? current.days.filter((item) => item !== day) : [...current.days, day] }));
  }

  async function schedule(event: React.FormEvent) {
    event.preventDefault();
    setNotice('');
    if (!form.days.length) { setNotice('Select at least one day.'); return; }
    const existing = (data?.enrolments || []).find((row: any) => String(row.student_id) === form.studentId && String(row.subject_id) === form.subjectId);
    let enrolmentId = existing?.id;
    if (!enrolmentId) {
      const created = await fetch('/api/portal/enrolments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId: Number(form.studentId), teacherId: Number(form.teacherId), subjectId: Number(form.subjectId), totalClasses: Number(form.totalClasses) }) });
      const body = await created.json();
      if (!created.ok) { setNotice(body.error); return; }
      enrolmentId = body.id;
    } else {
      const aligned = await fetch('/api/portal/desk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'align', enrolmentId, totalClasses: Number(form.totalClasses), teacherId: Number(form.teacherId) }) });
      const body = await aligned.json();
      if (!aligned.ok) { setNotice(body.error); return; }
    }
    const response = await fetch('/api/portal/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enrolmentId,
        durationMinutes: Number(form.durationMinutes),
        startDate: form.startDate,
        timezone: 'Asia/Dubai',
        slots: form.days.map((day) => ({ day, time: form.time })),
      }),
    });
    const body = await response.json();
    if (!response.ok) { setNotice(body.error); return; }
    setNotice(`${body.created} classes are now on the teacher and student calendars. ${body.emailStatus === 'queued' ? 'The schedule email is queued.' : 'The classes are saved. The email to the student is stored, but no mail server is connected, so it has not been delivered.'}`);
    load();
  }

  async function reschedule(event: React.FormEvent) {
    event.preventDefault();
    if (!move.sessionId || !move.date || !move.time) { setNotice('Select the class, the new date and the new time.'); return; }
    const response = await fetch('/api/portal/schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: Number(move.sessionId), date: move.date, time: move.time, timezone: 'Asia/Dubai', reason: move.reason }) });
    const body = await response.json();
    setNotice(body.error || 'The class was moved. Both desks use the new date and time.');
    if (response.ok) load();
  }

  async function cancel() {
    if (!move.sessionId || move.reason.trim().length < 3) { setNotice('Select the class and write a reason before cancelling.'); return; }
    const response = await fetch('/api/portal/desk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'cancel', sessionId: Number(move.sessionId), reason: move.reason }) });
    const body = await response.json();
    setNotice(body.error || 'That class was cancelled.');
    if (response.ok) load();
  }

  const movable = sessions.filter((item) => ['Scheduled', 'Rescheduled'].includes(item.status));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#310064]">Schedule class</h1>
        <p className="mt-1 text-sm text-[#51475B]">Set the student, teacher, subject, number of classes, days and time. Both portals update together.</p>
      </div>
      {notice && <p className="rounded-lg bg-[#F5F0FA] px-3 py-2 text-sm">{notice}</p>}
      <form onSubmit={schedule} className="grid gap-3 rounded-2xl border border-[#E8E2ED] bg-white p-4">
        <Field label="Select student">
          <select required value={form.studentId} onChange={(event) => setForm({ ...form, studentId: event.target.value })} className={control}>
            <option value="">Choose a student</option>
            {data?.students?.map((person: any) => <option key={person.id} value={person.id}>{person.name}</option>)}
          </select>
        </Field>
        <Field label="Select teacher">
          <select required value={form.teacherId} onChange={(event) => setForm({ ...form, teacherId: event.target.value })} className={control}>
            <option value="">Choose a teacher</option>
            {data?.teachers?.map((person: any) => <option key={person.id} value={person.id}>{person.name}</option>)}
          </select>
        </Field>
        <Field label="Select subject">
          <select required value={form.subjectId} onChange={(event) => setForm({ ...form, subjectId: event.target.value })} className={control}>
            <option value="">Choose a subject</option>
            {data?.subjects?.map((subject: any) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
          </select>
        </Field>
        <Field label="Number of classes">
          <input required type="number" min={1} value={form.totalClasses} onChange={(event) => setForm({ ...form, totalClasses: event.target.value })} className={control} />
        </Field>
        <Field label="Start date">
          <input required type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} className={control} />
        </Field>
        <Field label="Class time">
          <input required type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} className={control} />
        </Field>
        <Field label="Class length">
          <select value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: event.target.value })} className={control}>
            {[30, 45, 60, 90, 120].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}
          </select>
        </Field>
        <div>
          <p className="mb-1 text-xs font-bold text-[#51475B]">Days</p>
          <div className="flex flex-wrap gap-2">{DAYS.map((label, index) => <button type="button" key={label} onClick={() => toggleDay(index)} className={`rounded-full px-3 py-1 text-xs font-bold ${form.days.includes(index) ? 'bg-[#310064] text-white' : 'bg-slate-100'}`}>{label}</button>)}</div>
        </div>
        <button className="rounded-lg bg-[#310064] px-4 py-2 text-sm font-bold text-white">Schedule classes</button>
      </form>
      <form onSubmit={reschedule} className="grid gap-3 rounded-2xl border border-[#E8E2ED] bg-white p-4">
        <h2 className="font-bold text-[#310064]">Cancel or reschedule one class</h2>
        <Field label="Select class">
          <select required value={move.sessionId} onChange={(event) => setMove({ ...move, sessionId: event.target.value })} className={control}>
            <option value="">Choose a class</option>
            {movable.map((item) => <option key={item.id} value={item.id}>Class {item.id} · {item.student_name} · {item.subject_name} · {item.teacher_name} · {when(item.starts_at)}</option>)}
          </select>
        </Field>
        <Field label="New date">
          <input type="date" value={move.date} onChange={(event) => setMove({ ...move, date: event.target.value })} className={control} />
        </Field>
        <Field label="New time">
          <input type="time" value={move.time} onChange={(event) => setMove({ ...move, time: event.target.value })} className={control} />
        </Field>
        <Field label="Reason">
          <input required value={move.reason} onChange={(event) => setMove({ ...move, reason: event.target.value })} className={control} />
        </Field>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-lg bg-[#310064] px-4 py-2 text-sm font-bold text-white">Reschedule</button>
          <button type="button" onClick={cancel} className="rounded-lg border px-4 py-2 text-sm font-bold">Cancel this class</button>
        </div>
      </form>
      <div className="space-y-2">
        <h2 className="font-bold text-[#310064]">Courses already set</h2>
        {(data?.enrolments || []).map((row: any) => (
          <p key={row.id} className="rounded-xl border border-[#E8E2ED] bg-white p-3 text-sm">
            <span className="font-bold">Student:</span> {row.student_name} · <span className="font-bold">Subject:</span> {row.subject_name} · <span className="font-bold">Teacher:</span> {row.teacher_name}<br />
            {row.balance.remaining} remaining of {row.total_classes}
          </p>
        ))}
      </div>
    </div>
  );
}
