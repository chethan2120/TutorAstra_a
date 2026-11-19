'use client';

import React, { useEffect, useRef, useState } from 'react';
import { SUBJECTS } from '@/components/tutorastra/SubjectsSection';
import { RevealText } from '@/components/tutorastra/motion';
import VioletFigure from '@/components/tutorastra/VioletFigure';

const LINES = ['Ready For Test', 'Select the subject', 'Upload File here'] as const;

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
  const [fileNote, setFileNote] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(20 * 60);
  const [running, setRunning] = useState(false);
  const [paper, setPaper] = useState<any>(null);
  const [resultNote, setResultNote] = useState('');
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
    const form = new FormData();
    form.set('subject', subject === 'More Subjects' ? 'General' : subject);
    form.set('file', file);
    const response = await fetch('/api/portal/assessments', { method: 'POST', body: form });
    const body = await response.json();
    if (!response.ok) {
      if (isImage) {
        replacePreview(URL.createObjectURL(file));
      }
      setFileError(body.error || 'Sign in as Student 1 to start a marked test.');
      return;
    }
    setPaper(body);
    const remain = Math.max(0, Math.floor((new Date(body.deadline).getTime() - Date.now()) / 1000));
    setSeconds(remain);
    setRunning(true);
    setFileNote('The test is timed from the server. Submit before the clock ends.');
  };

  return (
    <section id="ai-tutor" data-header-tone="light" className="relative overflow-hidden bg-[#F5F0FC] py-20 text-[#241536] sm:py-24">
      <div className="relative mx-4 mb-10 flex max-w-7xl flex-col items-start justify-between gap-4 rounded-lg border border-[#E8E2ED] bg-white px-5 py-4 sm:mx-6 sm:flex-row sm:items-center sm:px-6 lg:mx-auto">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-base font-semibold text-[#310064]">Meet Your AI Tutor</p>
            <p className="text-sm text-[#746B80]">Ms. Violet reads a PDF of up to 3 pages after you sign in as a student.</p>
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
            Ms. Violet reads a PDF of up to three pages, builds a short test, and times it. Sign in as Student 1 for the score to appear on the student desk and in the Teacher box.
          </p>
          <div className="relative mx-auto mt-8 max-w-sm">
            <VioletFigure />
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
              <p className="mt-1 text-sm text-[#746B80]">PDF or a clear image, 3 pages only. A signed-in student receives the score on the dashboard.</p>
            </div>
            <div className="text-right">
              <p className="font-display text-3xl leading-none text-[#310064]">{clock(seconds)}</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6527B8]">
                {seconds === 0 ? 'Preview ended' : running ? 'Preview clock' : '20:00 planned'}
              </p>
            </div>
          </div>

          <ol className="mt-4 grid grid-cols-1 gap-2 min-[420px]:grid-cols-3">
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
              PDFs or clear images, up to three pages. Image text is not read until a reader is connected. A PDF is marked after you sign in as a student.
            </span>
            {preview && (
              <img src={preview} alt="Local preview of the selected image" className="mt-4 max-h-40 w-full rounded-xl object-cover" />
            )}
          </label>
          {fileError && <p className="mt-3 rounded-xl bg-rose-100 px-3 py-2 text-sm text-rose-900" role="alert">{fileError}</p>}
          {fileNote && <p className="mt-3 rounded-xl bg-white px-3 py-2 text-sm text-[#746B80]" role="status">{fileNote}</p>}

          <div className="mt-5 rounded-2xl bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6527B8]">{paper ? `${subject} · your test` : `${subject} · sample until you sign in`}</p>
              <p className="font-display text-2xl text-[#310064]">{clock(seconds)}</p>
            </div>
            {paper ? (
              <form className="mt-4 space-y-3" onSubmit={async (event) => {
                event.preventDefault();
                const answers = paper.questions.map((question: any) => ({
                  questionId: question.id,
                  answer: String(new FormData(event.currentTarget).get(`q-${question.id}`) || ''),
                }));
                const response = await fetch('/api/portal/assessments', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: paper.id, answers }),
                });
                const body = await response.json();
                if (!response.ok) {
                  setResultNote(body.error || 'The test could not be submitted.');
                  return;
                }
                const fresh = await fetch('/api/portal/assessments', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: paper.id }),
                });
                const marked = await fresh.json();
                setPaper(marked);
                setRunning(false);
                setResultNote(`Score ${body.score} of ${body.maxScore}. Corrections are on the student dashboard and copied to the Teacher box. Email is queued for the student and the teacher.`);
              }}>
                {paper.questions.map((question: any) => (
                  <fieldset key={question.id} className="rounded-xl border border-[#E9E1F1] p-3 text-sm">
                    <p className="font-semibold text-[#310064]">{question.prompt}</p>
                    {question.options ? question.options.map((option: string) => (
                      <label key={option} className="mt-2 block"><input type="radio" name={`q-${question.id}`} value={option} className="mr-2" />{option}</label>
                    )) : <textarea name={`q-${question.id}`} rows={3} className="mt-2 w-full rounded-xl border border-[#E9E1F1] p-2" />}
                    {question.explanation && <p className="mt-2 text-xs text-[#51475B]">{question.explanation}{question.answer ? ` Correct: ${question.answer}` : ''}</p>}
                  </fieldset>
                ))}
                <button className="rounded-full bg-[#310064] px-4 py-2 text-sm font-semibold text-white">Submit</button>
              </form>
            ) : (
              <>
                <p className="mt-4 font-display text-2xl leading-snug text-[#310064]">{sample.question}</p>
                <div className="mt-3 space-y-2">
                  {sample.options.map((option, index) => (
                    <button key={option} type="button" onClick={() => setChoice(index)} className={`block w-full rounded-xl border px-3 py-2 text-left text-sm ${choice === index ? 'border-[#6527B8] bg-[#F0E9FA]' : 'border-[#E9E1F1]'}`}>{option}</button>
                  ))}
                </div>
                <p className="mt-4 text-xs leading-relaxed text-[#746B80]">This sample is not marked. Sign in as Student 1, upload a PDF of up to 3 pages, and the timed test is saved.</p>
              </>
            )}
            {resultNote && <p className="mt-3 rounded-xl bg-[#F0E9FA] px-3 py-2 text-sm text-[#310064]" role="status">{resultNote}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
