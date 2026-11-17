import { redirect } from 'next/navigation';
import React from 'react';
import { AdminTopBar, AdminSidebar } from '@/components/AdminNav';
import { getCurrentSession } from '@/lib/auth';

export const metadata = {
  title: { absolute: 'TutorAstra Management Console' },
  description: 'TutorAstra operations, enquiries and learning programmes.',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = getCurrentSession();

  if (!session) {
    return <div className="min-h-screen bg-slate-50 font-sans">{children}</div>;
  }

  if (session.role === 'teacher') redirect('/teacher');
  if (session.role === 'student') redirect('/student');

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#FAFAFA] font-sans text-slate-800">
      <AdminTopBar userEmail={session.email} userName={session.name} />
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <AdminSidebar userEmail={session.email} userName={session.name} />
        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
