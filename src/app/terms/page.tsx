import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Terms and Conditions',
  description: 'TutorAstra terms are being confirmed before public enrolment. Consultation requests on this site are saved for the team to review.',
};

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-grow bg-white py-16">
        <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6527B8]">TutorAstra</p>
          <h1 className="font-display text-4xl text-[#310064] sm:text-5xl">Terms and Conditions</h1>
          <p className="text-sm leading-relaxed text-[#746B80]">
            The full terms for lessons, fees and schedules are still being confirmed. Nothing on this website is an offer of a priced programme, a board qualification, or a guaranteed academic result.
          </p>
          <p className="text-sm leading-relaxed text-[#746B80]">
            A consultation request is a message to the TutorAstra team. It is saved in the existing enquiry desk and does not by itself reserve a tutor or a class. A member of the team confirms the next step with you.
          </p>
          <p className="text-sm leading-relaxed text-[#746B80]">
            The Ms. Violet section is a preview of a planned assessment experience. Files chosen there stay in your browser for this demo and are not graded.
          </p>
          <Link href="/#consultation" className="inline-flex rounded-full bg-[#F4CC45] px-5 py-3 text-sm font-semibold text-[#310064]">
            Request a consultation
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
