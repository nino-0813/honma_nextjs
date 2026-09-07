'use client';

import React from 'react';
import Link from 'next/link';
import { IconInstagram, IconYoutube } from './Icons';

const Footer = () => {
  return (
    <footer className="relative overflow-hidden bg-[#f7f2df] pb-8 pt-20 text-primary md:pt-28">
      <div aria-hidden="true" className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-yuunagi/15 md:h-64 md:w-64" />
      <div className="relative mx-auto max-w-7xl px-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-12 md:flex-row md:items-end md:justify-between">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/ikevege_wordmark_dark.png" alt="イケベジ" width={196} height={34} className="h-8 w-auto" />
            <p className="mt-6 text-xs leading-loose tracking-[0.12em] text-gray-600">
              佐渡の自然から学び、豊かさを分かち合う。
            </p>
          </div>
          <div className="flex flex-col gap-6 md:items-end">
            <ul className="flex flex-wrap gap-x-6 gap-y-3 text-[11px] tracking-[0.08em] text-gray-600 md:justify-end">
              <li><Link href="/faq" className="transition-colors hover:text-hekishoku">よくあるご質問</Link></li>
              <li><Link href="/contact" className="transition-colors hover:text-hekishoku">お問い合わせ</Link></li>
              <li><Link href="/legal" className="transition-colors hover:text-hekishoku">特定商取引法</Link></li>
              <li><Link href="/terms" className="transition-colors hover:text-hekishoku">利用規約</Link></li>
              <li><Link href="/privacy" className="transition-colors hover:text-hekishoku">プライバシーポリシー</Link></li>
            </ul>
            <div className="flex items-center gap-6">
              <a href="https://www.instagram.com/ikevege_official" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="transition-colors hover:text-hekishoku">
                <IconInstagram className="w-5 h-5" />
              </a>
              <a href="https://www.youtube.com/@ikevege" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="transition-colors hover:text-hekishoku">
                <IconYoutube className="w-5 h-5" />
              </a>
              <p className="text-[10px] tracking-widest text-gray-400">
                &copy; {new Date().getFullYear()} IKEVEGE
              </p>
            </div>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="mt-16 h-5 w-full bg-hekishoku md:mt-20" />
    </footer>
  );
};

export default Footer;
