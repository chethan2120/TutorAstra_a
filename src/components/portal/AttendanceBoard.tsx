'use client';

import React, { useMemo, useState } from 'react';
import { Field, control, when } from '@/components/portal/Field';

export default function AttendanceBoard({ rows, canMark = false, onChanged }: { rows: any[]; canMark?: boolean; onChanged?: () => void }) {
  const [teacher, setTeacher] = useState('all');
  const [student, setStudent] = useState('all');
  const [status, setStatus] = useState('all');
  const [day, setDay] = useState('');
  const [notice, setNotice] = useState('');

  const teachers = useMemo(() => Array.from(new Set(rows.map((row) => row.teacher_name).filter(Boolean))), [rows]);
  const students = useMemo(() => Array.from(new Set(rows.map((row) => row.student_name).filter(Boolean))), [rows]);
  const filtered = rows.filter((row) => {
    if (teacher !== 'all' && row.teacher_name !== teacher) return false;
    if (student !== 'all' && row.student_name !== student) return false;
    if (status !== 'all' && row.status !== status) return false;
    if (day) {
      if (!row.starts_at) return false;
      const key = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(row.starts_at));
      if (key !== day) return false;
    }
    return true;
  });

  async function mark(id: number, next: string) {
    const response = await fetch('/api/portal/desk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'attendance', sessionId: id, status: next }) });
    const body = await response.json();
    setNotice(body.error || `Class ${id} marked ${next}.`);
    onChanged?.();
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-2xl border border-[#E8E2ED] bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Filter by date">
          <input type="date" value={day} onChange={(event) => setDay(event.target.value)} className={control} />
        </Field>
        <Field label="Select teacher">
          <select value={teacher} onChange={(event) => setTeacher(event.target.value)} className={control}>
            <option value="all">All teachers</option>
            {teachers.map((name) => <option key={name}>{name}</option>)}
          </select>
        </Field>
        <Field label="Select student">
          <select value={student} onChange={(event) => setStudent(event.target.value)} className={control}>
            <option value="all">All students</option>
            {students.map((name) => <option key={name}>{name}</option>)}
          </select>
        </Field>
        <Field label="Select status">
          <select value={status} onChange={(event) => setStatus(event.target.value)} className={control}>
            {['all', 'Scheduled', 'Rescheduled', 'Completed', 'No Show', 'Leave Approved', 'Credit', 'Cancelled'].map((item) => <option key={item} value={item}>{item === 'all' ? 'All statuses' : item}</option>)}
          </select>
        </Field>
      </div>
      {notice && <p className="rounded-lg bg-[#F5F0FA] px-3 py-2 text-sm">{notice}</p>}
      <div className="overflow-x-auto rounded-2xl border border-[#E8E2ED] bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#FAF9FC] text-xs font-bold text-[#51475B]">
            <tr>
              <th className="px-3 py-2">Class ID</th>
              <th className="px-3 py-2">Date and time</th>
              <th className="px-3 py-2">Student</th>
              <th className="px-3 py-2">Teacher</th>
              <th className="px-3 py-2">Subject</th>
              <th className="px-3 py-2">Status</th>
              {canMark && <th className="px-3 py-2">Mark</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-t border-[#F0ECEE]">
                <td className="px-3 py-2">{row.id}</td>
                <td className="px-3 py-2">{when(row.starts_at)}</td>
                <td className="px-3 py-2">{row.student_name}</td>
                <td className="px-3 py-2">{row.teacher_name}</td>
                <td className="px-3 py-2">{row.subject_name}</td>
                <td className="px-3 py-2">{row.status}</td>
                {canMark && (
                  <td className="px-3 py-2">
                    {['Scheduled', 'Rescheduled'].includes(row.status) ? (
                      <div className="flex gap-2">
                        <button type="button" className="rounded-lg bg-[#310064] px-2 py-1 text-xs font-bold text-white" onClick={() => mark(row.id, 'Completed')}>Present</button>
                        <button type="button" className="rounded-lg border px-2 py-1 text-xs font-bold" onClick={() => mark(row.id, 'No Show')}>Absent</button>
                      </div>
                    ) : <span className="text-xs text-[#51475B]">Recorded</span>}
                  </td>
                )}
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={canMark ? 7 : 6} className="px-3 py-6 text-sm text-[#51475B]">No class matches these filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
