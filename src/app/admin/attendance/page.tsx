'use client';

import React, { useEffect, useState } from 'react';
import AttendanceBoard from '@/components/portal/AttendanceBoard';
import { when } from '@/components/portal/Field';

export default function AttendancePage() {
  const [rows, setRows] = useState<any[]>([]);
  const [punches, setPunches] = useState<any[]>([]);
  function load() {
    fetch('/api/portal/desk?kind=attendance').then((response) => response.json()).then((body) => {
      setRows(body.sessions || []);
      setPunches(body.punches || []);
    });
  }
  useEffect(() => { load(); }, []);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black text-[#310064]">Attendance</h1>
        <p className="mt-1 text-sm text-[#51475B]">Filter a class, then mark it present or absent. The record stays until you change it.</p>
      </div>
      <AttendanceBoard rows={rows} canMark onChanged={load} />
      <section className="rounded-2xl border border-[#E8E2ED] bg-white p-4">
        <h2 className="font-bold text-[#310064]">Teacher punch times</h2>
        <div className="mt-3 space-y-2 text-sm">
          {punches.map((row) => <p key={row.id}>{row.name} · In {when(row.punched_in_at)} · Out {row.punched_out_at ? when(row.punched_out_at) : 'Still in'}</p>)}
          {punches.length === 0 && <p className="text-[#51475B]">No teacher has punched in yet.</p>}
        </div>
      </section>
    </div>
  );
}
