import React from 'react';

export const control = 'w-full rounded-lg border border-[#E8E2ED] bg-white px-3 py-2 text-sm text-[#21152D]';

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-bold text-[#51475B]">{label}</span>
      {children}
    </label>
  );
}

export function when(value: string | null | undefined) {
  if (!value) return 'Date not set';
  const raw = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return 'Date not set';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dubai',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function sentLine(row: { created_at?: string; audience?: string }) {
  const who = row.audience === 'teachers' ? 'teachers' : row.audience === 'students' ? 'students' : 'everyone';
  return `Sent to ${who} by Admin · ${when(row.created_at)}`;
}

export function NoticeCard({ row }: { row: { id: number; title: string; body: string; created_at?: string; audience?: string } }) {
  return (
    <article className="rounded-xl border border-[#E8E2ED] bg-white p-4 text-sm">
      <p className="font-bold text-[#310064]">{row.title}</p>
      <p className="mt-1 whitespace-pre-wrap text-[#21152D]">{row.body}</p>
      <p className="mt-2 text-xs font-semibold text-[#51475B]">{sentLine(row)}</p>
    </article>
  );
}

export function accountCode(id: number) {
  return `TA-${String(id).padStart(4, '0')}`;
}
