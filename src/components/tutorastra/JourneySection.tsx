import React from 'react';
import Image from 'next/image';

const STEPS = [
  {
    image: '/images/hero/tutor-guidance.png',
    alt: 'The student learning with a tutor',
    label: 'Learn',
    text: 'A tutor guides the lesson while the student writes and checks understanding.',
  },
  {
    image: '/images/hero/independent-study.png',
    alt: 'The same student studying independently',
    label: 'Practise',
    text: 'The same student continues at the desk, building the habit on their own.',
  },
  {
    image: '/images/hero/student-success.png',
    alt: 'The same student holding a report marked A+',
    label: 'A+',
    text: 'The same student holds a report marked A+. This is not a promised grade.',
  },
];

export default function JourneySection() {
  return (
    <section id="journey" data-header-tone="light" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="ta-rule max-w-2xl font-display text-3xl font-bold text-[#21152D] sm:text-4xl">
          The same student. Three stages of the work.
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#746B80] sm:text-base">
          These photographs follow one student from a guided lesson, to independent practice, to a result sheet marked A+. They are not customer reviews and they are not a promise of a grade.
        </p>
        <div className="ta-sweep-row mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <article key={step.label} className="ta-sweep overflow-hidden rounded-[18px] border border-[#EDE4FA] bg-[#F5F0FC] transition duration-300 hover:-translate-y-1 hover:border-[#F4CC45] hover:shadow-[0_18px_40px_-28px_rgba(49,0,100,0.4)]">
              <div className="relative aspect-[4/3]">
                <Image src={step.image} alt={step.alt} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover object-[center_20%]" />
              </div>
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6527B8]">0{index + 1}</p>
                <h3 className="mt-1 text-lg font-semibold text-[#310064]">{step.label}</h3>
                <p className="mt-2 text-sm leading-6 text-[#746B80]">{step.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
