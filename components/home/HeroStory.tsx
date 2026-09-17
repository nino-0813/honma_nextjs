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

      <section className="flex min-h-[72svh] items-center justify-center bg-white px-6 py-24 md:min-h-[88svh] md:px-12 md:py-32">
        <h1 className="text-center font-serif text-[clamp(42px,6vw,92px)] font-normal leading-[1.75] tracking-[0.08em] text-black">
          あんしん、<br />
          おいしい、<br />
          いいとき。
        </h1>
      </section>

      <section className="bg-white px-6 pb-24 pt-16 md:px-12 md:pb-24 md:pt-24 lg:min-h-[88svh]">
        <div className="mx-auto flex min-h-[720px] w-full flex-col md:w-[76%] lg:min-h-[calc(88svh-12rem)]">
          <div className="w-full space-y-7 font-serif text-[13px] leading-[2] tracking-[0.025em] text-black md:space-y-8 md:text-[15px] md:leading-[1.9] lg:text-[16px]">
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

          <p className="mt-auto pt-20 text-center font-serif text-xl font-semibold tracking-[0.08em] text-black md:text-2xl">
            きょうも しぜんと いいときを。
          </p>

          <div className="mt-10 flex justify-end md:mt-8">
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
