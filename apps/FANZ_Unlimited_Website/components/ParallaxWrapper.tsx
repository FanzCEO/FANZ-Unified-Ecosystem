'use client';

import { useEffect, useRef, ReactNode } from 'react';

interface ParallaxWrapperProps {
  children: ReactNode;
  speed?: number; // 0-1, where 0.5 is normal, < 0.5 is slower, > 0.5 is faster
  className?: string;
}

export default function ParallaxWrapper({ children, speed = 0.5, className = '' }: ParallaxWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleScroll = () => {
      const scrolled = window.scrollY;
      const rect = element.getBoundingClientRect();
      const elementTop = rect.top + scrolled;
      const elementHeight = rect.height;
      const windowHeight = window.innerHeight;

      // Calculate if element is in viewport
      if (scrolled + windowHeight > elementTop && scrolled < elementTop + elementHeight) {
        const relativeScroll = (scrolled - elementTop + windowHeight) / (windowHeight + elementHeight);
        const offset = (relativeScroll - 0.5) * 100 * (speed - 0.5);

        element.style.transform = `translateY(${offset}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial position

    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return (
    <div ref={ref} className={`transition-transform duration-100 ${className}`}>
      {children}
    </div>
  );
}
