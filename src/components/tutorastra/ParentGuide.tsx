'use client';

import React, { useState } from 'react';
import { SUBJECTS, type SubjectName } from '@/components/tutorastra/SubjectsSection';

type Step = 'start' | 'subject' | 'stage' | 'done' | 'subjects' | 'how' | 'question';

type Bubble = { from: 'guide' | 'parent'; text: string };

const choiceClass =
  'rounded-full border border-[#E9E1F1] bg-[#fffaf3] px-3 py-2 text-left text-xs font-semibold text-[#310064] hover:border-[#310064]';

const startBubbles: Bubble[] = [
  {
    from: 'guide',
    text: 'Hello. I can help you register your interest in one-to-one classes. I am a short guide on this page, not a live tutor.',
  },
];

export default function ParentGuide() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('start');
  const [subject, setSubject] = useState<SubjectName | ''>('');
  const [messages, setMessages] = useState<Bubble[]>(startBubbles);
  const [note, setNote] = useState('');

  const say = (parent: string, guide: string, next: Step) => {
    setMessages((current) => [...current, { from: 'parent', text: parent }, { from: 'guide', text: guide }]);
    setStep(next);
  };

  const reset = () => {
    setStep('start');
    setSubject('');
    setNote('');
    setMessages(startBubbles);
  };

  return (
    <div className="relative">
      {open && (
        <div className="absolute bottom-16 right-0 w-[min(22rem,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-[#E9E1F1] bg-[#fffaf3] text-[#241536] shadow-[0_24px_60px_-28px_rgba(39,0,82,0.55)]">
          <div className="flex items-start justify-between gap-3 bg-[#310064] px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">Parent guide</p>
              <p className="text-xs text-white/70">A few questions, then the registration form.</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="text-sm text-[#F4CC45]" aria-label="Close parent guide">
              Close
            </button>
          </div>
          <div className="max-h-80 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message, index) => (
              <p
                key={`${message.from}-${index}`}
                className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-6 ${
                  message.from === 'guide'
                    ? 'bg-white text-[#310064]'
                    : 'ml-auto bg-[#310064] text-white'
                }`}
              >
                {message.text}
              </p>
            ))}
          </div>
          <div className="border-t border-[#eadfce] bg-white px-4 py-3">
            {step === 'start' && (
              <div className="flex flex-col gap-2">
                <button type="button" className={choiceClass} onClick={() => say('I want to register', 'Which subject should we start with?', 'subject')}>
                  I want to register
                </button>
                <button type="button" className={choiceClass} onClick={() => say('Which subjects are available?', 'You can ask about Mathematics, Physics, Chemistry, Biology, Science, English, or another subject. A tutor is confirmed during consultation.', 'subjects')}>
                  Which subjects are available?
                </button>
                <button type="button" className={choiceClass} onClick={() => say('How do classes work?', 'You tell us the goal, we listen for strengths and gaps, you meet a tutor, then one-to-one classes begin. Registration starts with the consultation form.', 'how')}>
                  How do classes work?
                </button>
              </div>
            )}
            {step === 'subject' && (
              <div className="flex flex-wrap gap-2">
                {SUBJECTS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={choiceClass}
                    onClick={() => {
                      setSubject(item);
                      say(item, 'What stage is the student in? You can also leave this for the form.', 'stage');
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
            {step === 'stage' && (
              <div className="flex flex-col gap-2">
                {['Primary years', 'Middle school', 'Secondary', 'I will add it on the form'].map((stage) => (
                  <button
                    key={stage}
                    type="button"
                    className={choiceClass}
                    onClick={() =>
                      say(
                        stage,
                        'The form is how families register their interest. It takes a minute. The team then confirms a time with you. It does not start classes by itself.',
                        'done'
                      )
                    }
                  >
                    {stage}
                  </button>
                ))}
              </div>
            )}
            {(step === 'done' || step === 'subjects' || step === 'how') && (
              <div className="flex flex-col gap-2">
                <a
                  href={subject ? `/?subject=${encodeURIComponent(subject)}#consultation` : '/#consultation'}
                  onClick={() => setOpen(false)}
                  className="inline-flex justify-center rounded-full bg-[#F4CC45] px-4 py-2.5 text-sm font-semibold text-[#310064]"
                >
                  Open the registration form
                </a>
                <button type="button" className="text-xs font-medium text-[#6527B8]" onClick={reset}>
                  Start again
                </button>
              </div>
            )}
            {step === 'question' && (
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  const value = note.trim();
                  if (value.length < 2) return;
                  setNote('');
                  say(value, 'Thank you. Add that note on the registration form, or message us on WhatsApp, and the team will reply.', 'done');
                }}
              >
                <input
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="min-w-0 flex-1 rounded-full border border-[#E9E1F1] px-3 py-2 text-sm outline-none focus:border-[#6527B8]"
                  placeholder="Your question"
                  aria-label="Your question"
                />
                <button type="submit" className="rounded-full bg-[#310064] px-3 py-2 text-xs font-semibold text-white">
                  Send
                </button>
              </form>
            )}
            {step === 'start' && (
              <button type="button" className="mt-2 text-xs font-medium text-[#6527B8]" onClick={() => setStep('question')}>
                I have another question
              </button>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label="Ask a guide"
        className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#310064] text-sm font-semibold text-white shadow-[0_12px_30px_-16px_rgba(39,0,82,0.9)] sm:h-auto sm:w-auto sm:gap-2 sm:py-2 sm:pl-2 sm:pr-4"
      >
        <img src="/brand/ms-violet.jpg" alt="" className="h-12 w-12 object-cover object-top sm:h-9 sm:w-9 sm:rounded-full" />
        <span className="hidden sm:inline">Ask a guide</span>
      </button>
    </div>
  );
}
