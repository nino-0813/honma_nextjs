import Link from 'next/link';

const VIDEO = '/videos/hero.mp4';

export default function HeroStory() {
  return (
    <>
      <section className="bg-white pt-20 md:pt-24">
        <div className="flex justify-center pb-[clamp(32px,5vw,72px)]">
          <video
            src={VIDEO}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="block aspect-video h-auto w-[80%] max-w-[1600px] bg-black object-cover object-center"
          />
        </div>
      </section>

      <section className="bg-white px-6 pb-24 pt-20 md:px-12 md:pb-32 md:pt-28">
        <div className="mx-auto w-full max-w-[1120px] font-serif text-[13px] font-semibold leading-[2.1] tracking-[0.04em] text-black md:text-[15px] md:leading-[2.15] lg:text-[16px]">
          <div className="space-y-10 md:space-y-12">
            <p>
              佐渡ヶ島は<br />
              豊かな自然や文化が詰まった「日本の縮図」といわれる島です。
            </p>

            <div>
              <p className="mb-1">そして</p>
              <p className="text-[#ed5d3b]">
                トキとの共生を選び<br />
                全島の農家が立ち上がったという この島の歴史は<br className="hidden md:block" />
                佐渡の未来を紡ぐ農家にとって誇りであり、胸を熱くする原点です。
              </p>
            </div>

            <p>
              島の自然が魅せる美しさ、楽しさ、厳しさ、ワクワク感<br />
              その自然界の “イケてる” 部分をもっと社会に伝え還元していきたい<br className="hidden md:block" />
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

          <div className="mt-16 text-right md:mt-24">
            <p>敬具</p>
            <p>佐渡ヶ島より　愛を込めて</p>
            <p>イケているベジタブル　イケベジより</p>
          </div>

          <div className="mt-12 flex justify-end md:mt-16">
            <Link
              href="/about"
              className="inline-flex min-h-10 items-center rounded-full border border-gray-300 px-6 text-xs tracking-[0.08em] text-[#37332c] transition-colors hover:border-[#37332c] hover:bg-[#37332c] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              詳しく知る →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
