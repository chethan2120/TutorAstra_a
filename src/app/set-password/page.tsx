'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SetPasswordForm() {
  const params = useSearchParams();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await fetch('/api/portal/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: params.get('token'), password }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error);
      return;
    }
    setMessage(`Password saved for ${body.email}. You can sign in.`);
  };

  return (
    <form onSubmit={submit} className="mx-auto mt-16 max-w-md space-y-3 rounded-lg border bg-white p-6">
      <h1 className="text-2xl font-black text-[#310064]">Set your password</h1>
      {error && <p className="text-sm text-rose-700">{error}</p>}
      {message && <p className="text-sm text-[#310064]">{message} <a href="/login">Sign in</a></p>}
      <input required type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="New password" />
      <button className="rounded-lg bg-[#310064] px-4 py-2 text-sm font-bold text-white">Save password</button>
    </form>
  );
}

export default function SetPasswordPage() {
  return <Suspense><SetPasswordForm /></Suspense>;
}
