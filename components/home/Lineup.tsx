import Link from 'next/link';
import SectionHeading from './SectionHeading';
import PlaceholderBadge from './PlaceholderBadge';

/**
 * 商品ラインナップ（ベースフード構成の3番目）。
 * 要件どおり「米 / 原木椎茸 / その他」の3分類で入口を出す。
 *
 * 注意: 原木椎茸は現在DB上 category='その他' に入っているため、
 * ここでは検索キーワード付きのURLで暫定的に飛ばしている。
 * 管理画面でカテゴリを分けたら href を /collections/shiitake などに変更する。
 */
const CATEGORIES: { title: string; en: string; body: string; href: string; image: string; imageIsPlaceholder?: boolean }[] = [
  {
    title: 'お米',
    en: 'Rice',
    body: 'コシヒカリ・亀の尾・にこまる。農薬と化学肥料に頼らずに育てた自然栽培米。',
    href: '/collections/rice',
    image: '/images/home/collections/collection_koshihikari_800.webp',
  },
  {
    title: '原木椎茸',
    en: 'Shiitake',
    body: '佐渡の原木で育てた乾しいたけ。だしにも、そのままの一品にも。',
    href: '/collections/other',
    // 椎茸の写真が無いため米のバナーを流用中
    image: '/images/home/collections/4_800.webp',
    imageIsPlaceholder: true,
  },
  {
    title: 'その他',
    en: 'Others',
    body: '焼き菓子や季節のもの。佐渡の恵みからつくられた品々です。',
    href: '/collections/other',
    // その他カテゴリの代表写真が無いため流用中
    image: '/images/home/collections/2_800.webp',
    imageIsPlaceholder: true,
  },
];

export default function Lineup() {
  return (
    <section className="py-14 md:py-20 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="Lineup"
          title="ラインナップ"
          description="佐渡島で育てたものを、種類ごとにご覧いただけます。"
          align="center"
        />

        <ul className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {CATEGORIES.map((c) => (
            <li key={c.title}>
              <Link href={c.href} className="group block bg-white rounded-lg overflow-hidden h-full">
                <div className="relative aspect-[16/10] overflow-hidden bg-dim">
                  {c.imageIsPlaceholder && <PlaceholderBadge />}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.image}
                    alt={c.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-5 md:p-6">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-amber-700">{c.en}</p>
                  <h3 className="mt-1 text-base md:text-lg font-serif tracking-wider text-primary">{c.title}</h3>
                  <p className="mt-2 text-xs md:text-sm text-gray-600 leading-relaxed">{c.body}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-8 text-center">
          <Link
            href="/collections"
            className="inline-block px-8 py-3 rounded-full border border-primary text-sm tracking-wider text-primary hover:bg-primary hover:text-white transition-colors"
          >
            すべての商品を見る
          </Link>
        </div>
      </div>
    </section>
  );
}
