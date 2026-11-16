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

    // Respect user's accessibility motion settings
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      document.querySelectorAll('.scroll-reveal, .scroll-stagger-item, [data-reveal], .ta-rule, .ta-sweep-row').forEach((el) => {
        el.classList.add('is-revealed', 'is-drawn');
      });
      return;
    }

    // Set up high-performance IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed', 'is-drawn');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: '0px 0px -8% 0px', // triggers just as element approaches visible area
        threshold: 0.05,
      }
    );

    document.querySelectorAll<HTMLElement>('.scroll-reveal, [data-reveal], .ta-rule, .ta-sweep-row').forEach((element) => {
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
