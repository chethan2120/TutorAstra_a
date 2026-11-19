'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function DemoPopup() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('ta-demo-dismissed') === '1') return;
    const timer = window.setTimeout(() => setOpen(true), 4000);
    return () => window.clearTimeout(timer);
  }, []);

  const close = () => {
    sessionStorage.setItem('ta-demo-dismissed', '1');
    setOpen(false);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (name.trim().length < 2) {
      setError('Enter your name.');
      return;
    }
    if ((phone.match(/\d/g) || []).length < 7) {
      setError('Enter a valid phone number.');
      return;
    }
    setSending(true);
    try {
      const response = await fetch('/api/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'demo', name, phone }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'We could not save this request.');
        return;
      }
      setDone(true);
      sessionStorage.setItem('ta-demo-dismissed', '1');
    } catch {
      setError('We could not save this request.');
    } finally {
      setSending(false);
    }
  };

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#21152D]/40 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="demo-title">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <h2 id="demo-title" className="font-display text-2xl font-bold text-[#310064]">Book a demo</h2>
          <button type="button" onClick={close} className="text-sm font-semibold text-[#51475B]" aria-label="Close">
            Close
          </button>
        </div>
        <p className="mt-2 text-sm leading-6 text-[#51475B]">Leave a name and a number. We will use them to arrange a conversation. This does not confirm a class.</p>
        {done ? (
          <p className="mt-5 rounded-lg bg-[#F5F0FA] px-3 py-3 text-sm text-[#310064]" role="status">Request received. We will use this number to reply.</p>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-3">
            <label className="block text-sm font-semibold text-[#310064]">
              Name
              <input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-lg border border-[#E8E2ED] px-3 py-2.5 text-sm font-normal text-[#21152D] outline-none focus:border-[#310064]" autoComplete="name" />
            </label>
            <label className="block text-sm font-semibold text-[#310064]">
              Number
              <input value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1 w-full rounded-lg border border-[#E8E2ED] px-3 py-2.5 text-sm font-normal text-[#21152D] outline-none focus:border-[#310064]" autoComplete="tel" inputMode="tel" />
            </label>
            {error && <p className="text-sm text-rose-700" role="alert">{error}</p>}
            <button type="submit" disabled={sending} className="w-full rounded-lg bg-[#310064] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#240047] disabled:opacity-70">
              {sending ? 'Sending' : 'Book a demo'}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
