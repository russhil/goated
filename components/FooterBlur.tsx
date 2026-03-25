'use client';

import { useEffect, useRef } from 'react';

export default function FooterBlur() {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const handleScroll = () => {
      const scrolled = window.scrollY;
      const total =
        document.documentElement.scrollHeight - window.innerHeight;
      const distFromBottom = total - scrolled;

      // Start appearing 400px from bottom
      // Fully visible at 100px from bottom
      const opacity = Math.max(0, Math.min(1, 1 - distFromBottom / 400));
      overlay.style.opacity = String(opacity);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '220px',
        pointerEvents: 'none',
        zIndex: 40,
        opacity: 0,
        transition: 'opacity 0.4s ease',
        backdropFilter: 'blur(16px) saturate(160%)',
        WebkitBackdropFilter: 'blur(16px) saturate(160%)',
        background:
          'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.95) 100%)',
        maskImage:
          'linear-gradient(to bottom, transparent 0%, black 35%, black 100%)',
        WebkitMaskImage:
          'linear-gradient(to bottom, transparent 0%, black 35%, black 100%)',
      }}
    />
  );
}
