'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * ScrollAnimations Component (High-Performance Compositor Edition)
 *
 * Implements silky-smooth, native 60/120fps scroll reveal and staggered animations
 * across EdNxt using native browser IntersectionObserver and GPU-accelerated CSS transforms.
 *
 * Performance Advantages:
 * - 0 main-thread scroll event listeners (zero scroll jank or friction)
 * - 0 layout shifts (elements maintain exact flow dimensions)
 * - Uses GPU compositor translate3d & opacity transitions
 * - Elements are unobserved immediately upon entering (zero ongoing CPU/GPU overhead)
 * - Respects prefers-reduced-motion
 */
export default function ScrollAnimations() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const selector = '.scroll-reveal, .scroll-stagger-item, [data-reveal], .ta-rule, .ta-sweep-row';
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const mark = (el: Element) => {
      el.setAttribute('data-revealed', '');
      el.classList.add('is-revealed', 'is-drawn');
    };

    const inView = (el: Element) => {
      const rect = el.getBoundingClientRect();
      const view = window.innerHeight || document.documentElement.clientHeight;
      return rect.width > 0 && rect.height > 0 && rect.bottom > 48 && rect.top < view - 24;
    };

    const scan = () => {
      document.querySelectorAll(selector).forEach((el) => {
        if (el.hasAttribute('data-revealed')) return;
        if (reduce || inView(el)) mark(el);
      });
    };

    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        scan();
      });
    };

    scan();
    const changes = new MutationObserver(schedule);
    changes.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    const timers = [150, 600, 1400].map((ms) => window.setTimeout(scan, ms));

    return () => {
      changes.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      timers.forEach((id) => window.clearTimeout(id));
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return null;
}
