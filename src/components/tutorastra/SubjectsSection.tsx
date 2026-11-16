'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Atom, BookOpen, Code2, FlaskConical, Globe2, LayoutGrid, Leaf, Microscope, Sigma } from 'lucide-react';

export const SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Science',
  'English',
  'Computer Science',
  'Commerce',
  'More Subjects',
] as const;

export type SubjectName = (typeof SUBJECTS)[number];

type Subject = {
  name: SubjectName;
  image: string;
  alt: string;
  summary: string;
  detail: string;
  focuses: string[];
  benefit: string;
  icon: React.ComponentType<{ className?: string }>;
  tint: string;
};

const subjects: Subject[] = [
  {
    name: 'Mathematics',
    icon: Sigma,
    tint: 'bg-[#EEF2FF] text-[#4F46E5]',
    image: '/brand/subjects/mathematics.jpg',
    alt: 'Graph paper, a brass compass and a pencil on a wooden desk',
    summary: 'Number sense, algebra, geometry and problem solving.',
    detail: 'A mathematics lesson at TutorAstra stays with the idea until it makes sense. Tutors work an example with the student, then leave space for them to try the next one independently.',
    focuses: ['Rebuilding a shaky topic before moving on', 'Multi-step problems with the reasoning written out', 'Practice chosen from the student’s current schoolwork'],
    benefit: 'Students leave with a clearer method, not only a corrected answer.',
  },
  {
    name: 'Physics',
    icon: Atom,
    tint: 'bg-[#F3E8FF] text-[#7C3AED]',
    image: '/brand/subjects/physics.jpg',
    alt: 'A pendulum and a prism casting a spectrum on a dark table',
    summary: 'Mechanics, electricity, waves and numericals.',
    detail: 'Physics support is for students who can recite a formula and still feel unsure what it describes. Lessons slow the problem down: picture, units, relationship, then calculation.',
    focuses: ['Reading a question for what it is actually asking', 'Sketching the situation before calculating', 'Connecting a classroom topic to a worked example'],
    benefit: 'The aim is understanding the student can explain back, not a page of copied steps.',
  },
  {
    name: 'Chemistry',
    icon: FlaskConical,
    tint: 'bg-[#FCE7F3] text-[#DB2777]',
    image: '/brand/subjects/chemistry.jpg',
    alt: 'Laboratory glassware and a flask on a stone bench',
    summary: 'Equations, bonding, reactions and the language of chemistry.',
    detail: 'Chemistry becomes manageable when the pattern is visible. Tutors separate vocabulary, representation and calculation so the student is not asked to memorise all three at once.',
    focuses: ['Writing and balancing with a reason for each step', 'Linking a reaction to what the student can observe', 'Steady practice on the topics currently in school'],
    benefit: 'Confidence grows when the symbols start to mean something.',
  },
  {
    name: 'Biology',
    icon: Leaf,
    tint: 'bg-[#ECFDF3] text-[#16A34A]',
    image: '/brand/subjects/biology.jpg',
    alt: 'A microscope beside a fern and a small pot of moss',
    summary: 'Life processes, diagrams and terminology.',
    detail: 'Biology lessons favour accurate language and pictures the student draws themselves. The tutor checks what has stayed, then returns to the process that is still fuzzy.',
    focuses: ['Turning a diagram into a spoken explanation', 'Connecting processes instead of isolated facts', 'Revision that follows the student’s own gaps'],
    benefit: 'Recall is stronger when the student can tell the story of the process.',
  },
  {
    name: 'Science',
    icon: Microscope,
    tint: 'bg-[#EDE4FA] text-[#6527B8]',
    image: '/brand/subjects/science.jpg',
    alt: 'A magnet, iron filings and a balance scale on a lab bench',
    summary: 'Scientific ideas held together, before or alongside separate sciences.',
    detail: 'Science sessions suit students who are still meeting biology, chemistry and physics as one subject, or who want the links between them made explicit.',
    focuses: ['Asking a testable question', 'Using evidence without rushing the conclusion', 'Seeing how the sciences speak to one another'],
    benefit: 'A joined-up view makes later specialist study less abrupt.',
  },
  {
    name: 'English',
    icon: BookOpen,
    tint: 'bg-[#EDE9FE] text-[#6D28D9]',
    image: '/brand/subjects/english.jpg',
    alt: 'An open book, a lamp and a fountain pen in a reading corner',
    summary: 'Reading, writing, grammar and spoken confidence.',
    detail: 'English support is personal because the writing is personal. Tutors read with the student, work on the sentence in front of them, and practise speaking when that is the goal.',
    focuses: ['Close reading of a passage the student is studying', 'Clearer paragraphs and more precise grammar', 'Preparation for presentations or spoken tasks'],
    benefit: 'The student sounds more like themselves, and more in control of the page.',
  },
  {
    name: 'Computer Science',
    icon: Code2,
    tint: 'bg-[#EEF2FF] text-[#4338CA]',
    image: '',
    alt: '',
    summary: 'Programs, logic and careful checking of a result.',
    detail: 'Computer science support is discussed in consultation. We confirm whether a tutor can be arranged before any lesson is promised. Sessions would follow the work the student is doing in school.',
    focuses: ['Reading what a short program is meant to do', 'Checking one step at a time', 'Practice taken from the student’s current work'],
    benefit: 'Nothing is offered until a suitable tutor is confirmed.',
  },
  {
    name: 'Commerce',
    icon: Globe2,
    tint: 'bg-[#FFF7ED] text-[#C2410C]',
    image: '',
    alt: '',
    summary: 'How money, trade and simple records fit together.',
    detail: 'Commerce is available to enquire about. During consultation we listen to the student’s goal and confirm whether TutorAstra can offer a suitable one-to-one tutor.',
    focuses: ['The idea the student is currently studying', 'A worked example, then an independent try', 'Language that stays precise'],
    benefit: 'An honest match matters more than a long catalogue.',
  },
  {
    name: 'More Subjects',
    icon: LayoutGrid,
    tint: 'bg-[#F5F0FC] text-[#310064]',
    image: '/brand/subjects/other.jpg',
    alt: 'A globe, a sketchbook and part of a piano on a wide table',
    summary: 'A subject outside this list, if a suitable tutor is available.',
    detail: 'Some families need a subject outside this set. During consultation we listen first, then confirm whether TutorAstra can offer a suitable one-to-one tutor. Nothing is promised before that match is real.',
    focuses: ['Tell us the subject and the student’s current goal', 'We confirm whether a tutor can be arranged', 'Lessons begin only after that is agreed'],
    benefit: 'An honest answer is better than a catalogue we cannot stand behind.',
  },
];

