'use client';

import React from 'react';
import Link from 'next/link';
import { IconInstagram, IconYoutube } from './Icons';

const Footer = () => {
  return (
    <footer id="site-footer" className="border-t border-gray-100 bg-white pb-4 pt-12 text-primary md:py-8">
      <div className="mx-auto max-w-[1760px] px-5 md:px-8 lg:px-12">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-x-6 md:flex md:items-center md:justify-between md:gap-6">
          <ul className="mobile-footer-links flex flex-col items-start gap-1.5 whitespace-nowrap text-gray-500 md:w-auto md:flex-row md:items-center md:gap-x-5 md:text-sm">
              <li><Link href="/legal" className="transition-colors hover:text-primary">特定商取引法</Link></li>
              <li><Link href="/terms" className="transition-colors hover:text-primary">利用規約</Link></li>
              <li><Link href="/privacy" className="transition-colors hover:text-primary">プライバシーポリシー</Link></li>
          </ul>
          <div className="flex self-end flex-col items-end gap-3 md:w-auto md:self-auto md:flex-row md:items-center md:gap-5">
              <p className="mobile-footer-meta order-2 text-gray-400 md:order-1 md:text-xs">
                &copy; {new Date().getFullYear()} IKEVEGE
              </p>
              <div className="order-1 flex items-center gap-5 md:order-2">
                <a href="https://www.youtube.com/@ikevege" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-gray-500 transition-colors hover:text-primary"><IconYoutube className="h-5 w-5" /></a>
                <a href="https://www.instagram.com/ikevege_official" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-gray-500 transition-colors hover:text-primary"><IconInstagram className="h-5 w-5" /></a>
              </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
