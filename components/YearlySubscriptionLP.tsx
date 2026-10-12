'use client';

import Image from 'next/image';
import Link from 'next/link';

const REASONS = [
  { title: 'いつでも10%OFF', description: '通常価格よりいつでも10%OFFでお届けします。' },
  { title: '瑞々しいお米を一年中', description: '専用の保冷庫で管理し、発送直前に精米します。' },
  { title: '保存袋はご希望の方へ', description: 'お申し込み時に「希望する」を選ぶと、お米保存袋をお届けします。' },
];

export default function YearlySubscriptionLP() {
  return (
    <section className="mb-12 md:mb-20">
      <div className="flex min-h-[58svh] items-center justify-center px-4 py-16 md:min-h-[64svh]">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-medium tracking-[0.16em] text-primary md:text-sm">イケベジ定期便</p>
          <h1 className="mt-5 font-serif text-3xl font-semibold leading-[1.5] tracking-wide text-primary md:text-[44px]">
            4700人とつくるイケベジ定期便
          </h1>
          <div className="mt-8 space-y-8 text-sm leading-[2] text-gray-600 md:text-base">
            <p>
              イケベジがお米をつくる佐渡・豊田集落には、<br />
              東京ドーム約10個分の田んぼが広がっています。<br />
              川から約4kmの水路で水を引き、<br />
              地域の農家が力を合わせて、この風景と稲作を守ってきました。
            </p>
            <p>
              時代が移り変わるなかで、<br />
              この営みを食べる人と一緒に次へつないでいきたい。<br />
              お米を食べることが、農家を増やしている実感につながるように。<br />
              そんな思いで、この定期便を始めました。
            </p>
          </div>
        </div>
      </div>

      <div className="relative mx-auto mt-8 aspect-[16/9] max-w-6xl overflow-hidden bg-gray-100 md:mt-12 md:aspect-[16/7]">
        <Image src="/images/home/satoyama-toyota.webp" alt="佐渡の豊田集落の里山風景" fill priority sizes="(max-width: 1280px) 100vw, 1152px" className="object-cover" />
      </div>

      <div className="mx-auto mt-20 max-w-6xl px-5 md:mt-28 md:px-0">
        <div className="text-center text-primary">
          <p className="font-serif text-sm leading-loose tracking-[0.08em] md:text-base">
            定期便を大切にしてくださるお客様へ、
          </p>
          <h2 className="mt-2 font-serif text-2xl font-medium leading-relaxed tracking-[0.12em] md:text-[34px]">
            精いっぱいの愛を込めて
          </h2>
          <span className="mx-auto mt-7 block h-px w-12 bg-primary/50" aria-hidden="true" />
        </div>

        <div className="mt-12 grid gap-4 md:mt-16 md:grid-cols-3 md:gap-5">
          {REASONS.map((reason, index) => (
            <div
              key={reason.title}
              className="flex min-h-56 flex-col border border-gray-200 bg-[#fbfaf7] px-7 py-9 text-center md:min-h-64 md:px-10 md:py-11"
            >
              <span className="text-[10px] tracking-[0.24em] text-gray-400" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-6 font-serif text-xl leading-relaxed tracking-[0.06em] text-primary md:text-[22px]">
                {reason.title}
              </h3>
              <p className="mt-5 text-sm leading-[2] text-gray-600 md:text-[15px]">{reason.description}</p>
            </div>
          ))}
        </div>
      </div>

      <nav aria-label="定期便についての詳細" className="mx-auto mt-14 flex max-w-5xl justify-center md:mt-20">
        <Link href="/subscription-guide" className="inline-flex min-h-11 items-center rounded-full border border-gray-300 px-7 text-sm text-primary transition-colors hover:border-primary hover:bg-primary hover:text-white">ご利用方法を詳しく見る →</Link>
      </nav>

      <div id="ikevege-subscription" className="mt-24 scroll-mt-28 border-t border-gray-100 pt-20 text-center md:mt-32 md:pt-28">
        <h2 className="mx-auto max-w-5xl font-serif text-lg font-medium leading-loose tracking-[0.06em] text-primary md:text-[22px] lg:whitespace-nowrap lg:text-[26px]">田んぼから食卓までのあいだに、できることを一つずつ積み重ねてお届けします。</h2>
      </div>
    </section>
  );
}