function SubjectsInner() {
  const params = useSearchParams();
  const requested = params.get('subject');
  const detailRef = useRef<HTMLDivElement>(null);
  const initial = subjects.find((item) => item.name === requested)?.name ?? 'Mathematics';
  const [active, setActive] = useState<SubjectName>(initial);

  useEffect(() => {
    const match = subjects.find((item) => item.name === requested);
    if (match) setActive(match.name);
  }, [requested]);

  const selected = subjects.find((item) => item.name === active) ?? subjects[0];

  const choose = (name: SubjectName) => {
    setActive(name);
    if (window.innerWidth < 1024) {
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section id="subjects" data-header-tone="light" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="ta-rule font-display text-3xl font-bold text-[#21152D] sm:text-4xl">Subjects we cover</h2>
          <p className="mt-3 text-base leading-7 text-[#51475B]">
            Choose a subject on the left. The detail opens on the right. Boards, session length and fees are confirmed in consultation.
          </p>
        </div>

        <div className="mt-10 grid items-start gap-6 lg:grid-cols-[320px_1fr]">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1" role="list">
            {subjects.map((subject) => {
              const isActive = subject.name === active;
              const Icon = subject.icon;
              return (
                <button
                  key={subject.name}
                  type="button"
                  role="listitem"
                  onClick={() => choose(subject.name)}
                  aria-pressed={isActive}
                  className={`flex min-h-14 items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-[15px] font-semibold transition ${
                    isActive ? 'border-[#310064] bg-[#310064] text-white' : 'border-[#E8E2ED] bg-white text-[#310064] hover:border-[#310064]'
                  }`}
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isActive ? 'bg-white text-[#310064]' : subject.tint}`}>
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className={`border-b-2 pb-0.5 ${isActive ? 'border-[#F4CC45]' : 'border-transparent'}`}>{subject.name}</span>
                </button>
              );
            })}
          </div>

          <article ref={detailRef} className="scroll-mt-28 overflow-hidden rounded-lg border border-[#E8E2ED] bg-white">
            {selected.image ? (
              <Image
                key={selected.image}
                src={selected.image}
                alt={selected.alt}
                width={1200}
                height={900}
                className="h-64 w-full object-cover sm:h-80"
              />
            ) : (
              <div className={`flex h-40 items-center justify-center ${selected.tint}`}>
                {React.createElement(selected.icon, { className: 'h-10 w-10' })}
              </div>
            )}
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <span className={`flex h-11 w-11 items-center justify-center rounded-lg ${selected.tint}`}>
                  {React.createElement(selected.icon, { className: 'h-5 w-5' })}
                </span>
                <h3 className="font-display text-4xl text-[#310064]">{selected.name}</h3>
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#746B80]">{selected.detail}</p>
              <ul className="mt-5 space-y-2 text-sm leading-6 text-[#746B80]">
                {selected.focuses.map((focus) => (
                  <li key={focus} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#6527B8]" />
                    <span>{focus}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm font-medium text-[#310064]">{selected.benefit}</p>
              <a
                href={`/?subject=${encodeURIComponent(selected.name)}#consultation`}
                className="mt-6 inline-flex rounded-lg bg-[#310064] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#240047]"
              >
                Enquire about {selected.name}
              </a>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

export default function SubjectsSection() {
  return (
    <Suspense fallback={<section id="subjects" className="bg-white py-24" />}>
      <SubjectsInner />
    </Suspense>
  );
}
