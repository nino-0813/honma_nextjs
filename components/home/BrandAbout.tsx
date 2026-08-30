import SectionHeading from './SectionHeading';
import CircleButton from './CircleButton';

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
        <SectionHeading en="About" ja="イケベジについて" />

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20">
          <p className="text-3xl md:text-[44px] lg:text-[52px] font-serif leading-[1.6] tracking-wide text-primary">
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
        {TILES.map((t) => (
          <li key={t.key}>
            <a href={t.href} className="group relative block aspect-[4/5] md:aspect-auto md:h-[78svh] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={t.image}
                alt={t.key}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[900ms] group-hover:scale-105"
              />
              {/* 同上。イラスト素材が明るいので強めにかける */}
              <span className="absolute inset-0 bg-hekishoku/60 transition-colors group-hover:bg-hekishoku/70" />
              <span className="absolute inset-0 bg-gradient-to-t from-hekishoku-deep/50 via-transparent to-hekishoku-deep/30" />
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6">
                <span className="text-white text-2xl md:text-4xl font-serif tracking-[0.15em] drop-shadow">{t.key}</span>
                <span className="text-white/95 text-sm md:text-base leading-relaxed whitespace-pre-line drop-shadow">
                  {t.lead}
                </span>
                <span className="mt-2">
                  <CircleButton icon="plus" variant="light" />
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
