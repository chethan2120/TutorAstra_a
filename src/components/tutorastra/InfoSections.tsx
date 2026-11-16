'use client';

import React, { useState } from 'react';
import Image from 'next/image';

const YEARS = [
  {
    range: '1–5',
    title: 'Early school years',
    text: 'Lessons stay close to the idea the student met in class. A tutor uses a short example, then lets the student try a similar one in their own notebook.',
  },
  {
    range: '6–8',
    title: 'Middle school',
    text: 'Topics get longer. The lesson slows the method down: what the question is asking, the first step, and how the student would check the result.',
  },
  {
    range: '9–10',
    title: 'Secondary years',
    text: 'Practice follows the work already set by school. The tutor returns to the topic that is still shaky before adding the next one.',
  },
  {
    range: '11–12',
    title: 'Senior years',
    text: 'Sessions are planned around the subject the student names, the pace they can keep, and the questions they still cannot answer alone.',
  },
];

const LESSON = [
  { n: '01', title: 'Start from today’s work', text: 'The student brings the notebook, the textbook or the question that did not make sense. That is the start of the hour.' },
  { n: '02', title: 'One example, out loud', text: 'The tutor works one example and says why each step is there. The student can stop the explanation and ask again.' },
  { n: '03', title: 'The student tries the next one', text: 'The following question is the student’s. The tutor stays nearby and steps in only when the method stalls.' },
  { n: '04', title: 'Leave with a clear next task', text: 'The lesson ends with what to practise before the next class, and what still needs another look.' },
];

const BETWEEN = [
  { title: 'The notebook', text: 'The written steps stay in the student’s own book, so the next class can open on the same page.' },
  { title: 'The school set', text: 'Homework already assigned by school is the practice. We do not replace it with a different course.' },
  { title: 'The question to bring back', text: 'If a step is still unclear, the student marks it. The following lesson begins there.' },
];

const PARENTS = [
  { n: '01', title: 'What was covered', text: 'The topic the lesson stayed with, in plain language.', tone: 'bg-white text-[#21152D]' },
  { n: '02', title: 'What to practise', text: 'The short piece of work before the next class.', tone: 'bg-[#F4CC45] text-[#240047]' },
  { n: '03', title: 'What is still unclear', text: 'The point both of you agreed to return to.', tone: 'bg-[#F5F0FA] text-[#21152D]' },
  { n: '04', title: 'When the next class is', text: 'The time already agreed. A change is confirmed with you.', tone: 'bg-[#240047] text-white' },
];

const ASKED = [
  { n: '01', title: 'The subject', text: 'Which subject needs attention, and which topic inside it.' },
  { n: '02', title: 'The grade', text: 'The student’s grade, and the schoolwork in front of them right now.' },
  { n: '03', title: 'What feels steady', text: 'What already holds, and what still feels shaky.' },
  { n: '04', title: 'The week', text: 'Days and times that can sit around school and family life.' },
  { n: '05', title: 'The same tutor', text: 'Whether one tutor can stay with the student, week after week.' },
  { n: '06', title: 'How you hear back', text: 'How you would like to hear about the lesson afterwards.' },
];

