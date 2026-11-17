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
    <div className="violet-stage">
      <div className="violet-floor" />
      <div className="violet-rig" aria-hidden="true">
        <div className="violet-arm violet-arm-left"><span className="violet-hand" /></div>
        <div className="violet-body" />
        <div className="violet-arm violet-arm-right"><span className="violet-hand" /></div>
        <div className="violet-head">
          <span className="violet-eye" />
          <span className="violet-eye" />
        </div>
      </div>
      <p className="violet-line" role="status">{LINES[line]}</p>
      {spoken && (
        <button type="button" className="mt-3 rounded-full bg-[#310064] px-3 py-1.5 text-xs font-semibold text-white" onClick={() => setVoice((current) => !current)}>
          {voice ? 'Spoken on' : 'Hear the lines'}
        </button>
      )}
      <p className="mt-3 max-w-xs text-xs leading-relaxed text-[#51475B]">PDF or a clear image, 3 pages only.</p>
    </div>
  );
}
