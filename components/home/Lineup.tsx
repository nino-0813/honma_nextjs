import Link from 'next/link';
import SectionHeading from './SectionHeading';
import CircleButton from './CircleButton';
import FadeIn from '@/components/FadeIn';

/**
 * ラインナップ。
 * ベースフードと同じく、隙間なく並べた大判の写真タイルに
 * 白抜きの見出しと丸ボタンを重ねる。
 *
 * 注意: 原木椎茸は現在DB上 category='その他' のため、リンク先は暫定。
 * 管理画面でカテゴリを分けたら href を差し替える。
 */
const TILES: {
  en: string;
  ja: string;
  href: string;
  image: string;
}[] = [
  {
    en: 'Rice',
    ja: 'お米',
    href: '/collections/rice',
    image: '/images/renewal/lineup/rice.webp',
  },
  {
    en: 'Shiitake',
    ja: '原木椎茸',
    href: '/collections/other',
    image: '/images/renewal/lineup/shiitake.webp',
  },
  {
    en: 'Others',
    ja: 'その他',
    href: '/collections/other',
    image: '/images/renewal/lineup/others.webp',
  },
];

export default function Lineup() {
  return (
    <section id="products" className="pt-8 pb-20 md:pb-28 bg-white">
      <div className="max-w-[1500px] mx-auto px-5 md:px-10">
        <div className="flex items-end justify-between gap-6 mb-9 md:mb-12">
          <FadeIn>
            <SectionHeading en="Lineup" ja="ラインナップ" />
          </FadeIn>
          <Link
            href="/collections"
            className="shrink-0 inline-flex items-center gap-2 rounded-full border border-gray-300 px-5 py-2.5 text-xs md:text-[13px] text-primary hover:border-primary transition-colors"
          >
            すべての商品を見る
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
              <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>

      {/* 写真全体を押せるラインナップタイル */}
      <ul className="grid grid-cols-1 gap-px bg-white md:grid-cols-3">
        {TILES.map((t, i) => (
          <li key={t.ja}>
            <FadeIn delay={Math.min(i % 3, 2) * 80}>
              <Link
                href={t.href}
                aria-label={`${t.ja}の商品を見る`}
                className="group block focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-white"
              >
              <span className="relative block aspect-[16/10] md:aspect-auto md:h-[62svh] lg:h-[74svh] overflow-hidden bg-dim">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.image}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 group-focus-visible:scale-105 motion-reduce:transition-none"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-black/10 transition-colors duration-300 group-hover:from-black/70 group-hover:via-black/30" />
                <span className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center text-white">
                  <span className="text-2xl font-bold tracking-wide drop-shadow-sm md:text-[26px] lg:text-[30px]">
                    {t.en}
                  </span>
                  <span className="mt-2 text-xs font-medium tracking-[0.2em] drop-shadow-sm md:text-sm">{t.ja}</span>
                  <span className="mt-6 transition-transform duration-300 group-hover:translate-x-1 group-focus-visible:translate-x-1 motion-reduce:transition-none">
                    <CircleButton icon="arrow" variant="light" />
                  </span>
                </span>
              </span>
              </Link>
            </FadeIn>
          </li>
        ))}
      </ul>
    </section>
  );
}
