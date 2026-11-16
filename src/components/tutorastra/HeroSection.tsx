'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

const SLIDES = [
  {
    title: 'Learn better with personalised guidance.',
    text: 'One tutor works with one student. The lesson follows what that student needs to understand next.',
    primary: { label: 'Book a Free Consultation', href: '#consultation' },
    secondary: { label: 'See the subjects', href: '#subjects' },
    image: '/images/hero/tutor-guidance.png',
    alt: 'A student in a navy hoodie writing notes while a tutor in a cream blouse points to the notebook',
  },
  {
    title: 'Practice independently. Grow confidently.',
    text: 'After the lesson, the same student continues at the desk with a notebook, books and a laptop.',
    primary: { label: 'Book a Free Consultation', href: '#consultation' },
    secondary: { label: 'How it works', href: '#how-it-works' },
    image: '/images/hero/independent-study.png',
    alt: 'The same student in a navy hoodie studying alone at a desk',
  },
  {
    title: 'Your hard work. Your achievement.',
    text: 'The same student holds a school report marked A+. This photograph is an illustration of the journey, not a promised grade.',
    primary: { label: 'Book a Free Consultation', href: '#consultation' },
    secondary: { label: 'See the subjects', href: '#subjects' },
    image: '/images/hero/student-success.png',
    alt: 'The same student in a navy hoodie holding a school report marked A+',
  },
] as const;

export default function HeroSection() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduce, setReduce] = useState(false);
  const touchX = useRef<number | null>(null);
  const slide = SLIDES[index];

  useEffect(() => {
    setReduce(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const go = (next: number) => setIndex((next + SLIDES.length) % SLIDES.length);

  useEffect(() => {
    if (paused || reduce) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % SLIDES.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [paused, reduce, index]);

  return (
    <section
      id="home"
      data-header-tone="light"
      data-no-reveal
      className="bg-white"
      aria-roledescription="carousel"
      aria-label="TutorAstra learning journey"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight') go(index + 1);
        if (event.key === 'ArrowLeft') go(index - 1);
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(event) => {
        touchX.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        if (touchX.current == null) return;
        const delta = (event.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
        if (delta > 48) go(index - 1);
        if (delta < -48) go(index + 1);
        touchX.current = null;
      }}
    >
      <div className="mx-auto grid max-w-[1280px] items-center gap-8 px-5 pb-10 pt-6 sm:px-8 lg:grid-cols-2 lg:gap-14 lg:px-16 lg:pb-12 lg:pt-8">
        <div>
          <h1 className="font-display max-w-xl text-[2.4rem] font-extrabold leading-[1.08] text-[#21152D] sm:text-5xl lg:text-[4rem]">
            {slide.title}
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-[#51475B] sm:text-lg">{slide.text}</p>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <a href={slide.primary.href} className="ta-btn-purple">
              {slide.primary.label}
            </a>
            <a href={slide.secondary.href} className="text-base font-semibold text-[#310064] underline-offset-4 hover:underline">
              {slide.secondary.label}
            </a>
          </div>
          <div className="mt-10 flex items-center gap-4">
            <div className="flex gap-2" role="tablist" aria-label="Hero slides">
              {SLIDES.map((item, itemIndex) => (
                <button
                  key={item.image}
                  type="button"
                  role="tab"
                  aria-selected={itemIndex === index}
                  aria-label={`Show slide ${itemIndex + 1}`}
                  onClick={() => go(itemIndex)}
                  className="flex h-8 items-center px-1"
                >
                  <span className={`block h-2 rounded-sm ${itemIndex === index ? 'w-8 bg-[#310064]' : 'w-2 bg-[#E8E2ED]'}`} />
                </button>
              ))}
            </div>
            <button type="button" aria-label="Previous slide" onClick={() => go(index - 1)} className="ta-hero-arrow">
              ‹
            </button>
            <button type="button" aria-label="Next slide" onClick={() => go(index + 1)} className="ta-hero-arrow">
              ›
            </button>
          </div>
        </div>

        <div className="relative">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-[#F5F0FA] lg:mx-10 lg:my-8">
            {SLIDES.map((item, itemIndex) => (
              <Image
                key={item.image}
                src={item.image}
                alt={itemIndex === index ? item.alt : ''}
                fill
                priority={itemIndex === 0}
                sizes="(min-width: 1024px) 560px, 100vw"
                className={`object-cover object-[center_18%] transition-opacity duration-500 ${itemIndex === index ? 'opacity-100' : 'opacity-0'}`}
              />
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 lg:pointer-events-none lg:absolute lg:inset-0 lg:mt-0 lg:block">
            {[
              { value: '12K+', label: 'Guided students', place: 'lg:left-0 lg:top-4' },
              { value: '40K+', label: 'Lesson hours', place: 'lg:right-0 lg:top-16' },
              { value: '250+', label: 'Subject tutors', place: 'lg:bottom-10 lg:left-0' },
              { value: '96%', label: 'Students who return', place: 'lg:bottom-2 lg:right-0' },
            ].map((card) => (
              <article key={card.label} className={`rounded-lg border border-[#E8E2ED] bg-white px-3 py-2.5 text-center shadow-[0_12px_24px_-18px_rgba(49,0,100,0.7)] lg:pointer-events-auto lg:absolute lg:w-[9.5rem] ${card.place}`}>
                <p className="font-display text-xl font-extrabold text-[#310064]">{card.value}</p>
                <p className="mt-0.5 text-[12px] font-semibold leading-4 text-[#51475B]">{card.label}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
