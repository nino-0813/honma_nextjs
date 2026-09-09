import Link from 'next/link';
import CircleButton from './CircleButton';
import FadeIn from '@/components/FadeIn';

/**
 * ラインナップ。
 * 商品カテゴリーが増えても折り返せる写真タイルに
 * 白抜きの見出しと丸ボタンを重ねる。
 *
 * 原木しいたけとCrescentmoonは現在の商品カテゴリへ誘導する。
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
    en: 'Crescentmoon',
    ja: 'クレセントムーン',
    href: '/collections/crescent',
    image: '/images/renewal/lineup/others.webp',
  },
];

export default function Lineup() {
  return (
    <section id="products" className="pt-8 pb-20 md:pb-28 bg-white">
      {/* 写真全体を押せるラインナップタイル */}
      <ul className="grid grid-cols-1 gap-px bg-white sm:grid-cols-2 lg:grid-cols-3">
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
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02] group-focus-visible:scale-[1.02] motion-reduce:transition-none"
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
      <div className="mt-10 text-center md:mt-14">
        <Link
          href="/collections"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-gray-300 px-6 py-3 text-xs text-primary transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 md:text-[13px]"
        >
          すべての商品を見る →
        </Link>
      </div>
    </section>
  );
}
