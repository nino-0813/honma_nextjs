'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 商品画像。ベースフードの商品ページと同じ構成。
 *   左: 縦のサムネイル列
 *   右: 大きい画像を横に並べたストリップ（矢印 + 進捗バー付き）
 *
 * サムネイルを押すと、その画像までストリップがスクロールする。
 * 左カラムは sticky で固定されるため、全体が画面に収まる高さに抑えている。
 */
export default function ProductGallery({
  images,
  alt,
  soldOut = false,
}: {
  images: string[];
  alt: string;
  soldOut?: boolean;
}) {
  const stripRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const update = useCallback(() => {
    const el = stripRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setProgress(max > 0 ? el.scrollLeft / max : 0);
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(max > 0 && el.scrollLeft >= max - 1);
    // いちばん左に見えている画像を現在位置とする
    const items = Array.from(el.children) as HTMLElement[];
    const idx = items.findIndex((li) => li.offsetLeft + li.offsetWidth > el.scrollLeft + 8);
    if (idx >= 0) setActive(idx);
  }, []);

  useEffect(() => {
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [update]);

  const scrollToIndex = (i: number) => {
    const el = stripRef.current;
    const item = el?.children[i] as HTMLElement | undefined;
    if (!el || !item) return;
    el.scrollTo({ left: item.offsetLeft, behavior: 'smooth' });
  };

  const step = (dir: 1 | -1) => scrollToIndex(Math.min(images.length - 1, Math.max(0, active + dir)));

  if (images.length === 0) return null;

  return (
    <div className="w-full flex flex-col-reverse lg:flex-row gap-4 lg:gap-5 items-start">
      {/* サムネイル列 */}
      {images.length > 1 && (
        <div className="w-full lg:w-20 flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-y-auto scrollbar-hide lg:max-h-[58vh] shrink-0">
          {images.map((img, i) => (
            <button
              key={img + i}
              type="button"
              onClick={() => scrollToIndex(i)}
              aria-label={`画像${i + 1}を表示`}
              className={`relative aspect-square w-16 lg:w-full shrink-0 overflow-hidden border transition-all duration-300 ${
                active === i ? 'border-hekishoku opacity-100' : 'border-transparent opacity-55 hover:opacity-100'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="" aria-hidden="true" loading="lazy" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* 大きい画像のストリップ */}
      <div className="flex-1 w-full min-w-0 flex flex-col gap-4">
        <div className="relative">
          <ul
            ref={stripRef}
            onScroll={update}
            className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
          >
            {images.map((img, i) => (
              <li
                key={img + i}
                className="snap-start shrink-0 w-[86%] lg:w-[72%] aspect-square lg:aspect-auto lg:h-[58vh] bg-dim overflow-hidden"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt={i === 0 ? alt : ''}
                  aria-hidden={i !== 0}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  className="w-full h-full object-cover"
                />
              </li>
            ))}
          </ul>
          {soldOut && (
            <span className="absolute top-4 left-4 bg-primary text-white px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase z-10">
              Sold Out
            </span>
          )}
        </div>

        {/* 矢印 + 進捗バー */}
        {images.length > 1 && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button" onClick={() => step(-1)} disabled={atStart} aria-label="前の画像"
                className="w-9 h-9 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center transition-colors hover:border-primary hover:text-primary disabled:opacity-30"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <button
                type="button" onClick={() => step(1)} disabled={atEnd} aria-label="次の画像"
                className="w-9 h-9 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center transition-colors hover:border-primary hover:text-primary disabled:opacity-30"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
            <div className="relative flex-1 max-w-[240px] h-px bg-gray-200" aria-hidden="true">
              <div className="absolute inset-y-0 left-0 bg-primary transition-[width] duration-200 ease-out-expo" style={{ width: `${Math.max(12, progress * 100)}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
