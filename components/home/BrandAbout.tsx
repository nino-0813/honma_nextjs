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
    image: '/images/about/stories/about_story_taue_123.webp',
    href: '/about',
  },
  {
    key: 'おいしい',
    lead: '品種が持つ味を、\nそのまま',
    // イラストバナーは文字が競るため炊飯シーンの写真を使用
    image: '/images/usage-scene.jpg',
    href: '/about',
  },
  {
    key: 'いいかお',
    lead: '田んぼが、\n島の循環をつくる',
    image: '/images/joinus/sadokids-fieldwork.jpg',
    href: '/join-us',
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

      {/* 全面タイル */}
      <ul className="mt-14 md:mt-20 grid grid-cols-1 md:grid-cols-3">
        {TILES.map((t, i) => (
          <li key={t.key}>
            <FadeIn delay={Math.min(i, 2) * 80}>
            <a href={t.href} className="group block">
              {/* 写真には色を重ねない */}
              <span className="relative block aspect-[4/5] md:aspect-[3/4] lg:aspect-auto lg:h-[70svh] overflow-hidden bg-dim">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.image}
                  alt={t.key}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </span>
              <span className="flex flex-col gap-2 px-5 md:px-6 py-6">
                <span className="text-xl md:text-2xl font-serif font-semibold tracking-[0.15em] text-primary">{t.key}</span>
                <span className="text-[13px] md:text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {t.lead}
                </span>
                <span className="mt-1">
                  <CircleButton icon="plus" variant="dark" />
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
