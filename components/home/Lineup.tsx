import Link from 'next/link';
import SectionHeading from './SectionHeading';
import CircleButton from './CircleButton';
import PlaceholderBadge from './PlaceholderBadge';

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
  imageIsPlaceholder?: boolean;
}[] = [
  {
    en: 'Rice',
    ja: 'お米',
    href: '/collections/rice',
    image: '/images/home/parallax/sunset_riceplanting_7_1200.webp',
  },
  {
    en: 'Koshihikari',
    ja: 'コシヒカリ',
    href: '/collections/rice/koshihikari',
    image: '/images/home/collections/collection_koshihikari_1200.webp',
  },
  {
    en: 'Kamenoo',
    ja: '亀の尾',
    href: '/collections/rice/kamenoo',
    image: '/images/home/collections/collection_kamenoo_1200.webp',
  },
  {
    en: 'Shiitake',
    ja: '原木椎茸',
    href: '/collections/other',
    // 椎茸の写真が無いため流用中
    image: '/images/about/stories/P3A9707.webp',
    imageIsPlaceholder: true,
  },
  {
    en: 'Subscription',
    ja: 'イケベジ定期便',
    href: '/collections/rice/yearly?view=lp',
    image: '/images/about/stories/about_story_taue_123.webp',
  },
  {
    en: 'Others',
    ja: 'その他',
    href: '/collections/other',
    // その他カテゴリの代表写真が無いため流用中
    image: '/images/about/stories/IMG_8832.webp',
    imageIsPlaceholder: true,
  },
];

export default function Lineup() {
  return (
    <section className="pt-8 pb-20 md:pb-28 bg-white">
      <div className="max-w-[1500px] mx-auto px-5 md:px-10">
        <div className="flex items-end justify-between gap-6 mb-9 md:mb-12">
          <SectionHeading en="Lineup" ja="ラインナップ" />
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

      {/* 全面タイル（隙間なし） */}
      <ul className="grid grid-cols-2 lg:grid-cols-3">
        {TILES.map((t) => (
          <li key={t.ja}>
            {/* 上段3枚だけで画面の約8割。次の段が少し覗く高さ */}
              <Link href={t.href} className="group relative block aspect-[4/3] lg:aspect-auto lg:h-[74svh] overflow-hidden">
              {t.imageIsPlaceholder && <PlaceholderBadge />}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={t.image}
                alt={t.ja}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[900ms] group-hover:scale-105"
              />
              {/* 明るい写真でも白文字が読めるように、ベタ＋下方向のグラデーションを重ねる */}
              <span className="absolute inset-0 bg-black/40 transition-colors group-hover:bg-black/50" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/20" />
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-center px-4">
                <span className="text-white text-xl md:text-3xl lg:text-4xl font-sans font-bold tracking-wide drop-shadow">
                  {t.en}
                </span>
                <span className="text-white/90 text-xs md:text-sm tracking-[0.2em]">{t.ja}</span>
                <span className="mt-4 md:mt-6">
                  <CircleButton icon="arrow" variant="light" />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
