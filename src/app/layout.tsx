import type { Metadata } from 'next';
import './globals.css';
import MathMarks from '@/components/tutorastra/MathMarks';
import ScrollAction from '@/components/ScrollAction';
import ScrollAnimations from '@/components/ScrollAnimations';
import { getSetting } from '@/lib/db';

export const metadata: Metadata = {
  title: {
    default: 'TutorAstra | Personalised One-to-One Learning',
    template: '%s | TutorAstra',
  },
  description: 'Personalised one-to-one learning with dedicated tutors, flexible schedules and study plans designed around your ambitions. Your Ambition. Our Mission.',
  keywords: ['TutorAstra', 'one-to-one tutoring', 'personalised learning', 'online tutor', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'],
  openGraph: {
    title: 'TutorAstra | Personalised Learning. Extraordinary Possibilities.',
    description: 'Discover one-to-one learning with dedicated tutors and a plan designed around your ambitions.',
    siteName: 'TutorAstra',
    locale: 'en_US',
    type: 'website',
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const whatsappNumber = getSetting('whatsapp_number', '');

  return (
    <html lang="en">
      <body className="relative min-h-screen flex flex-col bg-transparent text-[#21152D] antialiased selection:bg-[#F4CC45] selection:text-[#21152D]">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[#FAF9FC]" />
        <a href="#about" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[80] focus:rounded-lg focus:bg-[#F4CC45] focus:px-4 focus:py-2 focus:text-[#240047]">
          Skip to content
        </a>
        <MathMarks />
        <div className="relative z-10 flex min-h-screen flex-col">{children}</div>
        <ScrollAction whatsappNumber={whatsappNumber} />
        <ScrollAnimations />
      </body>
    </html>
  );
}
