import Link from 'next/link';
import SectionHeading from './SectionHeading';

/**
 * ブランドについて（ベースフード構成の4番目「ベースフードについて」に相当）。
 * 要件どおり「あんしん / おいしい / いいかお」の3キーワードで簡潔に。
 *
 * 「美味しさ・安心安全は大前提であって主役にしない。真の差別化はいいかお」
 * という整理に従い、いいかおの説明にプロセスの具体を寄せている。
 */
const KEYWORDS = [
  {
    key: 'あんしん',
    lead: '農薬にも化学肥料にも頼らない',
    body: '島の有機資源だけで土を磨き上げます。子どもに毎日食べさせられるかどうかを基準にしています。',
  },
  {
    key: 'おいしい',
    lead: '品種が持つ味を、そのまま',
    body: '余計なものを足さず、品種が秘めた旨みと香りをまっすぐに引き出します。世界最高米®の最高金賞をいただきました。',
  },
  {
    key: 'いいかお',
    lead: '田んぼが、島の循環をつくる',
    body: '生きものが育ち、子どもが学び、集落が続く。お米はその結果として生まれます。プロセスのほうを大切にしています。',
  },
];

export default function BrandAbout() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading label="About" title="イケベジについて" align="center" />

        <p className="mt-8 text-center text-lg md:text-2xl font-serif leading-loose tracking-wider text-primary">
          あんしん、
          <br className="md:hidden" />
          おいしい、
          <br className="md:hidden" />
          いいかお。
        </p>
        <p className="mt-6 mx-auto max-w-2xl text-center text-xs md:text-sm text-gray-600 leading-loose">
          自然から学び、豊かさを分かち合う。
          <br />
          佐渡と共に歩み、共に挑戦しつづけます。
        </p>

        <ul className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          {KEYWORDS.map((k) => (
            <li key={k.key} className="flex flex-col gap-3 md:px-2">
              <div className="w-8 h-px bg-amber-600" />
              <h3 className="text-base md:text-lg font-serif tracking-[0.15em] text-primary">{k.key}</h3>
              <p className="text-sm font-medium text-primary leading-relaxed">{k.lead}</p>
              <p className="text-xs md:text-sm text-gray-600 leading-loose">{k.body}</p>
            </li>
          ))}
        </ul>

        <div className="mt-12 text-center">
          <Link
            href="/about"
            className="inline-block px-8 py-3 rounded-full border border-primary text-sm tracking-wider text-primary hover:bg-primary hover:text-white transition-colors"
          >
            ブランドについて
          </Link>
        </div>
      </div>
    </section>
  );
}
