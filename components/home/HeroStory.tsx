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
          <div className="space-y-10">
            <div>
              <p>拝啓</p>
              <p className="mt-1">
                イケベジを知ってくれた<br />
                あなたへ
              </p>
            </div>
            <p>
              佐渡ヶ島は、豊かな自然や文化が詰まった
              「日本の縮図」といわれる島です。
            </p>
            <div>
              <p>そして</p>
              <p className="mt-3">
                トキとの共生を選び、全島の農家が立ち上がったこの島の歴史は、佐渡の未来を担う農家たちの胸を熱くする物語です。私たちもまた、
                この歴史のバトンを受け継いでいます。
              </p>
            </div>
            <p>
              島の自然が魅せる美しさ、楽しさ、厳しさ、ワクワク感。その自然界の“イケてる”をもっと社会に伝え、還元していきたい。そんな思いから、わたしたち「イケベジ」は
              始まりました。
            </p>
            <p>
              自然から学び、豊かさを分かち合うことを通じて、しぜんと笑みがこぼれる社会への
              架け橋となります。
            </p>
            <p>
              なんでもない日常が、ちょっとでも
              “特別な時間（とき）”になりますように。
            </p>
            <p>「きょうも　しぜんと　いいときを。」</p>
          </div>

          <div className="mt-12 text-left">
            <p>敬具</p>
            <p>佐渡ヶ島より　愛を込めて</p>
            <p>イケベジより</p>
          </div>

          <div className="mt-10 flex justify-start">
            <Link href="/about" className="site-button-label inline-flex min-h-11 items-center rounded-full border border-gray-300 px-6 text-[#37332c] transition-colors hover:border-[#37332c] hover:bg-[#37332c] hover:text-white">
              詳しく知る →
            </Link>
          </div>
        </FadeIn>
      </section>

      <section className="hidden bg-white pb-44 pt-36 md:block lg:pb-52 lg:pt-44">
        <div className="site-shell">
          <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] items-stretch gap-16 lg:gap-24">
            <div className="flex min-w-0 flex-col pt-28 lg:pt-36">
              <FadeIn>
                <h1 className="site-display-copy whitespace-nowrap font-serif text-primary">
                  きょうも<br />
                  しぜんと<br />
                  いいときを。
                </h1>
              </FadeIn>

              <FadeIn className="site-reading-text mt-40 font-serif text-[#24211d] lg:mt-48">
                <div className="space-y-10">
                  <div>
                    <p>拝啓</p>
                    <p>イケベジを知ってくれた<br />あなたへ</p>
                  </div>
                  <p>
                    佐渡ヶ島は、豊かな自然や文化が詰まった「日本の縮図」といわれる島です。
                  </p>
                  <div>
                    <p>そして</p>
                    <p className="mt-2">
                      トキとの共生を選び、全島の農家が立ち上がったこの島の歴史は、佐渡の未来を担う農家たちの胸を熱くする物語であり、私たちもまたこの歴史のバトンを受け継いでいます。
                    </p>
                  </div>
                  <p>
                    島の自然が魅せる美しさ、楽しさ、厳しさ、ワクワク感。その自然界の“イケてる”をもっと社会に伝え還元していきたいという思いから、わたしたち「イケベジ」は始まったのです。
                  </p>
                  <p>
                    自然から学び、豊かさを分かち合うことを通じて、しぜんと笑みがこぼれるような社会への架け橋となります。
                  </p>
                  <p>
                    なんでもない日常がちょっとでも“特別な時間（とき）”になりますように。
                  </p>
                  <p>「きょうも　しぜんと　いいときを。」</p>
                </div>

                <div className="mt-16 text-right">
                  <p>敬具</p>
                  <p>佐渡ヶ島より　愛を込めて</p>
                  <p>イケベジより</p>
                </div>

                <div className="mt-16 flex justify-end">
                  <Link href="/about" className="site-button-label inline-flex min-h-11 items-center rounded-full border border-gray-300 px-7 text-[#37332c] transition-colors hover:border-[#37332c] hover:bg-[#37332c] hover:text-white">
                    詳しく知る →
                  </Link>
                </div>
              </FadeIn>
            </div>

            <div className="grid min-h-0 grid-rows-4 overflow-hidden">
              {STORY_IMAGES.map((image, index) => (
                <FadeIn key={image.src} delay={140 + index * 110} className="min-h-0 overflow-hidden bg-dim">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.src} alt={image.alt} loading="lazy" className="h-full w-full object-cover" />
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
