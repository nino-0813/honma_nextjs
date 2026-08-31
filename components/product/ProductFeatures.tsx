'use client';

import { useState } from 'react';
import FadeIn from '@/components/FadeIn';

/**
 * 商品詳細のアコーディオン（ベースフードの「Features / 商品詳細」に相当）。
 * 左に見出し、右に開閉する項目を並べる。
 */
export default function ProductFeatures({
  rows,
}: {
  rows: { label: string; sub?: string; body: string }[];
}) {
  const [open, setOpen] = useState<string | null>(rows[0]?.label ?? null);
  if (rows.length === 0) return null;

  return (
    <section className="mt-24 md:mt-32 border-t border-gray-100 pt-16 md:pt-20">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 lg:gap-16">
        <FadeIn>
          <p className="text-[32px] md:text-[46px] font-sans font-bold tracking-tight text-yuunagi leading-none">
            Features
          </p>
          <p className="mt-1.5 text-sm md:text-base font-medium text-primary">
            商品詳細
          </p>
        </FadeIn>

        <ul className="border-t border-gray-200">
          {rows.map((r) => {
            const isOpen = open === r.label;
            return (
              <li key={r.label} className="border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : r.label)}
                  aria-expanded={isOpen}
                  className="w-full flex items-start justify-between gap-4 py-5 md:py-6 text-left"
                >
                  <span>
                    <span className="block text-sm md:text-base font-medium text-primary">{r.label}</span>
                    {r.sub && <span className="mt-1 block text-[11px] text-gray-400">{r.sub}</span>}
                  </span>
                  <svg
                    className={`shrink-0 mt-1 w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"
                  >
                    <path d="M3 6l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <div className={`accordion-body ${isOpen ? 'is-open' : ''}`}>
                  <div>
                    <div className="pb-6 text-[13px] md:text-sm leading-loose text-gray-600 whitespace-pre-wrap">
                      {r.body}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
