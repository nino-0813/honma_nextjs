'use client';

import Image from 'next/image';
import Link from 'next/link';

const REASONS = [
  {
    title: ['いつでも', '10%OFF'],
    description: '毎日のご飯だから、無理なく続けていただけるように。定期便は通常価格からいつでも10%OFFでお届けします。',
  },
  {
    title: ['新米のような', 'みずみずしさ'],
    description: '収穫したお米は専用の保冷庫で低温保管しています。発送直前に精米するので、新米に近いみずみずしさのまま一年中お届けできます。',
  },
  {
    title: ['常温保存可能な', '保存袋をプレゼント'],
    description: '湿気・酸素・紫外線を防ぐので、冷蔵庫に入れなくても、虫やカビを気にせず常温でおいしさを保てます。',
  },
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
          <h2 className="whitespace-nowrap font-serif text-xs leading-loose tracking-[0.08em] md:text-base">
            定期便を大切にしてくださるお客様へ、愛を込めて
          </h2>
          <span className="mx-auto mt-7 block h-px w-12 bg-primary/50" aria-hidden="true" />
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-12 md:mt-16 md:grid-cols-3 md:gap-14">
          {REASONS.map((reason, index) => (
            <div
              key={reason.title.join('-')}
              className={`flex flex-col items-center px-3 text-center md:px-4 ${index > 0 ? 'md:relative md:before:absolute md:before:-left-7 md:before:top-5 md:before:h-28 md:before:w-px md:before:bg-gray-200' : ''}`}
            >
              <h3 className="font-serif text-xl leading-relaxed tracking-[0.06em] text-primary md:text-[22px]">
                {reason.title.map((line) => (
                  <span key={line} className="block">{line}</span>
                ))}
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
