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
    <section className="pt-16 md:pt-24 bg-white">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10">
        <SectionHeading en="About" ja="イケベジについて" />

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          <p className="text-2xl md:text-[32px] font-serif leading-[1.7] tracking-wide text-primary">
            あんしん、
            <br />
            おいしい、
            <br />
            いいかお。
          </p>
          <div className="flex flex-col gap-5 text-[13px] md:text-sm text-gray-600 leading-loose">
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
      <ul className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-3">
        {TILES.map((t) => (
          <li key={t.key}>
            <a href={t.href} className="group relative block aspect-[4/5] md:aspect-[3/4] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={t.image}
                alt={t.key}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[900ms] group-hover:scale-105"
              />
              {/* 同上。イラスト素材が明るいので強めにかける */}
              <span className="absolute inset-0 bg-black/45 transition-colors group-hover:bg-black/55" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/25" />
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6">
                <span className="text-white text-xl md:text-2xl font-serif tracking-[0.15em] drop-shadow">{t.key}</span>
                <span className="text-white/95 text-xs md:text-sm leading-relaxed whitespace-pre-line drop-shadow">
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
