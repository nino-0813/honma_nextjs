'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setVisible(window.scrollY > 500);
    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    return () => window.removeEventListener('scroll', updateVisibility);
  }, []);

  return (
    <button
      type="button"
      aria-label="ページの先頭へ戻る"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`fixed bottom-4 right-3 z-40 w-14 origin-bottom transition-all duration-300 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-hekishoku focus-visible:ring-offset-4 md:bottom-6 md:right-6 md:w-[78px] ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-5 opacity-0'
      }`}
    >
      <Image
        src="/images/renewal/page-top-toki.webp"
        alt=""
        width={867}
        height={1815}
        sizes="(min-width: 768px) 78px, 56px"
        className="h-auto w-full drop-shadow-[0_8px_12px_rgba(0,0,0,0.12)]"
      />
    </button>
  );
}
