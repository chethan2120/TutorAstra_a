import React from 'react';

const quotes = [
  {
    role: 'Sample parent',
    quote: 'The lesson finally moved at our child’s pace. This is a sample line for layout approval, not a customer review.',
  },
  {
    role: 'Sample student',
    quote: 'I could ask the same question twice without feeling rushed. Placeholder copy for the client to replace.',
  },
  {
    role: 'Sample parent',
    quote: 'We wanted a tutor who would stay with one subject long enough to see progress. Demo text only.',
  },
];

export default function TestimonialsSection() {
  return (
    <section id="stories" data-header-tone="light" className="bg-[#FAF8FF] py-20 sm:py-24" aria-labelledby="stories-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6527B8]">Stories</p>
            <h2 id="stories-heading" className="font-display mt-3 text-4xl font-semibold text-[#310064] sm:text-5xl">
              Words we hope families will one day share.
            </h2>
          </div>
          <p className="max-w-sm rounded-2xl border border-[#F4CC45] bg-white px-4 py-3 text-xs leading-relaxed text-[#746B80]">
            Demo testimonials for client approval. These are not real customers, not verified reviews, and not ratings.
          </p>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {quotes.map((item) => (
            <figure key={item.quote} className="ta-card flex h-full min-h-[240px] flex-col p-6">
              <span className="font-display text-5xl leading-none text-[#310064]/15" aria-hidden="true">“</span>
              <blockquote className="mt-2 text-sm leading-relaxed text-[#746B80]">{item.quote}</blockquote>
              <figcaption className="mt-6 text-sm font-semibold text-[#310064]">
                {item.role}
                <span className="mt-1 block text-xs font-medium uppercase tracking-wider text-[#6527B8]">Sample · pending approval</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
