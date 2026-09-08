import Link from 'next/link';
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
  },
  {
    head: '出荷直前に精米',
    body: 'お届けに合わせて精米するので、いつも新鮮な状態で届きます。',
  },
  {
    head: 'スキップ・変更自由',
    body: 'お米が余りそうな月は、マイページからスキップできます。',
  },
  {
    head: '佐渡の田んぼが続く',
    body: '毎月受け取っていただくことで、私たちは翌年の田んぼを計画できます。',
  },
];

export default function SubscriptionCTA() {
  return (
    <section className="bg-white py-20 text-primary md:py-32">
      <div className="max-w-[1500px] mx-auto px-5 md:px-10">
        <FadeIn>
          <p className="text-sm font-medium tracking-[0.16em] text-primary">イケベジ定期便</p>
        </FadeIn>

        <div className="mt-6 grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-end lg:gap-20">
          <div>
            <h2 className="font-serif text-3xl font-semibold leading-[1.55] tracking-wide text-primary md:text-[44px]">
              4700人でつくる<br />里山の風景
            </h2>
            <div className="mt-8 flex flex-col gap-5 text-sm leading-loose text-gray-600 md:text-base">
              <p>定期便は、割引の仕組みである前に、お客様とイケベジが一緒に歩んでいくための形です。</p>
              <p>続けていただくことが、そのまま佐渡の田んぼを残すことにつながっています。</p>
            </div>
          </div>
          <div className="aspect-[16/9] overflow-hidden bg-dim">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/about/stories/P3A9707.webp" alt="佐渡の田んぼと里山の風景" loading="lazy" className="h-full w-full object-cover" />
          </div>
        </div>

        <ul className="mt-12 grid grid-cols-1 border-y border-gray-200 sm:grid-cols-2 lg:grid-cols-4">
          {POINTS.map((p, i) => (
            <li key={p.head} className="border-b border-gray-200 py-7 sm:px-6 lg:border-b-0 lg:border-l lg:first:border-l-0">
              <FadeIn delay={Math.min(i, 3) * 70} className="flex flex-col gap-3">
              <h3 className="text-base font-medium text-primary">{p.head}</h3>
              <p className="text-[13px] leading-relaxed text-gray-600">{p.body}</p>
              </FadeIn>
            </li>
          ))}
        </ul>

        <div className="mt-12 text-center">
          <Link
            href="/collections/rice/yearly?view=lp"
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-yuunagi px-10 py-4 text-sm font-medium text-white transition-colors hover:bg-yuunagi-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yuunagi focus-visible:ring-offset-2"
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
