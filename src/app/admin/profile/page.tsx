'use client';

import React, { useEffect, useState } from 'react';
import { Field, control } from '@/components/portal/Field';

const MODULES = ['Dashboard', 'Students', 'Attendance', 'Calendar', 'Notifications', 'Chat', 'Leave', 'Subject', 'Teacher'];

export default function ProfilePage() {
  const [me, setMe] = useState<any>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [people, setPeople] = useState<any[]>([]);
  const [userId, setUserId] = useState('');
  const [access, setAccess] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState('');

  useEffect(() => {
    fetch('/api/portal/home').then((response) => response.json()).then((body) => { setMe(body.me); setName(body.me?.name || ''); });
    fetch('/api/portal/users').then((response) => response.json()).then((body) => setPeople([...(body.teachers || []), ...(body.students || [])]));
  }, []);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-black text-[#310064]">Profile</h1>
      {notice && <p className="rounded-lg bg-[#F5F0FA] px-3 py-2 text-sm">{notice}</p>}
      {me?.avatar && <img src={me.avatar} alt="" className="h-16 w-16 rounded-full object-cover" />}
      <form className="grid gap-3 rounded-2xl border border-[#E8E2ED] bg-white p-4" onSubmit={async (event) => {
        event.preventDefault();
        const response = await fetch('/api/portal/desk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'profile', name, password }) });
        const body = await response.json();
        setNotice(body.error || 'Profile saved.');
      }}>
        <Field label="Name"><input value={name} onChange={(event) => setName(event.target.value)} className={control} /></Field>
        <Field label="New password"><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className={control} /></Field>
        <Field label="Profile image">
          <input type="file" accept="image/*" onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async () => {
              const response = await fetch('/api/portal/desk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'profile', avatar: String(reader.result || '') }) });
              const body = await response.json();
              setNotice(body.error || 'Photo saved.');
            };
            reader.readAsDataURL(file);
          }} />
        </Field>
        <button className="rounded-lg bg-[#310064] px-4 py-2 text-sm font-bold text-white">Save profile</button>
      </form>
      <form className="grid gap-2 rounded-2xl border border-[#E8E2ED] bg-white p-4" onSubmit={async (event) => {
        event.preventDefault();
        const response = await fetch('/api/portal/desk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'profile', accessUserId: Number(userId), access }) });
        const body = await response.json();
        setNotice(body.error || 'Access saved for that account.');
      }}>
        <h2 className="font-bold text-[#310064]">What another account can open</h2>
        <Field label="Select account">
          <select required value={userId} onChange={(event) => setUserId(event.target.value)} className={control}>
            <option value="">Choose a person</option>
            {people.map((person) => <option key={person.id} value={person.id}>{person.role ? '' : ''}{person.name}</option>)}
          </select>
        </Field>
        {MODULES.map((item) => (
          <label key={item} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={access[item] !== false} onChange={(event) => setAccess({ ...access, [item]: event.target.checked })} /> {item}</label>
        ))}
        <button className="rounded-lg bg-[#310064] px-4 py-2 text-sm font-bold text-white">Save access</button>
      </form>
    </div>
  );
}
