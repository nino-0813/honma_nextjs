import Link from 'next/link';
import FadeIn from '@/components/FadeIn';

const VIDEO = '/videos/hero.mp4';

const STORY_IMAGES = [
  { src: '/images/home/story/rice-seeds.webp', alt: '水に浮かぶ籾' },
  { src: '/images/home/story/rice-seedlings.webp', alt: '苗箱に育つ稲の苗' },
  { src: '/images/home/story/field-mowing.webp', alt: '佐渡の田んぼで草を刈る農家' },
  { src: '/images/home/story/rice-harvest.webp', alt: '稲刈り機で収穫する農家' },
];

export default function HeroStory() {
  return (
    <>
      <section className="bg-white">
        <div className="w-full">
          <video
            src={VIDEO}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="block h-[100svh] w-full object-cover object-center"
          />
        </div>
      </section>

      <section className="bg-white px-[10%] pb-28 pt-28 md:pb-44 md:pt-40 lg:pb-52 lg:pt-48">
        <div className="mx-auto max-w-[1440px]">
          <FadeIn>
            <h1 className="font-serif text-[22px] font-medium leading-[2.05] tracking-[0.18em] text-primary md:text-[34px] lg:text-[42px]">
              きょうも<br />
              しぜんと<br />
              いいときを。
            </h1>
          </FadeIn>

          <div className="mx-auto mt-28 max-w-[780px] font-serif text-[11px] font-medium leading-[2.25] tracking-[0.06em] text-[#24211d] md:mt-44 md:text-[14px] md:leading-[2.35] lg:mt-52 lg:text-[15px]">
            <FadeIn>
              <div className="space-y-8 md:space-y-11">
                <div>
                  <p>拝啓</p>
                  <p>イケベジを知ってくれた　あなたへ</p>
                </div>
                <p>
                  佐渡ヶ島は<br />
                  豊かな自然や文化が詰まった「日本の縮図」といわれる島です。
                </p>
                <div>
                  <p>そして</p>
                  <p className="text-[#24211d]">
                    トキとの共生を選び 全島の農家が立ち上がったという この島の歴史は<br />
                    佐渡の未来を担う農家たちの胸を熱くする物語であり<br />
                    私たちもまた この歴史のバトンを受け継いでいます。
                  </p>
                </div>
                <p>
                  島の自然が魅せる美しさ、楽しさ、厳しさ、ワクワク感<br />
                  その自然界の “イケてる” をもっと社会に伝え還元していきたい<br />
                  という思いから わたしたち「イケベジ」は始まったのです。
                </p>
                <p>
                  自然から学び、豊かさを分かち合うことを通じて<br />
                  しぜんと笑みがこぼれるような社会への架け橋となり
                </p>
                <p>
                  なんでもない日常がちょっとでも<br />
                  “特別な時間（とき）” を感じられますように。という意味を込めて
                </p>
                <p>「きょうも　しぜんと　いいときを。」</p>
              </div>
              <div className="mt-14 text-right md:mt-20">
                <p>敬具</p>
                <p>佐渡ヶ島より　愛を込めて</p>
                <p>イケベジより</p>
              </div>
            </FadeIn>
          </div>

          <FadeIn className="mx-auto mt-16 max-w-[780px] md:mt-24">
            <div className="flex justify-end">
              <Link href="/about" className="inline-flex min-h-10 items-center rounded-full border border-gray-300 px-6 text-[10px] tracking-[0.08em] text-[#37332c] transition-colors hover:border-[#37332c] hover:bg-[#37332c] hover:text-white md:min-h-11 md:px-7 md:text-xs">
                詳しく知る →
              </Link>
            </div>
          </FadeIn>

          <FadeIn className="mt-24 md:mt-36">
            <div className="grid grid-cols-2 overflow-hidden">
              {STORY_IMAGES.map((image) => (
                <div key={image.src} className="aspect-video overflow-hidden bg-dim">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.src} alt={image.alt} loading="lazy" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
