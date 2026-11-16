'use client';

import React, { useEffect, useRef } from 'react';

const PHRASES = [
  'One tutor. One student. One plan.',
  'Your Ambition. Our Mission.',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Science',
  'English',
  'Personalised study plans',
  'Book a free consultation',
];

export function RevealText({ text, className = '' }: { text: string; className?: string }) {
  const words = text.split(' ');
  return (
    <span data-reveal="text" className={className}>
      {words.map((word, index) => (
        <span key={`${word}-${index}`} className="reveal-word" style={{ ['--i' as string]: index, marginRight: index < words.length - 1 ? '0.28em' : 0 }}>
          {word}
        </span>
      ))}
    </span>
  );
}

export function Parallax({
  children,
  className = '',
  strength = 28,
}: {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    const update = () => {
      const rect = node.getBoundingClientRect();
      const view = window.innerHeight || 1;
      const progress = (rect.top + rect.height / 2 - view / 2) / view;
      node.style.transform = `translate3d(0, ${progress * strength}px, 0)`;
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [strength]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

function PhraseRow() {
  return (
    <>
      {PHRASES.map((phrase) => (
        <span key={phrase} className="flex items-center gap-6">
          <span>{phrase}</span>
          <span className="text-[#F4CC45]" aria-hidden="true">
            ◆
          </span>
        </span>
      ))}
    </>
  );
}

export default function Marquee() {
  return (
    <div className="ta-marquee overflow-hidden border-y border-[#310064]/10 bg-[#310064] text-white" data-header-tone="dark">
      <div className="ta-marquee-track flex w-max">
        <div className="flex items-center gap-6 px-3 py-3 text-xs font-semibold uppercase tracking-[0.22em]">
          <PhraseRow />
        </div>
        <div className="flex items-center gap-6 px-3 py-3 text-xs font-semibold uppercase tracking-[0.22em]" aria-hidden="true">
          <PhraseRow />
        </div>
      </div>
    </div>
  );
}
