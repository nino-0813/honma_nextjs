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

      <section className="bg-white px-6 pb-24 pt-10 md:px-12 md:pb-32 md:pt-16">
        <div className="mx-auto max-w-[1120px]">
          <h1 className="text-center font-serif text-3xl font-semibold leading-[1.55] tracking-wide text-primary md:text-[44px]">
            きょうも しぜんと いいときを。
          </h1>

          <div className="mx-auto mt-8 flex max-w-3xl flex-col gap-6 text-center text-sm leading-[2] text-gray-600 md:text-base">
            <p>
              佐渡ヶ島は新潟県の日本海に浮かぶ大きな島です。1000m超える深い山と、広大な平野を持ち合わせ、島特有の長い秋が、お米をゆっくりと登熟させ、極上のお米が育まれる地域です。
            </p>
            <p>
              そして、絶滅したトキとの共生に向け、全島が立ち上がり切り拓いてきた佐渡の農業。その熱い歴史は、次の未来を創る私たち世代の原動力となっています。
            </p>
            <p>
              島の自然が魅せる美しさ、楽しさ、厳しさ、ワクワク感。そんな自然界の“イケてる”を社会へ届けるために、わたしたち「イケベジ」は始まりました。自然の力に寄り添い育てた作物が日々の活力となり、いつもの日常が少し“特別な時間（とき）”になりますように。
            </p>
          </div>

          <div className="mt-12 flex justify-end md:mt-16">
            <Link
              href="/about"
              className="inline-flex min-h-12 items-center rounded-full border border-[#aaa08d] px-7 text-sm tracking-[0.08em] text-[#37332c] transition-colors hover:border-[#37332c] hover:bg-[#37332c] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              詳しく知る →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
