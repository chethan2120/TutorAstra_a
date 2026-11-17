'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminTopBar } from '@/components/AdminNav';
import ChatDesk from '@/components/portal/ChatDesk';
import CalendarDesk from '@/components/portal/CalendarDesk';
import { Field, NoticeCard, control, when } from '@/components/portal/Field';

const NAV = ['Teacher', 'Subject', 'Calendar', 'Notifications', 'Chat', 'Leave', 'Profile'] as const;

function hello(name: string) {
  const hour = new Date().getHours();
  const part = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return `${part}, ${name}`;
}

export default function StudentDesk() {
  const router = useRouter();
  const [view, setView] = useState<(typeof NAV)[number]>('Teacher');
  const [data, setData] = useState<any>(null);
  const [subject, setSubject] = useState<string>('');
  const [enrolmentId, setEnrolmentId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [notice, setNotice] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [reason, setReason] = useState('');
  const [assessment, setAssessment] = useState<any>(null);

  async function load() {
    const response = await fetch('/api/portal/home');
    if (response.status === 401) {
      router.push('/login');
      return;
    }
    const body = await response.json();
    if (body.me?.role !== 'student') {
      router.push(body.me?.role === 'teacher' ? '/teacher' : '/admin/dashboard');
      return;
    }
    setData(body);
    setSubject((current) => current || body.enrolments?.[0]?.subject_name || '');
    setEnrolmentId((current: number | null) => current || body.enrolments?.[0]?.id || null);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!enrolmentId) return;
    fetch(`/api/portal/messages?enrolmentId=${enrolmentId}`).then((response) => response.json()).then((body) => setMessages(body.messages || []));
  }, [enrolmentId]);

  async function join(id: number) {
    const response = await fetch(`/api/portal/join?id=${id}`);
    const body = await response.json();
    if (body.url) window.location.href = body.url;
    else setNotice(body.message || body.error || 'The Zoom link is not available.');
  }

  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enrolmentId) return;
    const file = (event.currentTarget.elements.namedItem('file') as HTMLInputElement).files?.[0];
    const payload = new FormData();
    payload.set('enrolmentId', String(enrolmentId));
    payload.set('body', text);
    if (file) payload.set('file', file);
    const response = await fetch('/api/portal/messages', { method: 'POST', body: payload });
    const body = await response.json();
    setNotice(body.error || 'Sent to your teacher.');
    setText('');
    event.currentTarget.reset();
    const next = await fetch(`/api/portal/messages?enrolmentId=${enrolmentId}`).then((item) => item.json());
    setMessages(next.messages || []);
  }

  async function leave(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch('/api/portal/leave', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: Number(sessionId), reason }) });
    const body = await response.json();
    setNotice(body.error || 'Leave granted. One replacement class was added and your teacher was notified.');
    load();
  }

  if (!data) return <main className="min-h-screen bg-[#FAFAFA] p-8 text-sm">Opening your student desk…</main>;
  const courses = data.enrolments || [];
  const chosen = courses.find((row: any) => row.subject_name === subject);
  const sessions = (data.sessions || []).filter((item: any) => !chosen || item.enrolment_id === chosen.id);
  const nextClass = [...(data.sessions || [])]
    .filter((item: any) => item.starts_at && ['Scheduled', 'Rescheduled'].includes(item.status) && new Date(item.starts_at).getTime() >= Date.now() - 30 * 60 * 1000)
    .sort((a: any, b: any) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())[0];

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#21152D]">
      <AdminTopBar userName={data.me.name} userEmail={data.me.email} homeHref="/student" />
      <div className="flex min-h-[calc(100vh-57px)] flex-col lg:flex-row">
      <aside className="w-full border-r border-[#F0ECEE] bg-white p-3 lg:w-64">
        <div className="mb-3 flex items-center gap-2.5 px-2">
          <img src="/tutorastra-logo.jpg" alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-[#F4CC45]" />
          <span className="text-sm font-bold text-[#310064]">TutorAstra</span>
        </div>
        {NAV.map((item) => (
          <button key={item} type="button" onClick={() => setView(item)} className={`mb-1 block w-full rounded-xl px-3.5 py-2.5 text-left text-xs font-bold ${view === item ? 'bg-[#310064] text-white' : 'text-slate-700 hover:bg-slate-100'}`}>{item}</button>
        ))}
      </aside>
      <section className="flex-1 p-5 sm:p-8">
        <h1 className="font-[Poppins,sans-serif] text-3xl font-semibold">{hello(data.me.name)}</h1>
        <p className="mt-1 text-sm text-[#51475B]">Keep learning. Your classes and your teacher are on this desk.</p>
        {notice && <p className="mt-4 rounded-xl bg-white px-3 py-2 text-sm">{notice}</p>}

        {view === 'Teacher' && (
          <div className="mt-6 space-y-4">
            <section className="rounded-2xl bg-[#310064] p-5 text-white">
              <p className="text-xs font-bold text-[#F4CC45]">Next class</p>
              {nextClass ? (
                <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold">{nextClass.subject_name}</p>
                    <p className="text-sm">{nextClass.teacher_name}</p>
                    <p className="text-sm text-white/80">{when(nextClass.starts_at)}</p>
                  </div>
                  <button type="button" onClick={() => join(nextClass.id)} className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-[#310064]">Class link</button>
                </div>
              ) : <p className="mt-2 text-sm">No class is waiting. Your subjects are in the cards below.</p>}
            </section>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Teacher', 'Who teaches you'],
                ['Subject', 'Dates still ahead'],
                ['Calendar', 'This month'],
                ['Chat', 'Messages that stay'],
              ].map(([label, text]) => (
                <button key={label} type="button" onClick={() => setView(label as (typeof NAV)[number])} className="rounded-2xl border border-[#E8E2ED] bg-white p-4 text-left hover:border-[#310064]">
                  <p className="font-bold text-[#310064]">{label}</p>
                  <p className="mt-1 text-sm text-[#51475B]">{text}</p>
                </button>
              ))}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {courses.map((row: any) => (
                <article key={row.id} className="rounded-2xl border border-[#E8E2ED] bg-white p-4 text-sm">
                  <p className="text-xs font-bold text-[#51475B]">Teacher</p>
                  <p className="font-bold text-[#310064]">{row.teacher_name}</p>
                  <p className="mt-2"><span className="font-bold">Subject:</span> {row.subject_name}</p>
                  <p><span className="font-bold">Classes left:</span> {row.balance?.remaining} of {row.total_classes}</p>
                  {row.subject_details && <p className="mt-1 text-[#51475B]">{row.subject_details}</p>}
                </article>
              ))}
              {courses.length === 0 && <p className="text-sm">No teacher is assigned yet.</p>}
            </div>
          </div>
        )}
        {view === 'Subject' && (
          <div className="mt-6 space-y-3">
            <Field label="Select subject">
              <select value={subject} onChange={(event) => setSubject(event.target.value)} className={control}>
                {courses.map((row: any) => <option key={row.id} value={row.subject_name}>{row.subject_name}</option>)}
              </select>
            </Field>
            {chosen?.subject_details && <p className="rounded-xl bg-white p-3 text-sm">{chosen.subject_details}</p>}
            {sessions.map((item: any) => (
              <article key={item.id} className="rounded-xl bg-white p-3 text-sm">
                <p><span className="font-bold">Class:</span> {item.session_number}</p>
                <p><span className="font-bold">Teacher:</span> {item.teacher_name}</p>
                <p><span className="font-bold">When:</span> {when(item.starts_at)}</p>
                <p><span className="font-bold">Status:</span> {item.status}</p>
              </article>
            ))}
          </div>
        )}
        {view === 'Calendar' && <div className="mt-6"><CalendarDesk /></div>}
        {view === 'Notifications' && <StudentNotices />}
        {view === 'Chat' && <div className="mt-6"><ChatDesk mine={data.me.id} /></div>}
        {view === 'Profile' && <StudentProfile name={data.me.name} />}

        {view === 'Leave' && (
          <form onSubmit={leave} className="mt-6 max-w-lg rounded-2xl bg-white p-4 text-sm">
            <h2 className="font-semibold">Leave</h2>
            <p className="mt-2 text-[#51475B]">Two accepted leaves per subject each month. Apply at least 12 hours before the class. An accepted class is carried forward once.</p>
            <Field label="Select class">
            <select value={sessionId} onChange={(event) => setSessionId(event.target.value)} className="mt-3 w-full rounded-xl border p-2">
              <option value="">Choose the class</option>
              {(data.sessions || []).filter((item: any) => ['Scheduled', 'Rescheduled'].includes(item.status)).map((item: any) => <option key={item.id} value={item.id}>{item.subject_name} · {when(item.starts_at)}</option>)}
            </select>
            </Field>
            <Field label="Reason">
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} className="mt-3 w-full rounded-xl border p-3" rows={3} />
            </Field>
            <button className="mt-3 rounded-xl bg-[#310064] px-4 py-2 font-bold text-white">Apply</button>
          </form>
        )}
      </section>
      </div>
    </div>
  );
}

function StudentNotices() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/portal/desk?kind=notifications').then((response) => response.json()).then((body) => setRows(body.notifications || []));
  }, []);
  return <div className="mt-6 space-y-2">{rows.map((row) => <NoticeCard key={row.id} row={row} />)}{rows.length === 0 && <p className="text-sm">No notification yet.</p>}</div>;
}

function StudentProfile({ name }: { name: string }) {
  const [nextName, setNextName] = useState(name);
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState('');
  return (
    <form className="mt-6 max-w-md space-y-2 rounded-2xl bg-white p-4" onSubmit={async (event) => {
      event.preventDefault();
      const response = await fetch('/api/portal/desk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'profile', name: nextName, password }) });
      const body = await response.json();
      setNotice(body.error || 'Profile saved.');
    }}>
      <Field label="Name"><input value={nextName} onChange={(event) => setNextName(event.target.value)} className={control} /></Field>
      <Field label="New password"><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className={control} /></Field>
      <button className="rounded-lg bg-[#310064] px-4 py-2 text-sm font-bold text-white">Save</button>
      {notice && <p className="text-sm">{notice}</p>}
    </form>
  );
}
