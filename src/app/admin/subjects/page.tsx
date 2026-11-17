'use client';

import React, { useEffect, useState } from 'react';
import { Field, control } from '@/components/portal/Field';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [details, setDetails] = useState('');
  const [notice, setNotice] = useState('');
  const load = () => fetch('/api/portal/users').then((response) => response.json()).then((body) => setSubjects(body.subjects || []));
  useEffect(() => { load(); }, []);
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-black text-[#310064]">Subjects</h1>
        <p className="mt-1 text-sm text-[#51475B]">Add the subject name and a short note about what the classes cover.</p>
      </div>
      {notice && <p className="rounded-lg bg-[#F5F0FA] px-3 py-2 text-sm">{notice}</p>}
      <form className="grid gap-3 rounded-2xl border border-[#E8E2ED] bg-white p-4" onSubmit={async (event) => {
        event.preventDefault();
        const response = await fetch('/api/portal/desk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'subject', name, details }) });
        const body = await response.json();
        setNotice(body.error || 'Subject added.');
        setName('');
        setDetails('');
        load();
      }}>
        <Field label="Subject name"><input value={name} onChange={(event) => setName(event.target.value)} required className={control} /></Field>
        <Field label="Subject details"><textarea value={details} onChange={(event) => setDetails(event.target.value)} rows={3} className={control} placeholder="What this subject covers" /></Field>
        <button className="rounded-lg bg-[#310064] px-4 py-2 text-sm font-bold text-white">Add subject</button>
      </form>
      {subjects.map((subject) => (
        <article key={subject.id} className="rounded-xl border border-[#E8E2ED] bg-white p-4 text-sm">
          <p className="font-bold text-[#310064]">{subject.name}</p>
          <p className="text-[#51475B]">Subject ID {subject.id}</p>
          <p className="mt-1">{subject.details || 'No details added yet.'}</p>
        </article>
      ))}
    </div>
  );
}
