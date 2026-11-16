import React from 'react';

const items = [
  {
    q: 'What is one-to-one learning?',
    a: 'One student works with one tutor. The explanation, examples and practice are arranged around that student’s goals, rather than a shared classroom pace.',
  },
  {
    q: 'How do I book a consultation?',
    a: 'Use the consultation form on this page. Add your name, contact details, the student’s grade, a subject and a preferred date. The request is saved for the TutorAstra team to confirm.',
  },
  {
    q: 'Which subjects are available?',
    a: 'You can enquire about Mathematics, Physics, Chemistry, Biology, Science, English, Computer Science, Commerce and other subjects. Whether a tutor can be arranged is confirmed in the consultation. We do not list boards, fees or certificates until they are agreed.',
  },
  {
    q: 'Can I choose my class schedule?',
    a: 'Yes. Preferred days and times are part of the conversation after consultation, so lessons can sit around school and family commitments.',
  },
  {
    q: 'How can I access my student dashboard?',
    a: 'Use Login in the header or footer. It opens the existing TutorAstra sign-in, which routes administrators and teachers to the dashboard and students to the student view.',
  },
  {
    q: 'How does the AI Tutor work?',
    a: 'Ms. Violet is a preview of a future assessment companion. The planned experience accepts a PDF or a clear image of up to three pages, then offers multiple-choice and written questions, a timer, and an instant result. In this demo the screen is visual only: files stay in your browser and answers are not graded or emailed.',
  },
];

export default function FaqSection() {
  return (
    <section id="questions" data-header-tone="light" className="bg-white py-20 sm:py-24" aria-labelledby="faq-heading">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6527B8]">Questions</p>
        <h2 id="faq-heading" className="ta-rule font-display mt-3 text-4xl font-semibold text-[#310064] sm:text-5xl">
          Frequently asked questions
        </h2>
        <div className="mt-8 divide-y divide-[#E9E1F1] border-y border-[#E9E1F1]" data-scroll-stagger>
          {items.map((item) => (
            <details key={item.q} className="group py-4">
              <summary className="cursor-pointer list-none text-base font-semibold text-[#310064] outline-none marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-4">
                  {item.q}
                  <span className="text-[#6527B8] transition group-open:rotate-45" aria-hidden="true">+</span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-[#746B80]">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
