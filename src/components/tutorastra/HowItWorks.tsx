import React from 'react';

const STEPS = [
  {
    n: '01',
    title: 'Understand Your Goals',
    text: 'You tell us the subject, the grade and what the student wants to feel more sure about. That conversation decides whether a tutor can be arranged.',
  },
  {
    n: '02',
    title: 'Connect with the Right Tutor',
    text: 'We look for a tutor who can stay with the student, not a different person each week. Nothing is booked until that match is real.',
  },
  {
    n: '03',
    title: 'Learn, Practise and Improve',
    text: 'Lessons and practice follow the work the student is doing. The next session returns to what is still unclear.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" data-header-tone="light" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6527B8]">How TutorAstra works</p>
        <h2 className="ta-rule mt-3 max-w-xl text-3xl font-bold tracking-tight text-[#241536] sm:text-4xl">
          A clear path from the first conversation to the first class.
        </h2>
        <ol className="ta-sweep-row relative mt-12 grid gap-5 md:grid-cols-3">
          {STEPS.map((step) => (
            <li
              key={step.n}
              className="ta-sweep group relative min-h-[220px] rounded-[18px] border border-[#EDE4FA] bg-[#F5F0FC] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#F4CC45] hover:bg-white hover:shadow-[0_18px_40px_-28px_rgba(49,0,100,0.45)]"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-sm font-bold text-[#310064] shadow-sm transition duration-300 group-hover:-translate-y-0.5 group-hover:bg-[#310064] group-hover:text-[#F4CC45]">
                {step.n}
              </span>
              <h3 className="mt-5 text-lg font-semibold text-[#310064]">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#746B80]">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
