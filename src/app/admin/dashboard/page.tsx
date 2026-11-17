'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { when } from '@/components/portal/Field';

const actions = [
  { href: '/admin/users', title: 'People', text: 'Teachers and students, with a preview of classes.' },
  { href: '/admin/schedule', title: 'Schedule class', text: 'Set the days, time, subject and tutor.' },
  { href: '/admin/calendar', title: 'Calendar', text: 'See who is in class and who is free.' },
  { href: '/admin/attendance', title: 'Attendance', text: 'Mark a class present or absent.' },
  { href: '/admin/chat', title: 'Chat', text: 'Messages stay in the thread.' },
  { href: '/admin/notifications', title: 'Notifications', text: 'A note reaches every inbox.' },
];

export default function AdminDashboardPage() {
  const [counts, setCounts] = useState({ students: 0, staff: 0, enrolments: 0, upcoming: 0 });
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/portal/users').then((response) => response.json()),
      fetch('/api/portal/home').then((response) => response.json()),
    ]).then(([people, home]) => {
      const upcoming = (home.sessions || []).filter((item: any) => ['Scheduled', 'Rescheduled'].includes(item.status) && item.starts_at);
      setCounts({
        students: people.students?.length || 0,
        staff: people.teachers?.length || 0,
        enrolments: people.enrolments?.length || 0,
        upcoming: upcoming.length,
      });
      setSessions(upcoming.slice(0, 6));
    }).catch(() => undefined);
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#310064]">Dashboard</h1>
        <p className="mt-1 text-sm text-[#51475B]">A short view of people, classes and the next dates.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Students', counts.students],
          ['Teachers', counts.staff],
          ['Courses', counts.enrolments],
          ['Classes ahead', counts.upcoming],
        ].map(([label, value]) => (
          <article key={String(label)} className="rounded-2xl border border-[#E8E2ED] bg-white p-4">
            <p className="text-xs font-bold text-[#51475B]">{label}</p>
            <p className="mt-2 text-3xl font-black text-[#21152D]">{value}</p>
          </article>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((item) => (
          <Link key={item.href} href={item.href} className="rounded-2xl border border-[#E8E2ED] bg-white p-4 hover:border-[#310064]">
            <p className="font-bold text-[#310064]">{item.title}</p>
            <p className="mt-1 text-sm text-[#51475B]">{item.text}</p>
          </Link>
        ))}
      </div>
      <section className="rounded-2xl border border-[#E8E2ED] bg-white p-4">
        <h2 className="font-bold text-[#310064]">Coming up</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {sessions.map((item) => (
            <article key={item.id} className="rounded-xl bg-[#FAF9FC] p-3 text-sm">
              <p className="font-bold">{item.subject_name}</p>
              <p>{item.student_name} with {item.teacher_name}</p>
              <p className="text-[#51475B]">{when(item.starts_at)}</p>
            </article>
          ))}
          {sessions.length === 0 && <p className="text-sm text-[#51475B]">No class is on the calendar yet.</p>}
        </div>
      </section>
    </div>
  );
}
