'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowUp } from 'lucide-react';
import ParentGuide from '@/components/tutorastra/ParentGuide';

export default function ScrollAction({ whatsappNumber = '' }: { whatsappNumber?: string }) {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const showScrollTopRef = useRef(false);
  const tickingRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;

      window.requestAnimationFrame(() => {
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (totalHeight > 0 && progressBarRef.current) {
          const ratio = Math.min(1, Math.max(0, window.scrollY / totalHeight));
          progressBarRef.current.style.transform = `scaleX(${ratio})`;
        }

        const isOver300 = window.scrollY > 300;
        if (isOver300 !== showScrollTopRef.current) {
          showScrollTopRef.current = isOver300;
          setShowScrollTop(isOver300);
        }

        tickingRef.current = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const digits = whatsappNumber.replace(/\D/g, '');
  const whatsappHref = digits
    ? `https://wa.me/${digits}?text=${encodeURIComponent('Hello TutorAstra, I would like to register for a consultation.')}`
    : '/#consultation';

  return (
    <>
      <div
        className="pointer-events-none fixed left-0 right-0 top-0 z-50 h-1 bg-transparent"
        style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}
      >
        <div
          ref={progressBarRef}
          className="h-full w-full origin-left bg-[#F4CC45] will-change-transform"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>

      <div
        className="fixed bottom-5 right-4 z-40 flex flex-col items-end gap-3 sm:right-6"
        style={{ position: 'fixed', bottom: '1.25rem', right: '1rem', zIndex: 40 }}
      >
        {showScrollTop && (
          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Scroll back to top"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E9E1F1] bg-white text-[#310064] shadow-lg"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        )}

        <ParentGuide />

        <a
          href={whatsappHref}
          target={digits ? '_blank' : undefined}
          rel={digits ? 'noopener noreferrer' : undefined}
          aria-label="Chat with TutorAstra on WhatsApp"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1f8f4e] text-white shadow-lg transition hover:-translate-y-0.5"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
            <path d="M12.04 3.2A8.7 8.7 0 0 0 3.4 11.8c0 1.53.4 3.02 1.16 4.33L3.2 20.8l4.8-1.26a8.8 8.8 0 0 0 4.04.98 8.7 8.7 0 0 0 0-17.32Zm0 15.9a7.2 7.2 0 0 1-3.66-.99l-.26-.16-2.85.75.76-2.78-.17-.28a7.15 7.15 0 1 1 6.18 3.46Zm3.93-5.35c-.21-.1-1.27-.62-1.46-.7-.2-.07-.34-.1-.48.11-.14.2-.55.69-.67.83-.12.14-.25.16-.46.05-.21-.1-.9-.33-1.71-1.05-.63-.56-1.06-1.26-1.18-1.47-.12-.21-.01-.33.09-.43.1-.1.21-.25.32-.37.1-.12.14-.21.21-.35.07-.14.04-.27-.02-.37-.05-.1-.48-1.16-.66-1.59-.17-.42-.35-.36-.48-.36h-.41c-.14 0-.37.05-.56.27-.2.21-.74.72-.74 1.76s.76 2.04.86 2.18c.1.14 1.49 2.28 3.62 3.2.5.22.9.35 1.2.45.51.16.97.14 1.33.08.41-.06 1.27-.52 1.45-1.02.18-.5.18-.93.12-1.02-.05-.1-.2-.16-.41-.27Z" />
          </svg>
        </a>
      </div>
    </>
  );
}
