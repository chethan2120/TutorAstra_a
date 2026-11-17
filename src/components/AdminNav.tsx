'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Inbox,
  BookOpen,
  Award,
  Calendar,
  MessageSquare,
  FolderTree,
  Settings,
  ChevronDown,
  ChevronRight,
  Search,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { DEMO_ACCOUNTS, DEMO_PASSWORD, deskPath } from '@/lib/demo';

interface AdminNavProps {
  userEmail?: string;
  userName?: string;
  homeHref?: string;
}

export function AdminTopBar({ userEmail = 'admin@gmail.com', userName = 'Super Admin', homeHref = '/admin/dashboard' }: AdminNavProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    setDemo(window.localStorage.getItem('ta-demo') === 'on');
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const switchAccount = async (email: string, role: string) => {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: DEMO_PASSWORD }),
    });
    if (!response.ok) return;
    router.push(deskPath(role));
    router.refresh();
  };

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'SA';

  const dateParts = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).formatToParts(new Date());
  const part = (type: string) => dateParts.find((item) => item.type === type)?.value || '';
  const todayLabel = `${part('weekday')}, ${part('day')} ${part('month')} ${part('year')}`;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#F0ECEE] px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 shadow-xs">
      <div className="flex shrink-0 items-center gap-3">
        <Link href={homeHref} className="flex items-center gap-2.5">
          <img
            src="/tutorastra-logo.jpg"
            alt="TutorAstra"
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-cover ring-2 ring-[#F4CC45]"
          />
          <div className="hidden sm:block">
            <span className="text-sm font-black tracking-tight text-[#310064]">TutorAstra</span>
            <span className="ml-1.5 hidden text-xs font-semibold text-slate-500 md:inline">Management Console</span>
          </div>
        </Link>
      </div>

      {/* Center: Search Bar */}
      <div className="flex-1 max-w-xl mx-2 sm:mx-6">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search records, courses, applications, students..."
            className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#310064] focus:outline-none focus:ring-1 focus:ring-[#310064]/40"
          />
        </div>
      </div>

      {/* Right: Date Pill & Profile Avatar Circle */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>{todayLabel}</span>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#310064] text-xs font-bold text-white shadow-xs hover:opacity-90"
            title={`${userName} (${userEmail})`}
          >
            {initials}
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white shadow-card-hover border border-slate-100 p-2 z-50 animate-in fade-in duration-150">
              <div className="px-3 py-2 border-b border-slate-100">
                <div className="text-xs font-bold text-navy">{userName}</div>
                <div className="text-[10px] text-slate-400 truncate">{userEmail}</div>
              </div>
              <div className="mt-1 flex items-center justify-between px-3 py-2">
                <span className="text-xs font-semibold text-slate-700">Demo</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={demo}
                  onClick={() => {
                    const next = !demo;
                    setDemo(next);
                    window.localStorage.setItem('ta-demo', next ? 'on' : 'off');
                  }}
                  className={`relative h-5 w-9 rounded-full transition-colors ${demo ? 'bg-[#310064]' : 'bg-slate-300'}`}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${demo ? 'left-4' : 'left-0.5'}`} />
                </button>
              </div>
              {demo && (
                <div className="max-h-48 overflow-auto border-t border-slate-100 pt-1">
                  {DEMO_ACCOUNTS.map((account) => (
                    <button
                      key={account.email}
                      type="button"
                      onClick={() => switchAccount(account.email, account.role)}
                      className="block w-full rounded-lg px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50"
                    >
                      {account.label}
                    </button>
                  ))}
                </div>
              )}
              {homeHref === '/admin/dashboard' && (
                <Link
                  href="/admin/reset-password"
                  className="block px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg mt-1"
                  onClick={() => setShowProfileMenu(false)}
                >
                  Change Password
                </Link>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-xs text-rose-600 font-semibold hover:bg-rose-50 rounded-lg flex items-center gap-2 mt-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export function AdminSidebar(_props: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  return (
    <aside className="h-full w-full shrink-0 overflow-y-auto border-r border-[#F0ECEE] bg-white p-3 text-slate-700 lg:w-64">
      <div className="space-y-2">
        <Link href="/admin/dashboard" className="mb-2 flex items-center gap-2.5 px-2">
          <img src="/tutorastra-logo.jpg" alt="" width={36} height={36} className="h-9 w-9 rounded-full object-cover ring-2 ring-[#F4CC45]" />
          <span className="text-sm font-bold tracking-tight text-[#310064]">TutorAstra</span>
        </Link>
        <nav className="space-y-0.5">
          {[
            ['/admin/dashboard', 'Dashboard'],
            ['/admin/users', 'User management'],
            ['/admin/attendance', 'Attendance'],
            ['/admin/schedule', 'Schedule class'],
            ['/admin/subjects', 'Subjects'],
            ['/admin/leave', 'Leave'],
            ['/admin/notifications', 'Notifications'],
            ['/admin/chat', 'Chat'],
            ['/admin/calendar', 'Calendar'],
            ['/admin/profile', 'Profile'],
          ].map(([href, label]) => (
            <Link key={href} href={href} className={`block rounded-xl px-3.5 py-2.5 text-xs font-bold ${pathname === href || (href === '/admin/schedule' && pathname.startsWith('/admin/schedule')) ? 'bg-[#310064] text-white' : 'text-slate-700 hover:bg-slate-100'}`}>
              {label}
            </Link>
          ))}
        </nav>
        <button type="button" onClick={handleLogout} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600">
          <LogOut className="h-3.5 w-3.5" />
          Logout
        </button>
      </div>
    </aside>
  );
}


export default function AdminNav(props: AdminNavProps) {
  return (
    <>
      <AdminTopBar {...props} />
      <AdminSidebar {...props} />
    </>
  );
}
