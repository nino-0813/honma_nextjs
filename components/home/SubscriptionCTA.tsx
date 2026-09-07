import Link from 'next/link';
import SectionHeading from './SectionHeading';
import FadeIn from '@/components/FadeIn';

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
    image: '/images/renewal/products/rice-lineup.webp',
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
    <section className="bg-[#f7f2df] py-24 text-primary md:py-36">
      <div className="mx-auto max-w-[1280px] px-6 md:px-12">
        <FadeIn>
          <SectionHeading en="Subscription" ja="イケベジ定期便" />
        </FadeIn>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-16">
          <h2 className="text-3xl font-serif font-semibold leading-[1.6] tracking-wide text-primary md:text-[38px] lg:text-[48px]">
            4700人でつくる里山の風景
          </h2>
          <div className="flex flex-col gap-4 text-sm leading-loose text-gray-600 md:text-base">
            <p>
              定期便は、割引の仕組みである前に、お客様とイケベジが一緒に歩んでいくための形です。
            </p>
            <p>
              毎月受け取っていただけることで、私たちは翌年どれだけの田んぼを動かせるかを計画できます。
              続けていただくことが、そのまま佐渡の田んぼを残すことにつながっています。
            </p>
          </div>
        </div>

        <ul className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {POINTS.map((p, i) => (
            <li key={p.head} className="flex flex-col gap-3">
              <FadeIn delay={Math.min(i, 3) * 70} className="flex h-full flex-col rounded-[24px] bg-white p-4 shadow-[0_14px_45px_rgba(48,62,45,0.07)]">
              <div className="aspect-[4/3] overflow-hidden rounded-[17px] bg-dim">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt="" aria-hidden="true" loading="lazy" className="w-full h-full object-cover" />
              </div>
              <span className="mt-4 w-fit rounded-full bg-yuunagi px-3 py-1 text-[10px] font-semibold tracking-wider text-white">POINT {i + 1}</span>
              <h3 className="mt-3 text-base font-semibold text-primary">{p.head}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-gray-600">{p.body}</p>
              </FadeIn>
            </li>
          ))}
        </ul>

        <div className="mt-14 text-center">
          <Link
            href="/collections/rice/yearly?view=lp"
            className="inline-flex min-h-14 items-center gap-3 rounded-full bg-hekishoku px-10 py-4 text-sm font-medium text-white transition-colors hover:bg-primary"
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
