'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

function ScrollInner() {
  const params = useSearchParams();
  const section = params.get('section');

  useEffect(() => {
    if (!section) return;
    const node = document.getElementById(section);
    if (node) node.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [section]);

  return null;
}

export default function ScrollToSection() {
  return (
    <Suspense fallback={null}>
      <ScrollInner />
    </Suspense>
  );
}
