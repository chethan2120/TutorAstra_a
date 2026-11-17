'use client';

import React, { useEffect, useState } from 'react';
import { when } from '@/components/portal/Field';

export default function LeavePage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/portal/desk?kind=leave').then((response) => response.json()).then((body) => setRows(body.leaves || []));
  }, []);
  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-2xl font-black text-[#310064]">Leave</h1>
        <p className="mt-1 text-sm text-[#51475B]">Student and teacher leave stays here until you handle the class.</p>
      </div>
      {rows.map((row) => (
        <article key={row.id} className="rounded-xl border border-[#E8E2ED] bg-white p-4 text-sm">
          <p className="font-bold text-[#310064]">{row.person_name}</p>
          <p>Role: {row.role}</p>
          <p>Subject: {row.subject_name}</p>
          <p>Class time: {when(row.starts_at)}</p>
          <p>Requested: {when(row.requested_at)}</p>
          <p>Status: {row.status}</p>
          <p>Reason: {row.reason}</p>
        </article>
      ))}
      {rows.length === 0 && <p className="text-sm text-[#51475B]">No leave has been filed.</p>}
    </div>
  );
}
