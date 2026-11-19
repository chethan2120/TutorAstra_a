'use client';

import React, { useEffect, useState } from 'react';

const LINES = ['Ready For Test', 'Select the subject', 'Upload File here'] as const;

export default function VioletFigure({ spoken = true }: { spoken?: boolean }) {
  const [line, setLine] = useState(0);
  const [voice, setVoice] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setLine((current) => (current + 1) % LINES.length), 4200);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!spoken || !voice || typeof window === 'undefined' || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(LINES[line]);
    utterance.rate = 0.95;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return () => window.speechSynthesis.cancel();
  }, [line, spoken, voice]);

  return (
    <div>
      <figure className="overflow-hidden rounded-lg bg-white shadow-[0_18px_40px_-28px_rgba(49,0,100,0.45)]">
        <img
          src="/images/tutor/ms-violet-teaching.jpg"
          alt="Ms. Violet pointing to a notebook while a student writes the next line"
          className="aspect-[4/5] w-full object-cover object-[center_20%]"
        />
      </figure>
      <p className="mt-4 text-sm leading-6 text-[#51475B]">
        She stays on the notebook until the step is clear, then leaves the next question with the student.
      </p>
      <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-[#310064]" role="status">{LINES[line]}</p>
      {spoken && (
        <button type="button" className="mt-3 rounded-full bg-[#310064] px-3 py-1.5 text-xs font-semibold text-white" onClick={() => setVoice((current) => !current)}>
          {voice ? 'Spoken on' : 'Hear the lines'}
        </button>
      )}
      <p className="mt-3 max-w-xs text-xs leading-relaxed text-[#51475B]">PDF or a clear image, 3 pages only.</p>
    </div>
  );
}
