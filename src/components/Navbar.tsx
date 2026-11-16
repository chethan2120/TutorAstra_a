'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import Logo from '@/components/tutorastra/Logo';

interface NavbarProps {
  announcementText?: string;
  isAnnouncementActive?: boolean;
}

const LINKS = [
  { href: '#about', label: 'About Us' },
  { href: '#subjects', label: 'Subjects' },
  { href: '#ai-tutor', label: 'AI Tutor' },
  { href: '#consultation', label: 'Contact' },
];

export default function Navbar(_props: NavbarProps = {}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const [active, setActive] = useState('#home');

  useEffect(() => {
    const onScroll = () => {
      setCompact(window.scrollY > 12);
      if (pathname !== '/') return;
      const line = window.scrollY + 88;
      let nextActive = '#home';
      document.querySelectorAll<HTMLElement>('main section[id], #home').forEach((section) => {
        const top = section.getBoundingClientRect().top + window.scrollY;
        if (top <= line && section.id) nextActive = `#${section.id}`;
      });
      setActive(nextActive);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const to = (hash: string) => (pathname === '/' ? hash : `/${hash}`);
  const onHome = pathname === '/';
  const linkClass = (current: boolean) =>
    `relative text-[15px] font-medium transition-colors duration-300 ${
      current ? 'text-[#310064]' : 'text-[#310064]/80 hover:text-[#C4A017]'
    }`;

  return (
    <>
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b border-[#E9E1F1] bg-[rgba(250,248,255,0.96)] backdrop-blur-md transition-shadow duration-300 ${
        compact ? 'shadow-[0_10px_30px_-22px_rgba(49,0,100,0.45)]' : ''
      }`}
    >
      <nav
        className={`mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 transition-[height] duration-300 sm:px-6 lg:px-8 ${
          compact ? 'h-16' : 'h-[4.75rem]'
        }`}
        aria-label="Primary"
      >
        <Link href={onHome ? '#home' : '/'} className="shrink-0 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4CC45]" aria-label="TutorAstra home">
          <Logo showTagline={false} imageClassName={compact ? 'h-9 w-9' : 'h-10 w-10'} wordmarkClassName="text-lg font-bold sm:text-[1.25rem]" />
        </Link>

        <div className="hidden items-center gap-6 xl:flex">
          <Link
            href={onHome ? '#home' : '/'}
            aria-current={onHome && active === '#home' ? 'true' : undefined}
            className={linkClass(onHome && active === '#home')}
          >
            Home
            {onHome && active === '#home' && <span className="absolute -bottom-2 left-0 h-0.5 w-full rounded-full bg-[#6527B8]" />}
          </Link>
          {LINKS.map((link) => {
            const isCurrent = onHome && active === link.href;
            return (
              <a key={link.href} href={to(link.href)} aria-current={isCurrent ? 'true' : undefined} className={linkClass(isCurrent)}>
                {link.label}
                {isCurrent && <span className="absolute -bottom-2 left-0 h-0.5 w-full bg-[#310064]" />}
              </a>
            );
          })}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="inline-flex items-center rounded-lg border border-[#310064] px-3.5 py-2 text-sm font-semibold text-[#310064] transition hover:bg-[#F5F0FA]"
          >
            Login
          </Link>
          <a href={to('#consultation')} className="hidden items-center rounded-lg bg-[#310064] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#240047] sm:inline-flex">
            Book a Free Consultation
          </a>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#E9E1F1] text-[#310064] xl:hidden"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div id="mobile-navigation" className="border-t border-[#310064]/10 bg-white xl:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6">
            <Link href="/" className="rounded-2xl px-3 py-3 text-base font-semibold text-[#310064] hover:bg-[#F0E9FA]" onClick={() => setOpen(false)}>
              Home
            </Link>
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={to(link.href)}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-3 py-3 text-base font-medium text-[#310064] hover:bg-[#F0E9FA]"
              >
                {link.label}
              </a>
            ))}
            <a
              href={to('#consultation')}
              onClick={() => setOpen(false)}
              className="mt-3 inline-flex items-center justify-center rounded-lg bg-[#310064] px-5 py-3 text-sm font-semibold text-white"
            >
              Book a Free Consultation
            </a>
          </div>
        </div>
      )}
    </header>
    <div className="h-[4.75rem]" aria-hidden="true" />
    </>
  );
}
