import React from 'react';
import Image from 'next/image';

const POINTS = [
  { title: 'One-to-one attention', text: 'Every lesson is a conversation between one student and one tutor.' },
  { title: 'Experienced tutors', text: 'A tutor stays with the student and learns how they think.' },
  { title: 'Flexible learning', text: 'Class times are agreed around school and family life.' },
  { title: 'Personalised study plans', text: 'Practice follows the work the student is actually doing.' },
  { title: 'Continuous academic support', text: 'Each session returns to strengths, gaps and the next goal.' },
];

export default function WhySection() {
  return (
    <section id="about" data-header-tone="light" className="bg-[#F5F0FC] py-20 sm:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="relative" data-reveal="left">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[24px] bg-white shadow-[0_30px_60px_-36px_rgba(49,0,100,0.55)]">
            <Image
              src="/images/hero/independent-study.png"
              alt="The same student concentrating on independent study at a home desk"
              fill
              sizes="(min-width: 1024px) 560px, 100vw"
              className="object-cover object-[center_20%]"
            />
          </div>
          <div className="absolute -bottom-5 left-6 right-6 rounded-2xl border border-[#EDE4FA] bg-white px-4 py-3 shadow-lg sm:left-8 sm:right-auto">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6527B8]">Your Ambition. Our Mission.</p>
            <p className="mt-1 text-sm text-[#241536]">Guidance built around the student in front of us.</p>
          </div>
        </div>
        <div data-reveal="right">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6527B8]">Why TutorAstra</p>
          <h2 className="ta-rule mt-3 text-3xl font-bold tracking-tight text-[#241536] sm:text-4xl">
            Learning that fits the student, not the other way around.
          </h2>
          <ul className="mt-8 space-y-4">
            {POINTS.map((point, index) => (
              <li key={point.title} className="flex gap-4">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-[#310064] shadow-sm">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span>
                  <span className="block font-semibold text-[#310064]">{point.title}</span>
                  <span className="mt-0.5 block text-sm leading-6 text-[#746B80]">{point.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
