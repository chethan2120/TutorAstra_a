'use client';

import React, { useEffect, useState } from 'react';
import { Field, accountCode, control, when } from '@/components/portal/Field';

export default function PeopleManager({ role, title }: { role: 'student' | 'teacher' | 'all'; title: string }) {
  const [data, setData] = useState<any>(null);
  const [notice, setNotice] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [createRole, setCreateRole] = useState<'student' | 'teacher'>(role === 'teacher' ? 'teacher' : 'student');
  const [filter, setFilter] = useState<'all' | 'student' | 'teacher'>(role === 'all' ? 'all' : role);
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [draft, setDraft] = useState({ name: '', phone: '' });

  const load = () => fetch('/api/portal/users').then((response) => response.json()).then(setData);
  useEffect(() => { load(); }, []);

  const pool = filter === 'teacher' ? data?.teachers || [] : filter === 'student' ? data?.students || [] : [...(data?.teachers || []), ...(data?.students || [])];
  const needle = query.trim().toLowerCase();
  const people = pool.filter((person: any) => !needle || `${person.name} ${person.email} ${person.phone || ''} ${accountCode(person.id)} ${person.id}`.toLowerCase().includes(needle));

  async function create(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch('/api/portal/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, role: role === 'all' ? createRole : role, timezone: 'Asia/Dubai' }),
    });
    const body = await response.json();
    setNotice(body.error || `Saved. Share this link because mail is not connected: ${body.activationPath || ''}`);
    setName('');
    setEmail('');
    setPhone('');
    load();
  }

  async function act(kind: string, userId: number, extra: Record<string, unknown> = {}) {
    const response = await fetch('/api/portal/desk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, userId, ...extra }) });
    const body = await response.json();
    setNotice(body.error || 'Saved.');
    load();
    if (preview?.person?.id === userId && kind === 'user') openPreview(userId);
  }

  async function openPreview(userId: number) {
    const response = await fetch(`/api/portal/desk?kind=preview&userId=${userId}`);
    const body = await response.json();
    if (!response.ok) { setNotice(body.error || 'Could not open this record.'); return; }
    setPreview(body);
    setDraft({ name: body.person.name || '', phone: body.person.phone || '' });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="text-2xl font-black text-[#310064]">{title}</h1>
        <p className="mt-1 text-sm text-[#51475B]">Name, ID, number, subjects and classes stay on the record until you change them.</p>
      </div>
      {notice && <p className="rounded-lg bg-[#F5F0FA] px-3 py-2 text-sm">{notice}</p>}
      <form onSubmit={create} className="grid gap-3 rounded-2xl border border-[#E8E2ED] bg-white p-4 sm:grid-cols-2">
        <Field label="Full name"><input required value={name} onChange={(event) => setName(event.target.value)} className={control} /></Field>
        <Field label="Email"><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={control} /></Field>
        <Field label="Phone number"><input value={phone} onChange={(event) => setPhone(event.target.value)} className={control} placeholder="Optional" /></Field>
        {role === 'all' && (
          <Field label="Account type">
            <select value={createRole} onChange={(event) => setCreateRole(event.target.value as 'student' | 'teacher')} className={control}>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </Field>
        )}
        <button className="self-end rounded-lg bg-[#310064] px-4 py-2 text-sm font-bold text-white">Create account</button>
      </form>
      <div className="grid gap-3 rounded-2xl border border-[#E8E2ED] bg-white p-4 sm:grid-cols-2">
        {role === 'all' && (
          <Field label="Show">
            <select value={filter} onChange={(event) => setFilter(event.target.value as 'all' | 'student' | 'teacher')} className={control}>
              <option value="all">Teachers and students</option>
              <option value="teacher">Teachers only</option>
              <option value="student">Students only</option>
            </select>
          </Field>
        )}
        <Field label="Search name, email or ID"><input value={query} onChange={(event) => setQuery(event.target.value)} className={control} /></Field>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-2">
          {people.map((person: any) => (
            <article key={person.id} className="rounded-2xl border border-[#E8E2ED] bg-white p-4 text-sm">
              <p className="font-bold text-[#310064]">{person.name}</p>
              <p className="text-[#51475B]">ID {accountCode(person.id)} · {person.role || (filter === 'teacher' ? 'teacher' : filter === 'student' ? 'student' : '')}</p>
              <p className="break-all">{person.email}</p>
              <p>Number: {person.phone || 'Not added'}</p>
              <p>{person.is_active ? 'Active' : 'Deactivated'}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" className="rounded-lg bg-[#310064] px-2 py-1 text-xs font-bold text-white" onClick={() => openPreview(person.id)}>Preview</button>
                <button type="button" className="rounded-lg border px-2 py-1 text-xs font-bold" onClick={() => act('user', person.id, { active: !person.is_active })}>{person.is_active ? 'Deactivate' : 'Activate'}</button>
                <button type="button" className="rounded-lg border px-2 py-1 text-xs font-bold text-rose-700" onClick={() => act('delete-user', person.id)}>Delete</button>
              </div>
            </article>
          ))}
          {people.length === 0 && <p className="text-sm text-[#51475B]">No account matches this list.</p>}
        </div>
        <aside className="rounded-2xl border border-[#E8E2ED] bg-white p-4 text-sm">
          {!preview && <p className="text-[#51475B]">Choose Preview to see the ID, number, subjects and classes.</p>}
          {preview && (
            <div className="space-y-3">
              <h2 className="text-lg font-black text-[#310064]">{preview.person.name}</h2>
              <p><span className="font-bold">ID:</span> {accountCode(preview.person.id)} ({preview.person.id})</p>
              <p><span className="font-bold">Role:</span> {preview.person.role}</p>
              <p><span className="font-bold">Email:</span> {preview.person.email}</p>
              <p><span className="font-bold">Status:</span> {preview.person.is_active ? 'Active' : 'Deactivated'}</p>
              <form className="grid gap-2" onSubmit={(event) => { event.preventDefault(); act('user', preview.person.id, draft); }}>
                <Field label="Name"><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className={control} /></Field>
                <Field label="Phone number"><input value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} className={control} /></Field>
                <button className="rounded-lg bg-[#310064] px-3 py-2 text-xs font-bold text-white">Save details</button>
              </form>
              <div>
                <p className="font-bold">Subjects</p>
                {(preview.subjects || []).map((subject: any) => <p key={subject.id}>{subject.name}{subject.details ? ` · ${subject.details}` : ''}</p>)}
                {preview.subjects?.length === 0 && <p className="text-[#51475B]">No subject is assigned yet.</p>}
              </div>
              <div>
                <p className="font-bold">Classes</p>
                {(preview.sessions || []).map((item: any) => (
                  <p key={item.id} className="mt-2 border-t border-[#F0ECEE] pt-2">
                    Class {item.id} · {item.subject_name}<br />
                    {item.student_name} with {item.teacher_name}<br />
                    {when(item.starts_at)} · {item.duration_minutes} min · {item.status}
                  </p>
                ))}
                {preview.sessions?.length === 0 && <p className="text-[#51475B]">No class is on this record yet.</p>}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
