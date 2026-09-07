'use client';

import Link from 'next/link';
import { IconInstagram, IconYoutube } from './Icons';

const FOOTER_LINKS = [
  { label: '商品一覧', href: '/collections' },
  { label: '定期便', href: '/collections/rice/yearly?view=lp' },
  { label: 'よくあるご質問', href: '/faq' },
  { label: 'お問い合わせ', href: '/contact' },
  { label: '利用規約', href: '/terms' },
  { label: 'プライバシーポリシー', href: '/privacy' },
  { label: '特定商取引法に基づく表記', href: '/legal' },
];

const TOKI_ROW = [
  'thanks', 'flying', 'hello', 'fly-fast', 'thanks', 'hello',
  'flying', 'fly-fast', 'hello', 'thanks', 'fly-fast', 'flying',
];

const Footer = () => {
  return (
    <footer className="overflow-hidden bg-white pt-20 text-primary md:pt-24">
      <div className="mx-auto grid max-w-[1320px] gap-12 px-6 md:grid-cols-[1.1fr_0.9fr_1fr] md:px-12">
        <div>
          <p className="mb-8 text-[9px] tracking-[0.2em] text-gray-400">
            COPYRIGHT © IKEVEGE. ALL RIGHTS RESERVED.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/ikevege_wordmark_dark.png" alt="イケベジ" width={196} height={34} className="h-8 w-auto md:h-10" />
        </div>

        <address className="not-italic text-xs leading-[2] tracking-[0.1em] text-gray-600 md:pt-10">
          <p>〒952-0317</p>
          <p>新潟県佐渡市豊田560</p>
          <p className="mt-3">Tel. 050-3634-5251</p>
          <p>info@ikevege.com</p>
        </address>

        <div className="md:pt-8">
          <nav aria-label="フッターナビゲーション">
            <ul className="grid grid-cols-2 gap-x-7 gap-y-3 text-[11px] tracking-[0.06em] text-gray-600">
              {FOOTER_LINKS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="group inline-flex items-center gap-2 transition-colors hover:text-hekishoku">
                    <span className="text-yuunagi transition-transform group-hover:translate-x-0.5" aria-hidden="true">→</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-7 flex items-center gap-5">
            <a href="https://www.instagram.com/ikevege_official" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="transition-colors hover:text-hekishoku">
              <IconInstagram className="h-5 w-5" />
            </a>
            <a href="https://www.youtube.com/@ikevege" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="transition-colors hover:text-hekishoku">
              <IconYoutube className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>

      <div aria-hidden="true" className="mt-14 flex h-24 items-end justify-around overflow-hidden px-1 md:mt-20 md:h-32">
        {TOKI_ROW.map((character, index) => (
          <span
            key={`${character}-${index}`}
            className="relative -mb-5 block h-20 w-20 shrink-0 overflow-hidden rounded-full bg-white md:-mb-7 md:h-28 md:w-28"
            style={{ transform: `rotate(${index % 2 === 0 ? -6 : 7}deg) translateY(${index % 3 === 0 ? 8 : 0}px)` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/images/renewal/toki-characters/${character}.webp`}
              alt=""
              className="h-full w-full object-contain"
            />
          </span>
        ))}
      </div>
    </footer>
  );
};

export default Footer;
