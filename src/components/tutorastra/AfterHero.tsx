import React from 'react';

const CARDS = [
  {
    label: 'The lesson',
    title: 'One student, one tutor',
    text: 'The tutor works an example, then the student tries the next one. The lesson stays with an idea until it is clear.',
    icon: 'target',
  },
  {
    label: 'The practice',
    title: 'Work between classes',
    text: 'Practice uses the notebook, the textbook and the schoolwork already in front of the student.',
    icon: 'bulb',
  },
  {
    label: 'The tutor',
    title: 'The same person returns',
    text: 'We look for a tutor who can stay with the student. A class is confirmed only after that match is real.',
    icon: 'cap',
  },
  {
    label: 'The family',
    title: 'You hear what happened',
    text: 'After consultation we confirm the subject, the time and the next step. Nothing is booked in silence.',
    icon: 'note',
  },
] as const;

function Mark({ name }: { name: (typeof CARDS)[number]['icon'] }) {
  const common = 'h-6 w-6';
  if (name === 'bulb') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="#C4A017" strokeWidth="1.7" aria-hidden="true">
        <path d="M9 18h6M10 21h4" />
        <path d="M8 14a5 5 0 1 1 8 0c-.7.7-1.2 1.5-1.4 2.4H9.4C9.2 15.5 8.7 14.7 8 14Z" />
      </svg>
    );
  }
  if (name === 'cap') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="#310064" strokeWidth="1.7" aria-hidden="true">
        <path d="M3 10 12 6l9 4-9 4-9-4Z" />
        <path d="M7 12.5V16c1.6 1.3 3.6 2 5 2s3.4-.7 5-2v-3.5" />
      </svg>
    );
  }
  if (name === 'note') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="#C4A017" strokeWidth="1.7" aria-hidden="true">
        <rect x="6" y="4" width="12" height="16" rx="2" />
        <path d="M9 9h6M9 13h6M9 17h3" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={common} fill="none" stroke="#310064" strokeWidth="1.7" aria-hidden="true">
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
    </svg>
  );
}

export default function AfterHero() {
  return (
    <section className="bg-[#FAF9FC] py-12 sm:py-16" data-no-reveal>
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-16">
        <div className="flex flex-col items-start justify-between gap-5 rounded-lg bg-[#310064] px-6 py-6 sm:flex-row sm:items-center sm:px-8">
          <h2 className="font-display max-w-xl text-2xl font-bold leading-snug text-white sm:text-[1.7rem]">
            Talk to us about the student.{' '}
            <span className="text-[#F4CC45]">The plan comes after that conversation.</span>
          </h2>
          <a href="#consultation" className="inline-flex shrink-0 rounded-lg bg-[#F4CC45] px-5 py-3 text-sm font-bold text-[#240047] transition hover:bg-[#e2b52a]">
            Book a Free Consultation
          </a>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((card) => (
            <article key={card.title} className="rounded-lg border border-[#E8E2ED] bg-white p-5 shadow-[0_10px_24px_-20px_rgba(49,0,100,0.45)]">
              <p className="inline-flex rounded-full bg-[#F5F0FA] px-2.5 py-1 text-[11px] font-bold text-[#51475B]">{card.label}</p>
              <span className="mt-4 flex h-11 w-11 items-center justify-center rounded-lg bg-[#F5F0FA]">
                <Mark name={card.icon} />
              </span>
              <h3 className="font-display mt-4 text-lg font-semibold text-[#21152D]">{card.title}</h3>
              <p className="mt-2 text-[15px] leading-6 text-[#51475B]">{card.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
