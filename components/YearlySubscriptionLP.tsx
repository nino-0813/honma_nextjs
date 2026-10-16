'use client';

import Image from 'next/image';
import Link from 'next/link';

const REASONS = [
  {
    title: ['一年を通して', '10%OFF'],
    description: '特別な日のごちそうではなく、毎日の一杯でありたいから。定期便は無理なく続けていただけるよう、通常価格から毎回10%OFFでお届けします。',
  },
  {
    title: ['新米のような', 'みずみずしさ'],
    description: '収穫したお米は専用の保冷庫で低温保管しています。発送直前に精米するので、新米に近いみずみずしさのまま一年中お届けできます。',
  },
  {
    title: ['お米を常温で守る', '保存袋をプレゼント'],
    description: '湿気・酸素・紫外線を防ぐ専用袋なので、冷蔵庫に入れなくても、虫やカビの心配を抑えながら常温でおいしさを保てます。',
  },
];

export default function YearlySubscriptionLP() {
  return (
    <section className="mb-12 md:mb-20">
      <div className="flex min-h-[58svh] items-center justify-center px-4 py-16 md:min-h-[64svh]">
        <div className="mx-auto w-full min-w-0 max-w-3xl text-left">
          <h1 className="text-center font-serif !text-[26px] font-semibold !leading-[1.5] tracking-[0.02em] text-primary md:whitespace-nowrap md:!text-[44px] md:tracking-wide">
            <span className="block md:inline">4700人とつくる</span>
            <span className="block md:inline">イケベジ定期便</span>
          </h1>
          <div className="mt-8 space-y-8 text-sm leading-[2] text-gray-600 md:text-base">
            <p>
              イケベジが活動する豊田集落は、日本海に向かってゆるやかに下る傾斜地にあります。そこには東京ドーム約10個分の田んぼが広がり、水田と海に沈む夕日は私たちの宝です。
            </p>
            <p>
              この田んぼを潤し続けてきたのは、江戸時代に山を縫うように拓かれた約4kmの用水路です。<br />
              先人たちがさまざまな努力を重ねて里山を形づくり、集落の人たちが代々丁寧に手入れを続けてきたからこそ、いまも豊田の風景は残っています。
            </p>
            <p>
              この厳しい時代だからこそ、その営みを食べる人と一緒に次の世代へつないでいきたい。お米を食べることが、農家を増やしている実感につながるように。そんな想いで、この定期便を始めました。
            </p>
          </div>
        </div>
      </div>

      <div className="relative mx-auto mt-8 aspect-[16/9] max-w-6xl overflow-hidden bg-gray-100 md:mt-12 md:aspect-[16/7]">
        <Image src="/images/home/satoyama-toyota.webp" alt="佐渡の豊田集落の里山風景" fill priority sizes="(max-width: 1280px) 100vw, 1152px" className="object-cover" />
      </div>

      <div className="mx-auto mt-20 max-w-6xl px-5 md:mt-28 md:px-0">
        <div className="text-center text-primary">
          <h2 className="mx-auto whitespace-nowrap text-center font-serif !text-[26px] leading-loose tracking-[-0.06em] md:max-w-none md:!text-base md:tracking-[0.08em]">
            定期便を大切にしてくださるお客様へ、愛を込めて。
          </h2>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-12 md:mt-16 md:grid-cols-3 md:gap-14">
          {REASONS.map((reason, index) => (
            <div
              key={reason.title.join('-')}
              className={`flex flex-col items-center px-3 text-center md:px-4 ${index > 0 ? 'md:relative md:before:absolute md:before:-left-7 md:before:top-5 md:before:h-28 md:before:w-px md:before:bg-gray-200' : ''}`}
            >
              <h3 className="whitespace-nowrap font-serif !text-[26px] leading-relaxed tracking-[-0.06em] text-primary md:whitespace-normal md:!text-[22px] md:tracking-[0.06em]">
                {reason.title.map((line) => (
                  <span key={line} className="inline md:block">{line}</span>
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

      <div id="ikevege-subscription" className="mt-24 scroll-mt-28 pt-20 text-center md:mt-32 md:border-t md:border-gray-100 md:pt-28">
        <h2 className="mx-auto max-w-5xl whitespace-nowrap font-serif !text-[26px] font-medium leading-loose tracking-[-0.06em] text-primary md:whitespace-normal md:!text-[22px] md:tracking-[0.06em] lg:whitespace-nowrap lg:!text-[26px]">できることを一つずつ積み重ねてお届けします。</h2>
      </div>
    </section>
  );
}
