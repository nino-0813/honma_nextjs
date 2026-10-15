import Link from 'next/link';
import FadeIn from '@/components/FadeIn';

const DESKTOP_VIDEO = '/videos/hero-desktop-v2.mp4';
const MOBILE_VIDEO = '/videos/hero-mobile-v2.mp4';

const STORY_IMAGES = [
  { src: '/images/home/story/rice-seeds.webp', alt: '水に浮かぶ籾' },
  { src: '/images/home/story/rice-seedlings.webp', alt: '苗箱に育つ稲の苗' },
  { src: '/images/home/story/toki-flight.webp', alt: '佐渡の田んぼの上を飛ぶ朱鷺' },
  { src: '/images/home/story/rice-harvest.webp', alt: '稲刈り機で収穫する農家' },
];

export default function HeroStory() {
  return (
    <>
      <section className="bg-white">
        <div className="w-full">
          <video
            src={MOBILE_VIDEO}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="block h-[100svh] w-full object-cover object-center md:hidden"
          />
          <video
            src={DESKTOP_VIDEO}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="hidden h-[100svh] w-full object-cover object-center md:block"
          />
        </div>
      </section>

      <section className="bg-white pb-24 pt-24 md:hidden">
        <div className="site-shell max-w-[430px]">
          <div className="grid grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] items-stretch gap-4">
            <div className="flex min-w-0 items-center">
              <FadeIn>
                <h1 className="site-display-copy whitespace-nowrap font-serif text-primary">
                  きょうも<br />
                  しぜんと<br />
                  いいときを。
                </h1>
              </FadeIn>
            </div>

            <FadeIn className="grid h-[520px] min-h-0 grid-rows-4 overflow-hidden">
              {STORY_IMAGES.map((image, index) => (
                <div key={image.src} className="min-h-0 overflow-hidden bg-dim">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.src} alt={image.alt} loading={index < 2 ? 'eager' : 'lazy'} className="h-full w-full object-cover" />
                </div>
              ))}
            </FadeIn>
          </div>
        </div>
      </section>

      <section className="bg-white pb-32 pt-24 md:hidden">
        <FadeIn className="site-reading-text site-shell max-w-[430px] font-serif text-[#24211d]">
          <div className="space-y-8">
            <div>
              <p>拝啓</p>
              <p>イケベジを知ってくれた</p>
              <p>あなたへ</p>
            </div>
            <div className="!mt-[calc(3rem+4.2em)]">
              <p>佐渡ヶ島は</p>
              <p>豊かな自然や文化が詰まった</p>
              <p>「日本の縮図」といわれる島です。</p>
            </div>
            <div>
              <p>そして トキとの共生を選び</p>
              <p>全島の農家が立ち上がったという</p>
              <p>この島の歴史は</p>
              <p>佐渡の未来を担う農家たちの</p>
              <p>胸を熱くする物語であり</p>
            </div>
            <div>
              <p>私たちもまた</p>
              <p>この歴史のバトンを受け継いでいます。</p>
            </div>
            <div>
              <p>島の自然が魅せる</p>
              <p>美しさ、楽しさ、厳しさ、ワクワク感</p>
              <p>その自然界の “イケてる” を</p>
              <p>もっと社会に伝え還元していきたい</p>
              <p>という思いから</p>
              <p>わたしたち「イケベジ」は始まったのです。</p>
            </div>
            <div>
              <p>自然から学び</p>
              <p>豊かさを分かち合うことを通じて</p>
              <p>しぜんと笑みがこぼれるような社会への</p>
              <p>架け橋となり</p>
            </div>
            <div>
              <p>なんでもない日常がちょっとでも</p>
              <p>“特別な時間（とき）” を感じられますように。</p>
              <p>という意味を込めて</p>
            </div>
            <p>「きょうも　しぜんと　いいときを。」</p>
          </div>

          <div className="mt-12 text-left">
            <p>敬具</p>
            <p>佐渡ヶ島より　愛を込めて</p>
            <p>イケベジより</p>
          </div>

          <div className="mt-10 flex justify-start">
            <Link href="/about" className="site-pill-link">
              詳しく知る →
            </Link>
          </div>
        </FadeIn>
      </section>

      <section className="hidden min-h-[100svh] items-center bg-white md:flex">
        <div className="site-shell">
          <FadeIn>
            <h1 className="home-story-display-copy site-display-copy whitespace-nowrap font-serif text-primary">
              きょうも<br />
              しぜんと<br />
              いいときを。
            </h1>
          </FadeIn>
        </div>
      </section>

      <section className="hidden bg-white pb-24 md:block lg:pb-28">
        <div className="site-shell">
          <div className="grid grid-cols-2 items-stretch gap-x-20 lg:gap-x-32">
            <FadeIn className="site-reading-text col-start-1 row-start-1 min-w-0 font-serif text-[#24211d]">
              <p>拝啓</p>
              <p>イケベジを知ってくれた</p>
              <p>あなたへ</p>
            </FadeIn>

            <FadeIn className="site-reading-text col-start-1 row-start-2 mt-8 min-w-0 font-serif text-[#24211d] lg:mt-10">
              <div className="space-y-8 lg:space-y-10">
                  <div>
                    <p>佐渡ヶ島は</p>
                    <p>豊かな自然や文化が詰まった</p>
                    <p>「日本の縮図」といわれる島です。</p>
                  </div>
                  <div>
                    <p>そして トキとの共生を選び</p>
                    <p>全島の農家が立ち上がったという この島の歴史は</p>
                    <p>佐渡の未来を担う農家たちの胸を熱くする物語であり</p>
                    <p>私たちもまた この歴史のバトンを受け継いでいます。</p>
                  </div>
                  <div>
                    <p>島の自然が魅せる美しさ、楽しさ、厳しさ、ワクワク感</p>
                    <p>その自然界の “イケてる” を</p>
                    <p>もっと社会に伝え還元していきたいという思いから</p>
                    <p>わたしたち「イケベジ」は始まったのです。</p>
                  </div>
                  <div>
                    <p>自然から学び</p>
                    <p>豊かさを分かち合うことを通じて</p>
                    <p>しぜんと笑みがこぼれるような社会への架け橋となり</p>
                  </div>
                  <div>
                    <p>なんでもない日常がちょっとでも</p>
                    <p>“特別な時間（とき）” を感じられますように。</p>
                    <p>という意味を込めて</p>
                  </div>
                  <p>「きょうも　しぜんと　いいときを。」</p>
              </div>
            </FadeIn>

            <div className="col-start-2 row-start-2 mt-8 grid min-h-0 grid-rows-4 overflow-hidden lg:mt-10">
              {STORY_IMAGES.map((image, index) => (
                <FadeIn key={image.src} delay={140 + index * 110} className="min-h-0 overflow-hidden bg-dim">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.src} alt={image.alt} loading="lazy" className="h-full w-full object-cover" />
                </FadeIn>
              ))}
            </div>

            <FadeIn className="site-reading-text col-start-1 row-start-3 mt-16 min-w-0 font-serif text-[#24211d]">
              <div className="text-right">
                <p>敬具</p>
                <p>佐渡ヶ島より　愛を込めて</p>
                <p>イケベジより</p>
              </div>

              <div className="mt-16 flex justify-end">
                <Link href="/about" className="site-pill-link">
                  詳しく知る →
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

    </>
  );
}
