import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroSection from '@/components/tutorastra/HeroSection';
import AfterHero from '@/components/tutorastra/AfterHero';
import WhySection from '@/components/tutorastra/WhySection';
import SubjectsSection from '@/components/tutorastra/SubjectsSection';
import HowItWorks from '@/components/tutorastra/HowItWorks';
import ConsultationSection from '@/components/tutorastra/ConsultationSection';
import AiTutorSection from '@/components/tutorastra/AiTutorSection';
import FaqSection from '@/components/tutorastra/FaqSection';
import JourneySection from '@/components/tutorastra/JourneySection';
import { BeforeTutorSection, BetweenSection, ConfirmedLaterSection, GradesSection, LessonSection, ParentsSection } from '@/components/tutorastra/InfoSections';
import ScrollToSection from '@/components/tutorastra/ScrollToSection';
import DemoPopup from '@/components/tutorastra/DemoPopup';

export default function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'TutorAstra',
    slogan: 'Your Ambition. Our Mission.',
    description: 'Personalised one-to-one learning with dedicated tutors and study plans shaped around each student.',
  };

  return (
    <div className="flex min-h-screen flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />
      <ScrollToSection />
      <DemoPopup />
      <main className="flex-grow">
        <HeroSection />
        <AfterHero />
        <SubjectsSection />
        <GradesSection />
        <HowItWorks />
        <LessonSection />
        <BetweenSection />
        <WhySection />
        <ParentsSection />
        <BeforeTutorSection />
        <AiTutorSection />
        <JourneySection />
        <ConfirmedLaterSection />
        <FaqSection />
        <ConsultationSection />
      </main>
      <Footer />
    </div>
  );
}
