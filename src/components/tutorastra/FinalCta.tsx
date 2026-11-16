import React from 'react';
import { RevealText } from '@/components/tutorastra/motion';

export default function FinalCta() {
  return (
    <section data-header-tone="light" className="bg-[#FAF8FF] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#310064] via-[#310064] to-[#6527B8] px-6 py-14 text-center text-white sm:px-12" data-reveal="fade">
        <h2 className="font-display text-4xl font-semibold sm:text-6xl">
          <RevealText text="Your Ambition Deserves the Right Guidance." />
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-white/80">
          Take the first step towards a more confident learning journey.
        </p>
        <a
          href="#consultation"
          className="mt-8 inline-flex rounded-full bg-[#F4CC45] px-6 py-3.5 text-sm font-semibold text-[#310064] transition hover:-translate-y-0.5 hover:bg-[#FFE58A]"
        >
          Book Your Free Consultation
        </a>
      </div>
    </section>
  );
}
