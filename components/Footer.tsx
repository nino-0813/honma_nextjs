'use client';

import React from 'react';
import Link from 'next/link';
import { IconInstagram, IconYoutube } from './Icons';

const Footer = () => {
  return (
    <footer className="bg-hekishoku-deep py-10 text-white md:py-12">
      <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/ikevege_wordmark_white.png" alt="イケベジ" width={196} height={34} className="h-7 w-auto" />
            <p className="mt-5 text-xs leading-loose tracking-[0.12em] text-white/70">
              佐渡の自然から学び、豊かさを分かち合う。
            </p>
          </div>
          <div className="flex flex-col gap-6 md:items-end">
            <ul className="flex flex-wrap gap-x-6 gap-y-3 text-[11px] tracking-[0.08em] text-white/65 md:justify-end">
              <li><Link href="/faq" className="hover:text-white transition-colors">よくあるご質問</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">お問い合わせ</Link></li>
              <li><Link href="/legal" className="hover:text-white transition-colors">特定商取引法</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">利用規約</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">プライバシーポリシー</Link></li>
            </ul>
            <div className="flex items-center gap-6">
              <a href="https://www.instagram.com/ikevege_official" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-white hover:text-white/60 transition-colors">
                <IconInstagram className="w-5 h-5" />
              </a>
              <a href="https://www.youtube.com/@ikevege" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-white hover:text-white/60 transition-colors">
                <IconYoutube className="w-5 h-5" />
              </a>
              <p className="text-[10px] tracking-widest text-white/40">
                &copy; {new Date().getFullYear()} IKEVEGE
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
