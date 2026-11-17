'use client';

import React, { useEffect, useState } from 'react';
import { Field, NoticeCard, control } from '@/components/portal/Field';

export default function NotificationsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState('all');
  const [notice, setNotice] = useState('');
  const load = () => fetch('/api/portal/desk?kind=notifications').then((response) => response.json()).then((data) => setRows(data.notifications || []));
  useEffect(() => { load(); }, []);
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="text-2xl font-black text-[#310064]">Notifications</h1>
        <p className="mt-1 text-sm text-[#51475B]">The date, time and “sent by Admin” are added automatically. The note stays in each inbox.</p>
      </div>
      {notice && <p className="rounded-lg bg-[#F5F0FA] px-3 py-2 text-sm">{notice}</p>}
      <form className="grid gap-3 rounded-2xl border border-[#E8E2ED] bg-white p-4" onSubmit={async (event) => {
        event.preventDefault();
        const response = await fetch('/api/portal/desk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'notification', title, body, audience }) });
        const saved = await response.json();
        setNotice(saved.error || 'Sent. The date and time are on the notification.');
        setTitle('');
        setBody('');
        load();
      }}>
        <Field label="Title"><input value={title} onChange={(event) => setTitle(event.target.value)} required className={control} /></Field>
        <Field label="Message"><textarea value={body} onChange={(event) => setBody(event.target.value)} required className={control} rows={3} /></Field>
        <Field label="Send to">
          <select value={audience} onChange={(event) => setAudience(event.target.value)} className={control}>
            <option value="all">Everyone</option>
            <option value="teachers">Teachers</option>
            <option value="students">Students</option>
          </select>
        </Field>
        <button className="rounded-lg bg-[#310064] px-4 py-2 text-sm font-bold text-white">Send notification</button>
      </form>
      {rows.map((row) => <NoticeCard key={row.id} row={row} />)}
    </div>
  );
}
