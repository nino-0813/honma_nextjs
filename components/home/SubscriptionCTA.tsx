import Link from 'next/link';

/**
 * 定期便の訴求（ベースフード構成の「継続コース」に相当、要件の6番目）。
 * 社会的意義（集落を賄うビジョン）と経済メリットの両立でクロージングする。
 */
const POINTS = [
  { head: 'いつでも10%OFF', body: '続けやすい価格で、毎月お届けします。' },
  { head: '出荷直前に精米', body: 'お届けに合わせて精米するので、いつも新鮮な状態で。' },
  { head: 'スキップ・変更自由', body: 'お米が余りそうな月は、マイページからスキップできます。' },
];

export default function SubscriptionCTA() {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      {/* 背景 */}
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/home/parallax/sunset_riceplanting_7_1200.webp"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/55" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
        <p className="text-[11px] tracking-[0.22em] uppercase text-white/70">Subscription</p>
        <h2 className="mt-3 text-xl md:text-3xl font-serif tracking-[0.1em] leading-relaxed">
          お米を買い続けることが、
          <br />
          集落を続けることにつながる。
        </h2>
        <p className="mt-6 text-xs md:text-sm leading-loose text-white/80 max-w-2xl mx-auto">
          定期便は、割引の仕組みである前に、お客様とイケベジが一緒に歩んでいくための形です。
          毎月受け取っていただくことで、私たちは翌年の田んぼを計画できます。
        </p>

        <ul className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-left">
          {POINTS.map((p) => (
            <li key={p.head} className="border-t border-white/30 pt-4">
              <h3 className="text-sm font-medium tracking-wider">{p.head}</h3>
              <p className="mt-2 text-xs text-white/75 leading-relaxed">{p.body}</p>
            </li>
          ))}
        </ul>

        <Link
          href="/collections/rice/yearly?view=lp"
          className="mt-10 inline-block px-10 py-3.5 rounded-full bg-white text-primary text-sm font-medium tracking-wider hover:opacity-90 transition-opacity"
        >
          定期便について見る
        </Link>
      </div>
    </section>
  );
}
