import Link from 'next/link';
import FadeIn from '@/components/FadeIn';

const VIDEO = '/videos/hero.mp4';

const STORY_IMAGES = [
  { src: '/images/renewal/about/safety.webp', alt: '苗を見守るイケベジの農作業' },
  { src: '/images/renewal/brand/access-3.webp', alt: '佐渡の田んぼに集う人々' },
  { src: '/images/renewal/brand/access-1.webp', alt: '佐渡の田んぼでの稲刈り' },
  { src: '/images/renewal/brand/access-2.webp', alt: '収穫した稲を手にする参加者' },
];

export default function HeroStory() {
  return (
    <>
      <section className="bg-white pt-20 md:pt-24">
        <div className="mx-auto w-[80%] max-w-[1600px]">
          <video
            src={VIDEO}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="block aspect-video h-auto w-full bg-black object-cover object-center"
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

          <FadeIn className="mt-28 md:mt-44 lg:mt-52">
            <div className="grid grid-cols-2 overflow-hidden">
              {STORY_IMAGES.map((image) => (
                <div key={image.src} className="aspect-[4/3] overflow-hidden bg-dim">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.src} alt={image.alt} loading="lazy" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
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
                  <p className="text-yuunagi">
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

          <FadeIn className="mt-32 md:mt-48">
            <p className="text-center font-serif text-[17px] font-semibold tracking-[0.16em] text-primary md:text-[25px]">
              きょうも　しぜんと　いいときを。
            </p>
            <div className="mt-12 flex justify-end md:mt-16">
              <Link href="/about" className="inline-flex min-h-10 items-center rounded-full border border-gray-300 px-6 text-[10px] tracking-[0.08em] text-[#37332c] transition-colors hover:border-[#37332c] hover:bg-[#37332c] hover:text-white md:min-h-11 md:px-7 md:text-xs">
                詳しく知る →
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
