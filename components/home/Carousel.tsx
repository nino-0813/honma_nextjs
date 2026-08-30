'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 横スクロールのカルーセル。ベースフードと同じく
 * 「左右の丸ボタン + 進捗バー」を下に置く。
 *
 * スクロール自体はネイティブの overflow-x に任せ、
 * ボタンは1カード分ずつスクロールさせるだけにしている。
 */
export default function Carousel({
  children,
  ariaLabel,
}: {
  children: React.ReactNode;
  ariaLabel: string;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [progress, setProgress] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setProgress(max > 0 ? el.scrollLeft / max : 0);
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(max > 0 && el.scrollLeft >= max - 1);
  }, []);

  useEffect(() => {
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [update]);

  const step = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector('li');
    const amount = card ? card.getBoundingClientRect().width + 24 : el.clientWidth * 0.8;
    el.scrollBy({ left: amount * dir, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col gap-6">
      <ul
        ref={trackRef}
        onScroll={update}
        aria-label={ariaLabel}
        className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1"
      >
        {children}
      </ul>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={atStart}
            aria-label="前へ"
            className="w-9 h-9 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center transition-colors hover:border-primary hover:text-primary disabled:opacity-30 disabled:hover:border-gray-300 disabled:hover:text-gray-600"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            disabled={atEnd}
            aria-label="次へ"
            className="w-9 h-9 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center transition-colors hover:border-primary hover:text-primary disabled:opacity-30 disabled:hover:border-gray-300 disabled:hover:text-gray-600"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* 進捗バー */}
        <div className="relative flex-1 max-w-[220px] h-px bg-gray-200" aria-hidden="true">
          <div
            className="absolute inset-y-0 left-0 bg-primary transition-[width] duration-200"
            style={{ width: `${Math.max(12, progress * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
