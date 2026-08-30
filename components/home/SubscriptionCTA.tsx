import Link from 'next/link';
import SectionHeading from './SectionHeading';

/**
 * 定期便（ベースフードの「継続コース」に相当）。
 * 左に大きな宣言 / 右に本文、その下に4つの利点、最後に中央のCTA。
 *
 * 要件どおり、社会的意義と経済メリットの両方でクロージングする。
 */
const POINTS = [
  {
    head: 'いつでも10%OFF',
    body: '続けやすい価格でお届けします。買い忘れもありません。',
    image: '/images/home/collections/collection_koshihikari_800.webp',
  },
  {
    head: '出荷直前に精米',
    body: 'お届けに合わせて精米するので、いつも新鮮な状態で届きます。',
    image: '/images/rice-keep-bag.jpg',
  },
  {
    head: 'スキップ・変更自由',
    body: 'お米が余りそうな月は、マイページからスキップできます。',
    image: '/images/usage-scene.jpg',
  },
  {
    head: '佐渡の田んぼが続く',
    body: '毎月受け取っていただくことで、私たちは翌年の田んぼを計画できます。',
    image: '/images/about/stories/about_story_taue_123.webp',
  },
];

export default function SubscriptionCTA() {
  return (
    <section className="py-20 md:py-32 bg-white">
      <div className="max-w-[1500px] mx-auto px-5 md:px-10">
        <SectionHeading ja="イケベジ定期便" />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-16">
          <h2 className="text-3xl md:text-[46px] lg:text-[54px] font-serif leading-[1.6] tracking-wide text-primary">
            買い続けることが、
            <br />
            集落を続けることになる。
          </h2>
          <div className="flex flex-col gap-4 text-[13px] md:text-sm text-gray-600 leading-loose">
            <p>
              定期便は、割引の仕組みである前に、お客様とイケベジが一緒に歩んでいくための形です。
            </p>
            <p>
              毎月受け取っていただけることで、私たちは翌年どれだけの田んぼを動かせるかを計画できます。
              続けていただくことが、そのまま佐渡の田んぼを残すことにつながっています。
            </p>
          </div>
        </div>

        <ul className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {POINTS.map((p) => (
            <li key={p.head} className="flex flex-col gap-3">
              <div className="aspect-[4/3] overflow-hidden bg-dim">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt="" aria-hidden="true" loading="lazy" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-sm md:text-[15px] font-medium text-primary">{p.head}</h3>
              <p className="text-[12px] text-gray-600 leading-relaxed">{p.body}</p>
            </li>
          ))}
        </ul>

        <div className="mt-12 text-center">
          <Link
            href="/collections/rice/yearly?view=lp"
            className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-10 py-4 text-sm font-medium text-white hover:bg-amber-600 transition-colors"
          >
            定期便をはじめる
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
