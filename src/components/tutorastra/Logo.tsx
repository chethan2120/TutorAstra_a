import React from 'react';

type LogoProps = {
  className?: string;
  imageClassName?: string;
  withWordmark?: boolean;
  showTagline?: boolean;
  tone?: 'light' | 'dark';
  wordmarkClassName?: string;
};

export default function Logo({
  className = '',
  imageClassName = 'h-12 w-12',
  withWordmark = true,
  showTagline = true,
  tone = 'dark',
  wordmarkClassName = 'text-[1.35rem]',
}: LogoProps) {
  const name = tone === 'light' ? 'text-white' : 'text-[#310064]';
  const tag = tone === 'light' ? 'text-[#F4CC45]' : 'text-[#6527B8]';

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <img
        src="/tutorastra-logo.jpg"
        alt=""
        width={96}
        height={96}
        className={`shrink-0 rounded-full object-cover ring-2 ring-[#F4CC45] ${imageClassName}`}
      />
      {withWordmark && (
        <span className="min-w-0 text-left leading-tight">
          <span className={`block font-display font-semibold tracking-tight ${wordmarkClassName} ${name}`}>
            TutorAstra
          </span>
          {showTagline && (
            <span className={`mt-0.5 hidden text-[10px] font-semibold uppercase tracking-[0.18em] sm:block ${tag}`}>
              Your Ambition. Our Mission.
            </span>
          )}
        </span>
      )}
    </span>
  );
}
