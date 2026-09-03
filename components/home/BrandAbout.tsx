import SectionHeading from './SectionHeading';
import CircleButton from './CircleButton';
import FadeIn from '@/components/FadeIn';

/**
 * ブランドについて。
 * ベースフードの About と同じく、左に大きな宣言 / 右に本文を置き、
 * その下に全面写真タイルで3つのキーワードを見せる。
 *
 * キーワードは要件定義の「あんしん / おいしい / いいかお」。
 */
const TILES = [
  {
    key: 'あんしん',
    lead: '農薬にも化学肥料にも\n頼らない',
    image: '/images/renewal/about/safety.webp',
    href: '/about',
  },
  {
    key: 'おいしい',
    lead: '品種が持つ味を、\nそのまま',
    image: '/images/renewal/about/delicious.webp',
    href: '/about',
  },
  {
    key: 'いいかお',
    lead: '田んぼが、\n島の循環をつくる',
    image: '/images/renewal/about/smiles.webp',
    href: '/about',
  },
];

export default function BrandAbout() {
  return (
    <section className="pt-20 md:pt-32 bg-white">
      <div className="max-w-[1500px] mx-auto px-5 md:px-10">
        <FadeIn>
          <SectionHeading en="About" ja="イケベジについて" />
        </FadeIn>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20">
          <p className="text-3xl md:text-[44px] lg:text-[52px] font-serif font-semibold leading-[1.6] tracking-wide text-primary">
            あんしん、
            <br />
            おいしい、
            <br />
            いいかお。
          </p>
          <div className="flex flex-col gap-5 text-sm md:text-base text-gray-600 leading-loose">
            <p>
              自然から学び、豊かさを分かち合う。イケベジは佐渡島で、農薬にも化学肥料にも頼らずにお米を育てています。
            </p>
            <p>
              おいしさや安全は、私たちにとって大前提です。そのうえで大切にしているのは、田んぼが生む「いいかお」のほう。
              生きものが育ち、子どもが学び、集落が続く。おいしいお米は、そのプロセスの結果として生まれます。
            </p>
            <p>佐渡と共に歩み、共に挑戦しつづけます。</p>
          </div>
        </div>
      </div>

      {/* 写真全体を押せるブランドタイル */}
      <ul className="mt-14 grid grid-cols-1 gap-px bg-white md:mt-20 md:grid-cols-3">
        {TILES.map((t, i) => (
          <li key={t.key}>
            <FadeIn delay={Math.min(i, 2) * 80}>
            <a
              href={t.href}
              aria-label={`${t.key}について詳しく見る`}
              className="group block focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-white"
            >
              <span className="relative block aspect-[4/5] md:aspect-[3/4] lg:aspect-auto lg:h-[70svh] overflow-hidden bg-dim">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.image}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 group-focus-visible:scale-105 motion-reduce:transition-none"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-black/10 transition-colors duration-300 group-hover:from-black/75 group-hover:via-black/30" />
                <span className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
                  <span className="text-2xl font-serif font-semibold tracking-[0.15em] drop-shadow-sm md:text-[26px] lg:text-[30px]">{t.key}</span>
                  <span className="mt-3 whitespace-pre-line text-xs font-medium leading-relaxed tracking-[0.08em] drop-shadow-sm md:text-sm">{t.lead}</span>
                  <span className="mt-6 transition-transform duration-300 group-hover:translate-x-1 group-focus-visible:translate-x-1 motion-reduce:transition-none">
                    <CircleButton icon="arrow" variant="light" />
                  </span>
                </span>
              </span>
            </a>
            </FadeIn>
          </li>
        ))}
      </ul>
    </section>
  );
}