export function GradesSection() {
  return (
    <section id="school-years" className="bg-[#FAF9FC] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="ta-rule font-display max-w-xl text-3xl font-bold text-[#21152D] sm:text-4xl">School years we can discuss</h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[#51475B]">
          TutorAstra lessons are one student and one tutor, from the early grades through the senior years. The school syllabus is the starting point. Board, fees and timetable are confirmed in consultation, not on this page.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {YEARS.map((year) => (
            <article key={year.range} className="rounded-lg border border-[#E8E2ED] bg-white p-5">
              <p className="font-display text-3xl font-extrabold text-[#310064]">{year.range}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#C4A017]">Grades</p>
              <h3 className="font-display mt-4 text-lg font-semibold text-[#21152D]">{year.title}</h3>
              <p className="mt-2 text-[15px] leading-6 text-[#51475B]">{year.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LessonSection() {
  return (
    <section id="a-lesson" className="bg-white py-16 sm:py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-[#F5F0FA]">
          <Image
            src="/images/hero/tutor-guidance.png"
            alt="A tutor pointing to a notebook while the student writes"
            fill
            sizes="(min-width: 1024px) 560px, 100vw"
            className="object-cover object-[center_20%]"
          />
        </div>
        <div>
          <h2 className="ta-rule font-display text-3xl font-bold text-[#21152D] sm:text-4xl">What one lesson contains</h2>
          <p className="mt-4 text-base leading-7 text-[#51475B]">
            A class is not a new syllabus. It is time spent on the work already in front of the student.
          </p>
          <ol className="mt-8 space-y-5">
            {LESSON.map((step) => (
              <li key={step.n} className="flex gap-4">
                <span className="font-display w-10 shrink-0 border-b-2 border-[#F4CC45] pb-1 text-sm font-bold text-[#310064]">{step.n}</span>
                <span>
                  <span className="block font-semibold text-[#310064]">{step.title}</span>
                  <span className="mt-1 block text-sm leading-6 text-[#51475B]">{step.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

export function BetweenSection() {
  return (
    <section id="between-classes" className="bg-[#F5F0FA] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="ta-rule font-display text-3xl font-bold text-[#21152D] sm:text-4xl">What happens between classes</h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[#51475B]">
          The useful part of a one-to-one lesson is what the student can do alone afterwards. Three things carry the work from one class to the next.
        </p>
        <div className="ta-sweep-row mt-10 grid gap-4 md:grid-cols-3">
          {BETWEEN.map((item) => (
            <article key={item.title} className="ta-sweep rounded-lg bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border hover:border-[#F4CC45]">
              <h3 className="font-display text-xl font-semibold text-[#310064]">{item.title}</h3>
              <p className="mt-3 text-[15px] leading-7 text-[#51475B]">{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ParentsSection() {
  return (
    <section id="for-parents" className="bg-[#FAF9FC] py-16 sm:py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-8">
        <div>
          <h2 className="ta-rule font-display text-3xl font-bold text-[#21152D] sm:text-4xl">What parents can follow</h2>
          <p className="mt-4 text-base leading-7 text-[#51475B]">
            Four notes after a class. There is no separate parent app. These are the points we agree to share.
          </p>
          <div className="relative mt-6 aspect-[4/3] overflow-hidden rounded-lg">
            <Image
              src="/images/hero/independent-study.png"
              alt="The student working at a desk between classes"
              fill
              sizes="(min-width: 1024px) 480px, 100vw"
              className="object-cover object-[center_20%]"
            />
          </div>
        </div>
        <div className="ta-sweep-row grid gap-3 sm:grid-cols-2">
          {PARENTS.map((item) => (
            <article
              key={item.n}
              className={`ta-sweep flex min-h-[168px] flex-col justify-between rounded-lg p-5 shadow-[0_16px_30px_-24px_rgba(49,0,100,0.55)] transition duration-300 hover:-translate-y-1.5 ${item.tone}`}
            >
              <span className="font-display text-2xl font-extrabold opacity-80">{item.n}</span>
              <span>
                <h3 className="font-display text-lg font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm leading-6 opacity-80">{item.text}</p>
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BeforeTutorSection() {
  const [picked, setPicked] = useState(0);
  const current = ASKED[picked];

  return (
    <section id="before-a-tutor" className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="ta-rule font-display max-w-xl text-3xl font-bold text-[#21152D] sm:text-4xl">What we ask before a tutor is confirmed</h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[#51475B]">
          Tap a card. A gold light visits each question in turn. The one you choose stays open below.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ASKED.map((item, index) => {
            const on = index === picked;
            return (
              <button
                key={item.n}
                type="button"
                onClick={() => setPicked(index)}
                aria-pressed={on}
                className={`ta-ask-card rounded-lg border px-5 py-5 text-left ${on ? 'is-picked' : 'border-[#E8E2ED] bg-white text-[#21152D]'}`}
              >
                <span className={`font-display text-sm font-bold ${on ? 'text-[#F4CC45]' : 'text-[#C4A017]'}`}>{item.n}</span>
                <span className="mt-3 block font-display text-lg font-semibold">{item.title}</span>
                <span className={`mt-2 block text-sm leading-6 ${on ? 'text-white/80' : 'text-[#51475B]'}`}>{item.text}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-5 flex flex-col items-start justify-between gap-4 rounded-lg bg-[#310064] px-5 py-5 text-white sm:flex-row sm:items-center">
          <p className="text-sm leading-6">
            <span className="font-semibold text-[#F4CC45]">{current.n} {current.title}.</span> A tutor is offered only when this match is real.
          </p>
          <a href="#consultation" className="inline-flex shrink-0 rounded-lg bg-[#F4CC45] px-5 py-3 text-sm font-bold text-[#240047] transition hover:bg-[#e2b52a]">
            Book a Free Consultation
          </a>
        </div>
      </div>
    </section>
  );
}

export function ConfirmedLaterSection() {
  return (
    <section id="what-we-confirm" className="bg-[#240047] py-16 text-white sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="ta-rule font-display text-3xl font-bold sm:text-4xl">What this page can tell you</h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-white/80">
          Some details are already the way TutorAstra works. Others wait until we have spoken, so this page does not guess them.
        </p>
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <article className="rounded-lg bg-white p-6 text-[#21152D] sm:p-8">
            <h3 className="font-display text-xl font-semibold text-[#310064]">Already the way a class works</h3>
            <ul className="mt-4 space-y-3 text-[15px] leading-6 text-[#51475B]">
              <li>One student with one tutor.</li>
              <li>The lesson follows the schoolwork in front of that student.</li>
              <li>Practice sits between classes, in the student’s own notebook.</li>
              <li>The same tutor is the aim, not a different person each week.</li>
              <li>A consultation is saved from the form on this page. It does not book a class by itself.</li>
            </ul>
          </article>
          <article className="rounded-lg border border-white/15 p-6 sm:p-8">
            <h3 className="font-display text-xl font-semibold text-[#F4CC45]">Confirmed only after we speak</h3>
            <ul className="mt-4 space-y-3 text-[15px] leading-6 text-white/80">
              <li>Whether a tutor can be arranged for the subject you name.</li>
              <li>Fees, session length and the weekly time.</li>
              <li>How the lesson lines up with the student’s board or school syllabus.</li>
              <li>Any certificate, report format or parent update you want in writing.</li>
              <li>The date of the first class.</li>
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}
