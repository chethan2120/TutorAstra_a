import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'How TutorAstra handles the details you send through the consultation form.',
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-grow bg-white py-16">
        <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6527B8]">TutorAstra</p>
          <h1 className="font-display text-4xl text-[#310064] sm:text-5xl">Privacy</h1>
          <p className="text-sm leading-relaxed text-[#746B80]">
            The consultation form asks for your name, email, phone number, the student’s grade, a preferred subject, a preferred date and a message. Those details are stored with the existing TutorAstra enquiry records so the team can reply.
          </p>
          <p className="text-sm leading-relaxed text-[#746B80]">
            This demo does not email you a confirmation automatically. Sign-in uses the existing account system. The AI Tutor preview does not upload your file.
          </p>
          <p className="text-sm leading-relaxed text-[#746B80]">
            A fuller privacy notice, including a confirmed contact address, will be published before public enrolment. Until then, use the consultation form if you want the team to reach you.
          </p>
          <Link href="/#consultation" className="inline-flex rounded-full bg-[#310064] px-5 py-3 text-sm font-semibold text-white">
            Contact the team
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
