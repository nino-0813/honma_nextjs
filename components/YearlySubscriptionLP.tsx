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
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-medium tracking-[0.16em] text-primary md:text-sm">イケベジ定期便</p>
        <h1 className="mt-5 font-serif text-3xl font-semibold leading-[1.5] tracking-wide text-primary md:text-[44px]">
          4700人とつくる里山
        </h1>
        <div className="mt-8 space-y-6 text-sm leading-[2] text-gray-600 md:text-base">
          <p>イケベジは佐渡ヶ島と共にこれからも前に進み続けます。<br />その佐渡の中で、イケベジが生まれ継ないでいく集落が「豊田集落」</p>
          <p>定期便は、リーズナブルに安定してお届けする仕組みであると共に、<br className="hidden md:block" />お客様とイケベジが一緒に歩んでいくための形です。</p>
          <p>無意識の日常の一杯のご飯が、着実に日本の農業を変え、<br className="hidden md:block" />この「豊田集落」を繋いでいく一杯になります。</p>
        </div>
      </div>

      <div className="relative mx-auto mt-12 aspect-[16/9] max-w-6xl overflow-hidden bg-gray-100 md:mt-16 md:aspect-[16/7]">
        <Image src="/images/home/satoyama-toyota.webp" alt="佐渡の豊田集落の里山風景" fill priority sizes="(max-width: 1280px) 100vw, 1152px" className="object-cover" />
      </div>

      <div className="mx-auto mt-16 grid max-w-6xl border-y border-gray-200 md:mt-24 md:grid-cols-3 md:divide-x md:divide-gray-200">
        {REASONS.map((reason) => (
          <div key={reason.title} className="flex min-h-44 flex-col justify-center px-6 py-10 text-center md:min-h-52 md:px-12">
            <h2 className="font-serif text-xl tracking-[0.06em] text-primary md:text-2xl">{reason.title}</h2>
            <p className="mt-4 text-sm leading-loose text-gray-600 md:text-base">{reason.description}</p>
          </div>
        ))}
      </div>

      <nav aria-label="定期便についての詳細" className="mx-auto mt-10 flex max-w-5xl justify-center md:mt-12">
        <Link href="/subscription-guide" className="inline-flex min-h-11 items-center rounded-full border border-gray-300 px-7 text-sm text-primary transition-colors hover:border-primary hover:bg-primary hover:text-white">ご利用方法を詳しく見る →</Link>
      </nav>

      <div id="ikevege-subscription" className="mt-20 scroll-mt-28 border-t border-gray-100 pt-12 text-center md:mt-28 md:pt-16">
        <h2 className="mx-auto max-w-3xl font-serif text-lg font-medium leading-loose tracking-wider text-primary md:text-2xl">田んぼから食卓までのあいだに、できることを一つずつ積み重ねてお届けします。</h2>
      </div>
    </section>
  );
}
