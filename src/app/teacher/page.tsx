'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminTopBar, DeskMenuProvider, SideDrawer, useDeskMenu } from '@/components/AdminNav';
import ChatDesk from '@/components/portal/ChatDesk';
import CalendarDesk from '@/components/portal/CalendarDesk';
import AttendanceBoard from '@/components/portal/AttendanceBoard';
import { Field, NoticeCard, control, when } from '@/components/portal/Field';

type SessionRow = {
  id: number;
  student_id: number;
  student_name: string;
  subject_name: string;
  starts_at: string | null;
  ends_at: string | null;
  status: string;
  session_number: number;
  enrolment_id: number;
};

const NAV = ['Dashboard', 'Students', 'Attendance', 'Calendar', 'Notifications', 'Assign class', 'Chat', 'Leave', 'Profile'] as const;

function hello(name: string) {
  const hour = new Date().getHours();
  const part = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return `${part}, ${name}`;
}

function TeacherMenu({ view, setView }: { view: (typeof NAV)[number]; setView: (item: (typeof NAV)[number]) => void }) {
  const { setOpen } = useDeskMenu();
  return (
    <SideDrawer>
      <div className="mb-3 flex items-center gap-2.5 px-2">
        <img src="/tutorastra-logo.jpg" alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-[#F4CC45]" />
        <span className="text-sm font-bold text-[#310064]">TutorAstra</span>
      </div>
      <nav className="space-y-0.5">
        {NAV.map((item) => (
          <button key={item} type="button" onClick={() => { setView(item); setOpen(false); }} className={`block w-full rounded-xl px-3.5 py-2.5 text-left text-xs font-bold ${view === item ? 'bg-[#310064] text-white' : 'text-slate-700 hover:bg-slate-100'}`}>{item}</button>
        ))}
      </nav>
    </SideDrawer>
  );
}

export default function TeacherDesk() {
  const router = useRouter();
  const [view, setView] = useState<(typeof NAV)[number]>('Dashboard');
  const [data, setData] = useState<any>(null);
  const [notice, setNotice] = useState('');
  const [studentId, setStudentId] = useState<number | null>(null);
  const [enrolmentId, setEnrolmentId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [text, setText] = useState('');

  async function load() {
    const response = await fetch('/api/portal/home');
    if (response.status === 401) {
      router.push('/login');
      return;
    }
    const body = await response.json();
    if (body.me?.role !== 'teacher') {
      router.push(body.me?.role === 'student' ? '/student' : '/admin/dashboard');
      return;
    }
    setData(body);
    const first = body.enrolments?.[0]?.id || null;
    setEnrolmentId((current: number | null) => current || first);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!enrolmentId) return;
    fetch(`/api/portal/messages?enrolmentId=${enrolmentId}`).then((response) => response.json()).then((body) => setMessages(body.messages || []));
  }, [enrolmentId]);

  const students = useMemo(() => {
    const map = new Map<number, string>();
    (data?.enrolments || []).forEach((row: any) => map.set(row.student_id, row.student_name));
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [data]);

  const week = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      const key = day.toDateString();
      const items = (data?.sessions || []).filter((item: SessionRow) => item.starts_at && new Date(item.starts_at).toDateString() === key && ['Scheduled', 'Rescheduled'].includes(item.status));
      return { label: day.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }), items };
    });
  }, [data]);

  async function punch(action: 'in' | 'out') {
    const response = await fetch('/api/portal/staff-chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
    const body = await response.json();
    setNotice(body.error || (action === 'in' ? 'Punched in.' : 'Punched out.'));
    load();
  }

  async function join(id: number) {
    const response = await fetch(`/api/portal/join?id=${id}`);
    const body = await response.json();
    if (body.url) window.location.href = body.url;
    else setNotice(body.message || body.error || 'The Zoom link is not available.');
  }

  async function send(event: React.FormEvent<HTMLFormElement>, target: 'student' | 'admin') {
    event.preventDefault();
    const form = event.currentTarget;
    const file = (form.elements.namedItem('file') as HTMLInputElement).files?.[0];
    if (target === 'admin') {
      const response = await fetch('/api/portal/staff-chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body: text }) });
      const body = await response.json();
      setNotice(body.error || 'Sent to admin.');
      setText('');
      const next = await fetch('/api/portal/staff-chat').then((response) => response.json());
      setStaff(next.messages || []);
      return;
    }
    if (!enrolmentId) return;
    const payload = new FormData();
    payload.set('enrolmentId', String(enrolmentId));
    payload.set('body', text);
    if (file) payload.set('file', file);
    const response = await fetch('/api/portal/messages', { method: 'POST', body: payload });
    const body = await response.json();
    setNotice(body.error || 'Sent to the student.');
    setText('');
    form.reset();
    const next = await fetch(`/api/portal/messages?enrolmentId=${enrolmentId}`).then((response) => response.json());
    setMessages(next.messages || []);
  }

  if (!data) return <main className="min-h-screen bg-[#FAFAFA] p-8 text-sm text-[#51475B]">Opening your teaching desk…</main>;
  const open = data.punch && !data.punch.punched_out_at;
  const elapsed = open ? Math.floor((Date.now() - new Date(data.punch.punched_in_at).getTime()) / 60000) : 0;
  const selectedStudent = students.find((item) => item.id === studentId);

  return (
    <DeskMenuProvider>
    <div className="flex min-h-dvh flex-col bg-[#FAFAFA] text-[#21152D]">
      <AdminTopBar userName={data.me.name} userEmail={data.me.email} homeHref="/teacher" />
      <div className="flex min-h-0 flex-1">
      <TeacherMenu view={view} setView={setView} />
      <section className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-8">
        <h1 className="font-[Poppins,sans-serif] text-2xl font-semibold">{hello(data.me.name)}</h1>
        <p className="mt-1 text-sm text-[#51475B]">Here’s your teaching and attendance overview.</p>
        {notice && <p className="mt-4 rounded-lg bg-white px-3 py-2 text-sm">{notice}</p>}

        {view === 'Dashboard' && (
          <div className="mt-6 space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <article className="rounded-2xl border border-[#E8E2ED] bg-white p-4">
                <p className="text-xs font-bold text-[#51475B]">Students</p>
                <p className="mt-2 text-3xl font-black">{students.length}</p>
              </article>
              <article className="rounded-2xl border border-[#E8E2ED] bg-white p-4">
                <p className="text-xs font-bold text-[#51475B]">Today</p>
                <p className="mt-2 text-3xl font-black">{data.todays?.length || 0}</p>
              </article>
              <article className="rounded-2xl border border-[#E8E2ED] bg-white p-4">
                <p className="text-xs font-bold text-[#51475B]">Attendance</p>
                <p className="mt-2 text-sm font-bold">{open ? 'In class' : 'Not punched in'}</p>
                {open && <p className="text-xs text-[#51475B]">Since {when(data.punch.punched_in_at)} · {elapsed} min</p>}
                <button type="button" onClick={() => punch(open ? 'out' : 'in')} className="mt-3 rounded-xl bg-[#310064] px-4 py-2 text-xs font-bold text-white">{open ? 'Punch out' : 'Punch in'}</button>
              </article>
            </div>
            <section className="rounded-2xl bg-[#310064] p-5 text-white">
              <p className="text-xs font-bold text-[#F4CC45]">Today</p>
              {(data.todays || []).length === 0 && <p className="mt-2 text-sm">No class is booked for today. The week is on the cards below.</p>}
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {(data.todays || []).map((item: SessionRow) => (
                  <article key={item.id} className="rounded-xl bg-white/10 p-3 text-sm">
                    <p className="font-bold">{item.subject_name}</p>
                    <p>{item.student_name}</p>
                    <p>{when(item.starts_at)}</p>
                    <button type="button" onClick={() => join(item.id)} className="mt-2 text-xs font-bold text-[#F4CC45]">Open class link</button>
                  </article>
                ))}
              </div>
            </section>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {week.map((day) => (
                <article key={day.label} className="min-h-28 rounded-2xl border border-[#E8E2ED] bg-white p-2 text-xs">
                  <p className="font-bold">{day.label}</p>
                  {day.items.map((item: SessionRow) => <p key={item.id} className="mt-2">{item.student_name}<br />{item.subject_name}</p>)}
                </article>
              ))}
            </div>
          </div>
        )}

        {view === 'Students' && (
          <div className="mt-6 grid gap-4 lg:grid-cols-[220px_1fr]">
            <div className="rounded-2xl bg-white p-3">
              {students.map((student) => (
                <button key={student.id} type="button" onClick={() => setStudentId(student.id)} className={`mb-1 block w-full rounded-lg px-3 py-2 text-left text-sm ${studentId === student.id ? 'bg-[#F5F0FA] font-bold' : ''}`}>{student.name}</button>
              ))}
              {students.length === 0 && <p className="text-sm">No students are assigned.</p>}
            </div>
            <div className="rounded-2xl bg-white p-4">
              <h2 className="font-semibold">{selectedStudent ? `${selectedStudent.name}` : 'Select a student'}</h2>
              <p className="mt-1 text-sm text-[#51475B]">{students.length} student{students.length === 1 ? '' : 's'} under you.</p>
              {(data.sessions || []).filter((item: SessionRow) => item.student_id === studentId).map((item: SessionRow) => (
                <p key={item.id} className="mt-3 border-t border-[#E8E2ED] pt-3 text-sm">
                  <span className="font-bold">Subject:</span> {item.subject_name}<br />
                  <span className="font-bold">Class:</span> {item.session_number}<br />
                  <span className="font-bold">When:</span> {when(item.starts_at)}<br />
                  <span className="font-bold">Status:</span> {item.status}
                </p>
              ))}
            </div>
          </div>
        )}

        {view === 'Chat' && <div className="mt-6"><ChatDesk mine={data.me.id} /></div>}
        {view === 'Calendar' && <div className="mt-6"><CalendarDesk /></div>}
        {view === 'Attendance' && <div className="mt-6"><AttendanceBoard rows={data.sessions || []} canMark onChanged={load} /></div>}
        {view === 'Notifications' && <NoticeList />}
        {view === 'Assign class' && (
          <div className="mt-6 space-y-2">
            {(data.enrolments || []).map((row: any) => (
              <article key={row.id} className="rounded-xl bg-white p-4 text-sm">
                <p><span className="font-bold">Student:</span> {row.student_name}</p>
                <p><span className="font-bold">Subject:</span> {row.subject_name}</p>
                <p><span className="font-bold">Classes remaining:</span> {row.balance.remaining} of {row.total_classes}</p>
                {row.subject_details && <p><span className="font-bold">Details:</span> {row.subject_details}</p>}
              </article>
            ))}
            {data.enrolments?.length === 0 && <p className="text-sm">No class is assigned to you yet.</p>}
          </div>
        )}
        {view === 'Leave' && (
          <div className="mt-6 space-y-2">
            <p className="text-sm text-[#51475B]">Leave filed on your classes stays in this list.</p>
            {(data.sessions || []).filter((item: SessionRow) => item.status === 'Leave Approved' || item.status === 'Credit').map((item: SessionRow) => (
              <article key={item.id} className="rounded-xl bg-white p-3 text-sm">
                <p className="font-bold">{item.student_name}</p>
                <p>Subject: {item.subject_name}</p>
                <p>When: {when(item.starts_at)}</p>
                <p>Status: {item.status}</p>
              </article>
            ))}
          </div>
        )}
        {view === 'Profile' && <ProfileBit name={data.me.name} />}
      </section>
      </div>
    </div>
    </DeskMenuProvider>
  );
}

function ProfileBit({ name }: { name: string }) {
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
      <h2 className="font-semibold">Profile</h2>
      <Field label="Name"><input value={nextName} onChange={(event) => setNextName(event.target.value)} className={control} /></Field>
      <Field label="New password"><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className={control} /></Field>
      <Field label="Profile image">
      <input type="file" accept="image/*" onChange={(event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => fetch('/api/portal/desk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'profile', avatar: String(reader.result || '') }) });
        reader.readAsDataURL(file);
      }} />
      </Field>
      <button className="rounded-lg bg-[#310064] px-4 py-2 text-sm font-bold text-white">Save</button>
      {notice && <p className="text-sm">{notice}</p>}
    </form>
  );
}

function NoticeList() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/portal/desk?kind=notifications').then((response) => response.json()).then((body) => setRows(body.notifications || []));
    fetch('/api/portal/desk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'read-notifications' }) });
  }, []);
  return <div className="mt-6 space-y-2">{rows.map((row) => <NoticeCard key={row.id} row={row} />)}{rows.length === 0 && <p className="text-sm">No notification yet.</p>}</div>;
}
