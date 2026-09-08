'use client';

import React from 'react';
import Link from 'next/link';
import { IconInstagram, IconYoutube } from './Icons';

const Footer = () => {
  return (
    <footer className="border-t border-gray-100 bg-white py-7 text-primary md:py-8">
      <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <ul className="flex flex-wrap gap-x-5 gap-y-3 text-[11px] tracking-[0.05em] text-gray-500">
              <li><Link href="/faq" className="transition-colors hover:text-primary">よくあるご質問</Link></li>
              <li><Link href="/contact" className="transition-colors hover:text-primary">お問い合わせ</Link></li>
              <li><Link href="/legal" className="transition-colors hover:text-primary">特定商取引法</Link></li>
              <li><Link href="/terms" className="transition-colors hover:text-primary">利用規約</Link></li>
              <li><Link href="/privacy" className="transition-colors hover:text-primary">プライバシーポリシー</Link></li>
          </ul>
          <div className="flex items-center gap-5">
              <p className="text-[10px] tracking-widest text-gray-400">
                &copy; {new Date().getFullYear()} IKEVEGE
              </p>
              <a href="https://www.youtube.com/@ikevege" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-gray-500 transition-colors hover:text-primary"><IconYoutube className="h-5 w-5" /></a>
              <a href="https://www.instagram.com/ikevege_official" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-gray-500 transition-colors hover:text-primary"><IconInstagram className="h-5 w-5" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
