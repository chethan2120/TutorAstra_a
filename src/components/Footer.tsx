import React from 'react';
import Link from 'next/link';
import Logo from '@/components/tutorastra/Logo';

const explore = [
  { href: '/#about', label: 'About Us' },
  { href: '/#subjects', label: 'Subjects' },
  { href: '/#school-years', label: 'School Years' },
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/#a-lesson', label: 'A Lesson' },
  { href: '/#for-parents', label: 'For Parents' },
  { href: '/#ai-tutor', label: 'AI Tutor' },
  { href: '/#consultation', label: 'Contact' },
  { href: '/login', label: 'Login' },
];

const subjects = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Science',
  'English',
  'Computer Science',
  'Commerce',
  'More Subjects',
];

function SocialMark({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span
      title={`${label} profile to be confirmed`}
      aria-label={`${label} profile to be confirmed`}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#F4CC45]/40 text-[#F4CC45]"
    >
      {children}
    </span>
  );
}

export default function Footer() {
  return (
    <footer className="bg-[#240047] text-[#f4eefe]">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-4">
          <Logo tone="light" imageClassName="h-16 w-16" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/75">
            Personalised one-to-one learning for students who want guidance that respects their pace, their goals and their ambitions.
          </p>
          <div className="mt-6 flex gap-3" aria-label="Social media">
            <SocialMark label="Instagram">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                <rect x="4" y="4" width="16" height="16" rx="4" />
                <circle cx="12" cy="12" r="3.2" />
                <circle cx="17.2" cy="6.8" r="0.7" fill="currentColor" stroke="none" />
              </svg>
            </SocialMark>
            <SocialMark label="Facebook">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M14.2 8.5H16V6h-1.8C11.8 6 11 7.3 11 9.1V10H9.5v2.4H11V18h2.4v-5.6h1.8l.4-2.4H13.4V9.2c0-.5.2-.7.8-.7Z" />
              </svg>
            </SocialMark>
            <SocialMark label="LinkedIn">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M7.1 9.4H4.7V19h2.4V9.4ZM5.9 4.8A1.5 1.5 0 1 0 5.9 7.8 1.5 1.5 0 0 0 5.9 4.8ZM19.3 19h-2.4v-4.7c0-1.3-.5-2.1-1.6-2.1-1.2 0-1.8.8-1.8 2.1V19h-2.4V9.4h2.3v1.3c.4-.7 1.3-1.6 2.9-1.6 2 0 3 1.3 3 3.9V19Z" />
              </svg>
            </SocialMark>
            <SocialMark label="YouTube">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M20.2 8.2a2.4 2.4 0 0 0-1.7-1.7C17 6.1 12 6.1 12 6.1s-5 0-6.5.4a2.4 2.4 0 0 0-1.7 1.7A25 25 0 0 0 3.4 12a25 25 0 0 0 .4 3.8 2.4 2.4 0 0 0 1.7 1.7c1.5.4 6.5.4 6.5.4s5 0 6.5-.4a2.4 2.4 0 0 0 1.7-1.7 25 25 0 0 0 .4-3.8 25 25 0 0 0-.4-3.8ZM10.6 14.7V9.3L15 12l-4.4 2.7Z" />
              </svg>
            </SocialMark>
          </div>
          <p className="mt-3 text-xs text-white/50">Social profiles will be added when confirmed.</p>
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F4CC45]">Explore</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {explore.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="text-white/80 transition hover:text-[#F4CC45]">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F4CC45]">Subjects</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {subjects.map((subject) => (
              <li key={subject}>
                <Link
                  href={`/?subject=${encodeURIComponent(subject)}#subjects`}
                  className="text-white/80 transition hover:text-[#F4CC45]"
                >
                  {subject}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F4CC45]">Contact</h2>
          <ul className="mt-4 space-y-3 text-sm text-white/80">
            <li>
              <span className="block text-xs uppercase tracking-wider text-white/45">Email</span>
              To be confirmed
            </li>
            <li>
              <span className="block text-xs uppercase tracking-wider text-white/45">Phone</span>
              To be confirmed
            </li>
            <li>
              <span className="block text-xs uppercase tracking-wider text-white/45">Location</span>
              To be confirmed
            </li>
          </ul>
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-full border border-[#F4CC45] px-4 py-2 text-sm font-semibold text-[#F4CC45] transition hover:bg-[#F4CC45] hover:text-[#310064]"
          >
            Login
          </Link>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-white/65 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>© {new Date().getFullYear()} TutorAstra. All rights reserved.</p>
          <p>
            Designed and Maintained by{' '}
            <a href="https://webnxt.co/" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#F4CC45] underline-offset-4 hover:underline">
              WebNxt
            </a>
          </p>
          <div className="flex gap-4">
            <Link href="/privacy-policy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
