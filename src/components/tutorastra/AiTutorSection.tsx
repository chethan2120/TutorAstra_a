'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { SUBJECTS } from '@/components/tutorastra/SubjectsSection';
import { RevealText } from '@/components/tutorastra/motion';

const LINES = ['Ready For Test?', 'Select the Subject', 'Upload Your File Here'] as const;

const SAMPLES: Record<string, { question: string; options: string[]; written: string }> = {
  Mathematics: {
    question: 'Which step comes first when solving 3(x + 2) = 18?',
    options: ['Divide both sides by 3', 'Add 2 to both sides', 'Multiply both sides by x'],
    written: 'Explain how you would check your answer.',
  },
  Physics: {
    question: 'A speed-time graph is a horizontal line. What does that show?',
    options: ['Constant speed', 'Constant acceleration', 'The object is at rest only if the line is on the time axis'],
    written: 'Describe one force acting in a situation you choose.',
  },
  Chemistry: {
    question: 'What does a balanced equation conserve?',
    options: ['Atoms of each element', 'The number of molecules only', 'The colour of the reactants'],
    written: 'Explain one observation you would expect.',
  },
  Biology: {
    question: 'Which structure controls what enters a cell?',
    options: ['Cell membrane', 'Cell wall only', 'Vacuole'],
    written: 'Describe the process in your own words.',
  },
  Science: {
    question: 'A fair test changes how many variables at a time?',
    options: ['One', 'As many as possible', 'None'],
    written: 'Say what you would measure and what you would keep the same.',
  },
  'Computer Science': {
    question: 'What does a loop do in a short program?',
    options: ['Repeats a set of steps', 'Deletes the file', 'Changes the computer’s language'],
    written: 'Describe one step you would check if the program did not do what you expected.',
  },
  Commerce: {
    question: 'A simple budget compares which two things?',
    options: ['Money coming in and money going out', 'Only the price of one item', 'The colour of a receipt'],
    written: 'Name one reason a family might track spending.',
  },
  English: {
    question: 'Which sentence is a complete sentence?',
    options: ['The tutor listened.', 'Because the student asked.', 'After the lesson.'],
    written: 'Rewrite one sentence so the meaning is clearer.',
  },
  'Other Subjects': {
    question: 'This layout shows how a short check could appear for a subject you name.',
    options: ['Option A', 'Option B', 'Option C'],
    written: 'The written box would hold a question for that subject.',
  },
};

const STEPS = [
  { label: 'Subject', line: 1 },
  { label: 'File', line: 2 },
  { label: 'Questions', line: 0 },
] as const;

async function estimatePdfPages(file: File) {
  const buffer = await file.arrayBuffer();
  const text = new TextDecoder('latin1').decode(buffer);
  const matches = text.match(/\/Type\s*\/Page\b/g);
  return matches ? matches.length : null;
}

