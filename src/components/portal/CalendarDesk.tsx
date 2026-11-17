'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Field, control, when } from '@/components/portal/Field';

const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 13 }, (_, index) => index + 8);

function dubaiParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value || '';
  return { year: Number(get('year')), month: Number(get('month')), day: Number(get('day')) };
}

function dubaiKey(iso: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));
}

function dubaiHour(iso: string) {
  return Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dubai', hour: '2-digit', hourCycle: 'h23' }).format(new Date(iso)));
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

export default function CalendarDesk({ allowPeople = false }: { allowPeople?: boolean }) {
  const today = dubaiParts();
  const [cursor, setCursor] = useState({ year: today.year, month: today.month });
  const [selected, setSelected] = useState(`${today.year}-${pad(today.month)}-${pad(today.day)}`);
  const [people, setPeople] = useState<{ id: number; name: string; role?: string }[]>([]);
  const [userId, setUserId] = useState('');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!allowPeople) return;
    fetch('/api/portal/users').then((response) => response.json()).then((body) => {
      const teachers = (body.teachers || []).map((person: any) => ({ ...person, role: 'teacher' }));
      const students = (body.students || []).map((person: any) => ({ ...person, role: 'student' }));
      setPeople([...teachers, ...students]);
      if (teachers[0]) setUserId(String(teachers[0].id));
    });
  }, [allowPeople]);

  useEffect(() => {
    const query = userId ? `?kind=calendar&userId=${userId}` : '?kind=calendar';
    fetch(`/api/portal/desk${query}`).then((response) => response.json()).then(setData);
  }, [userId]);

  const byDay = useMemo(() => {
    const map = new Map<string, any[]>();
    (data?.sessions || []).forEach((item: any) => {
      if (!item.starts_at) return;
      const key = dubaiKey(item.starts_at);
      map.set(key, [...(map.get(key) || []), item]);
    });
    return map;
  }, [data]);

  const cells = useMemo(() => {
    const first = new Date(`${cursor.year}-${pad(cursor.month)}-01T12:00:00+04:00`);
    const weekday = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Dubai', weekday: 'short' }).format(first);
    const offset = WEEK.indexOf(weekday);
    const count = new Date(cursor.year, cursor.month, 0).getDate();
    const blanks = Array.from({ length: offset < 0 ? 0 : offset }, () => null);
    const days = Array.from({ length: count }, (_, index) => {
      const day = index + 1;
      const key = `${cursor.year}-${pad(cursor.month)}-${pad(day)}`;
      return { day, key, items: byDay.get(key) || [] };
    });
    return [...blanks, ...days];
  }, [cursor, byDay]);

  const selectedItems = byDay.get(selected) || [];
  const busy = new Set(selectedItems.flatMap((item: any) => {
    const start = dubaiHour(item.starts_at);
    const end = item.ends_at ? dubaiHour(item.ends_at) : start + 1;
    return HOURS.filter((hour) => hour >= start && hour < Math.max(end, start + 1));
  }));

  function shift(step: number) {
    setCursor((current) => {
      const next = current.month + step;
      if (next < 1) return { year: current.year - 1, month: 12 };
      if (next > 12) return { year: current.year + 1, month: 1 };
      return { year: current.year, month: next };
    });
  }

  const title = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(new Date(`${cursor.year}-${pad(cursor.month)}-01T12:00:00+04:00`));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-[#51475B]">Calendar for</p>
          <h2 className="text-lg font-black text-[#310064]">{data?.person?.name || 'Choose a person'}</h2>
        </div>
        {allowPeople && (
          <Field label="Select person">
            <select value={userId} onChange={(event) => setUserId(event.target.value)} className={control}>
              <option value="">My calendar</option>
              {people.map((person) => <option key={person.id} value={person.id}>{person.role === 'teacher' ? 'Teacher' : 'Student'} · {person.name}</option>)}
            </select>
          </Field>
        )}
      </div>

      <div className="rounded-2xl border border-[#E8E2ED] bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <button type="button" onClick={() => shift(-1)} className="rounded-lg border px-3 py-1 text-sm font-bold">Previous</button>
          <p className="font-black text-[#310064]">{title}</p>
          <button type="button" onClick={() => shift(1)} className="rounded-lg border px-3 py-1 text-sm font-bold">Next</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-[#51475B]">
          {WEEK.map((day) => <div key={day} className="py-1">{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, index) => cell ? (
            <button
              key={cell.key}
              type="button"
              onClick={() => setSelected(cell.key)}
              className={`min-h-20 rounded-lg border p-1 text-left text-xs ${selected === cell.key ? 'border-[#310064] bg-[#F5F0FA]' : 'border-[#F0ECEE] bg-white'}`}
            >
              <span className="font-bold">{cell.day}</span>
              {cell.items.slice(0, 2).map((item: any) => (
                <span key={item.id} className="mt-1 block truncate rounded bg-[#310064] px-1 py-0.5 text-[10px] text-white">{item.subject_name}</span>
              ))}
              {cell.items.length > 2 && <span className="mt-1 block text-[10px] text-[#51475B]">+{cell.items.length - 2} more</span>}
            </button>
          ) : <div key={`blank-${index}`} />)}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-2xl border border-[#E8E2ED] bg-white p-4">
          <h3 className="font-bold text-[#310064]">Classes on {selected}</h3>
          <div className="mt-3 space-y-2">
            {selectedItems.map((item: any) => (
              <div key={item.id} className="rounded-xl bg-[#FAF9FC] p-3 text-sm">
                <p className="font-bold">{item.subject_name}</p>
                <p>Student: {item.student_name}</p>
                <p>Teacher: {item.teacher_name}</p>
                <p>Time: {when(item.starts_at)}</p>
                <p>Length: {item.duration_minutes} minutes</p>
                <p>Status: {item.status}</p>
              </div>
            ))}
            {selectedItems.length === 0 && <p className="text-sm text-[#51475B]">No class on this date. The hours below are free.</p>}
          </div>
        </article>
        <article className="rounded-2xl border border-[#E8E2ED] bg-white p-4">
          <h3 className="font-bold text-[#310064]">Free hours</h3>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {HOURS.map((hour) => (
              <p key={hour} className={`rounded-lg px-2 py-1 text-xs ${busy.has(hour) ? 'bg-[#310064] text-white' : 'bg-[#F5F0FA] text-[#21152D]'}`}>
                {pad(hour)}:00 · {busy.has(hour) ? 'In class' : 'Free'}
              </p>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}
