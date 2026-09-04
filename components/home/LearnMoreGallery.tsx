'use client';

import { useState } from 'react';
import Link from 'next/link';
import FadeIn from '@/components/FadeIn';

export type GalleryItem = {
  title: string;
  body: string;
  image: string;
  href: string;
  label: string;
};

export default function LearnMoreGallery({ items }: { items: GalleryItem[] }) {
  const [expanded, setExpanded] = useState(false);

  const visibilityClass = (index: number) => {
    if (expanded) return '';
    if (index >= 8) return 'hidden';
    if (index >= 5) return 'hidden md:block';
    return '';
  };

  const showMore = () => setExpanded(true);

  return (
    <>
      <ul className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
        {items.map((item, index) => (
          <li key={`${item.label}-${item.title}`} className={visibilityClass(index)}>
            <FadeIn delay={Math.min(index, 3) * 70}>
              <Link
                href={item.href}
                className="group relative block aspect-[4/3] overflow-hidden bg-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hekishoku focus-visible:ring-offset-2"
                aria-label={`${item.title}：${item.body}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt={item.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 ease-out motion-reduce:transition-none group-hover:scale-[1.04] group-focus-visible:scale-[1.04]"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent md:opacity-0 transition-opacity duration-300 motion-reduce:transition-none group-hover:opacity-100 group-focus-visible:opacity-100" />
                <span className="absolute inset-x-0 bottom-0 flex flex-col justify-end p-5 md:p-6 text-white md:translate-y-3 md:opacity-0 transition-all duration-300 ease-out motion-reduce:transition-none group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                  <span className="text-[11px] font-medium tracking-[0.14em] text-white/80">{item.label}</span>
                  <span className="mt-1.5 text-lg md:text-xl font-medium leading-snug">{item.title}</span>
                  <span className="mt-2 text-sm leading-relaxed text-white/90 line-clamp-2">{item.body}</span>
                  <span className="mt-4 inline-flex items-center gap-2 text-xs font-medium">
                    詳しく見る
                    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                      <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </span>
              </Link>
            </FadeIn>
          </li>
        ))}
      </ul>

      {!expanded && items.length > 5 && (
        <div className="mt-10 text-center md:hidden">
          <MoreButton onClick={showMore} />
        </div>
      )}
      {!expanded && items.length > 8 && (
        <div className="mt-12 hidden text-center md:block">
          <MoreButton onClick={showMore} />
        </div>
      )}
    </>
  );
}

function MoreButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-11 items-center gap-3 rounded-full border border-gray-400 px-8 py-3 text-sm text-primary transition-colors hover:border-hekishoku hover:text-hekishoku focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hekishoku focus-visible:ring-offset-2"
      aria-label="残りのコンテンツを表示する"
    >
      もっと見る
      <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <path d="m4.5 6 3.5 3.5L11.5 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