function clock(total: number) {
  const minutes = String(Math.floor(total / 60)).padStart(2, '0');
  const seconds = String(total % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export default function AiTutorSection() {
  const [line, setLine] = useState(0);
  const [step, setStep] = useState(0);
  const [subject, setSubject] = useState<string>('Mathematics');
  const [choice, setChoice] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [fileNote, setFileNote] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(20 * 60);
  const [running, setRunning] = useState(false);
  const previewRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          setRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  const sample = SAMPLES[subject] ?? SAMPLES['Other Subjects'];

  const showLine = (index: number) => {
    setLine(index);
    setStep(index === 1 ? 0 : index === 2 ? 1 : 2);
  };

  const replacePreview = (next: string | null) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = next;
    setPreview(next);
  };

  const onFile = async (file: File | undefined) => {
    showLine(2);
    setFileError(null);
    setFileNote(null);
    replacePreview(null);
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/');
    if (!isPdf && !isImage) {
      setFileError('Only PDFs or clear images are accepted.');
      return;
    }
    if (isImage) {
      replacePreview(URL.createObjectURL(file));
      setFileNote(`${file.name} is shown here as a one-page preview. It stays in your browser and is not uploaded, graded or emailed.`);
      return;
    }
    const pages = await estimatePdfPages(file);
    if (pages !== null && pages > 3) {
      setFileError('This preview accepts a maximum of three pages.');
      return;
    }
    if (pages === null) {
      setFileError('We could not confirm the page count. Please use a PDF of up to three pages.');
      return;
    }
    setFileNote(`${file.name} (${pages} page${pages === 1 ? '' : 's'}) stays in this browser. It is not uploaded, graded or emailed.`);
  };

  return (
    <section id="ai-tutor" data-header-tone="light" className="relative overflow-hidden bg-[#F5F0FC] py-20 text-[#241536] sm:py-24">
      <div className="relative mx-4 mb-10 flex max-w-7xl flex-col items-start justify-between gap-4 rounded-lg border border-[#E8E2ED] bg-white px-5 py-4 sm:mx-6 sm:flex-row sm:items-center sm:px-6 lg:mx-auto">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-base font-semibold text-[#310064]">Meet Your AI Tutor</p>
            <p className="text-sm text-[#746B80]">A preview of Ms. Violet. Nothing on this desk is scored or sent.</p>
          </div>
        </div>
        <a href="#ai-tutor" className="inline-flex items-center gap-2 rounded-full bg-[#310064] px-4 py-2.5 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[#6527B8]">
          Try the preview
        </a>
      </div>
      <div className="relative mx-auto grid max-w-7xl items-start gap-12 px-4 sm:px-6 lg:grid-cols-[0.86fr_1.14fr] lg:px-8" data-no-reveal>
        <div className="lg:sticky lg:top-28 lg:self-start" data-reveal="left">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6527B8]">AI Tutor</p>
          <h2 className="ta-rule font-display mt-3 text-4xl font-bold text-[#310064] sm:text-5xl">
            <RevealText text="Meet Ms. Violet" />
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-[#746B80]">
            Ms. Violet is TutorAstra&apos;s planned learning companion. Use the desk to see how a short check is meant to feel. This page does not mark work, upload files, or send a report.
          </p>
          <div className="relative mx-auto mt-8 max-w-sm">
            <div className="overflow-hidden rounded-[2rem] border border-[#F4CC45]/40 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.7)]">
              <Image
                src="/brand/ms-violet.jpg"
                alt="Ms. Violet, TutorAstra’s illustrated AI learning companion"
                width={768}
                height={1024}
                className="h-auto w-full object-cover"
              />
            </div>
            <div
              className="ta-bubble-in absolute -right-2 top-6 max-w-[13rem] rounded-3xl rounded-bl-md bg-white px-4 py-3 text-sm font-semibold text-[#310064] shadow-lg sm:-right-8"
              key={LINES[line]}
            >
              {LINES[line]}
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {LINES.map((item, index) => (
              <button
                key={item}
                type="button"
                onClick={() => showLine(index)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  line === index ? 'bg-[#310064] text-white' : 'bg-white text-[#310064]'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[1.6rem] bg-[#F0E9FA] p-4 text-[#241536] shadow-[0_30px_70px_-40px_rgba(0,0,0,0.8)] sm:p-6" data-reveal="right">
          <div className="flex items-start justify-between gap-3 border-b border-[#310064]/10 pb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#6527B8]">Assessment desk</p>
              <p className="mt-1 text-sm text-[#746B80]">A preview of the planned check. Nothing is scored or sent.</p>
            </div>
            <div className="text-right">
              <p className="font-display text-3xl leading-none text-[#310064]">{clock(seconds)}</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6527B8]">
                {seconds === 0 ? 'Preview ended' : running ? 'Preview clock' : '20:00 planned'}
              </p>
            </div>
          </div>

          <ol className="mt-4 grid grid-cols-3 gap-2">
            {STEPS.map((item, index) => (
              <li key={item.label}>
                <button
                  type="button"
                  onClick={() => showLine(item.line)}
                  className={`flex w-full items-center gap-2 rounded-full px-3 py-2 text-left text-xs font-semibold ${
                    step === index ? 'bg-[#310064] text-white' : 'bg-white text-[#310064]'
                  }`}
                >
                  <span className={step === index ? 'text-[#F4CC45]' : 'text-[#6527B8]'}>0{index + 1}</span>
                  {item.label}
                </button>
              </li>
            ))}
          </ol>

          <div className="mt-5">
            <p className="text-sm font-semibold text-[#310064]">Select the Subject</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SUBJECTS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    showLine(1);
                    setSubject(item);
                    setChoice(null);
                  }}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    subject === item ? 'bg-[#310064] text-white' : 'bg-white text-[#310064]'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <label className="mt-5 block rounded-2xl border border-dashed border-[#6527B8]/50 bg-white p-4 text-sm">
            <span className="font-semibold text-[#310064]">Upload Your File Here</span>
            <input
              type="file"
              accept="application/pdf,image/*"
              className="mt-3 block w-full text-xs text-[#746B80] file:mr-3 file:rounded-full file:border-0 file:bg-[#F4CC45] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#310064]"
              onChange={(event) => onFile(event.target.files?.[0])}
            />
            <span className="mt-3 block text-xs leading-relaxed text-[#746B80]">
              PDFs or clear images, up to three pages. The file never leaves this browser.
            </span>
            {preview && (
              <img src={preview} alt="Local preview of the selected image" className="mt-4 max-h-40 w-full rounded-xl object-cover" />
            )}
          </label>
          {fileError && <p className="mt-3 rounded-xl bg-rose-100 px-3 py-2 text-sm text-rose-900" role="alert">{fileError}</p>}
          {fileNote && <p className="mt-3 rounded-xl bg-white px-3 py-2 text-sm text-[#746B80]" role="status">{fileNote}</p>}

          <div className="mt-5 rounded-2xl bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6527B8]">{subject} · sample paper</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRunning((value) => !value)}
                  disabled={seconds === 0}
                  className="rounded-full bg-[#310064] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                >
                  {running ? 'Pause clock' : 'Start preview clock'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRunning(false);
                    setSeconds(20 * 60);
                  }}
                  className="rounded-full border border-[#E9E1F1] px-3 py-1.5 text-xs font-semibold text-[#310064]"
                >
                  Reset
                </button>
              </div>
            </div>
            <p className="mt-4 font-display text-2xl leading-snug text-[#310064]">{sample.question}</p>
            <div className="mt-3 space-y-2">
              {sample.options.map((option, index) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    showLine(0);
                    setChoice(index);
                  }}
                  className={`block w-full rounded-xl border px-3 py-2 text-left text-sm ${
                    choice === index ? 'border-[#6527B8] bg-[#F0E9FA]' : 'border-[#E9E1F1]'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            {choice !== null && (
              <p className="mt-3 rounded-lg bg-[#F5F0FA] px-3 py-2 text-sm text-[#310064]" role="status">
                You picked “{sample.options[choice]}”. It stays on this page. Ms. Violet does not mark it.
              </p>
            )}
            <label className="mt-4 block text-sm text-[#746B80]">
              {sample.written}
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value.slice(0, 400))}
                rows={3}
                className="mt-2 w-full resize-none rounded-xl border border-[#E9E1F1] px-3 py-2 text-sm text-[#241536] outline-none focus:border-[#6527B8]"
                placeholder="Write here if you want to try the box. It is not saved."
              />
            </label>
            {seconds === 0 && (
              <p className="mt-3 rounded-xl bg-[#F0E9FA] px-3 py-2 text-sm text-[#310064]" role="status">
                Preview time is up. Nothing was submitted.
              </p>
            )}
            <p className="mt-4 text-xs leading-relaxed text-[#746B80]">
              A finished version is planned to time the paper and return a score with revision notes for {subject}. This desk is the layout only.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
