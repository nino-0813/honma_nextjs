import Link from 'next/link';
import SectionHeading from './SectionHeading';
import CircleButton from './CircleButton';

/**
 * 取り組み（ベースフードの「サービス」枠に相当）。
 * イケベジの場合はお米を買う以外の関わり方＝JOIN USの3プロジェクトを置く。
 */
const ITEMS = [
  {
    title: 'イケてるパートナーズ',
    body: '1年を通して佐渡の田んぼとつながる、企業向けのオーナー制度です。',
    image: '/images/joinus/artboard_1_copy.webp',
    href: '/join-us',
  },
  {
    title: '佐渡Kids生きもの調査隊',
    body: '19年目を迎える環境学習プログラム。子どもたちと田んぼの生きものを1年かけて調べます。',
    image: '/images/joinus/sadokids-fieldwork.jpg',
    href: '/join-us',
  },
  {
    title: 'クラウドファンディング',
    body: 'スマート農機の導入に挑戦しました。佐渡の栽培技術と技術を掛け合わせています。',
    image: '/images/joinus/crowdfunding-1052.webp',
    href: '/join-us',
  },
  {
    title: '稲刈りリトリート',
    body: '実際に佐渡へ来て、田んぼに入る。貯まったイベントマイルでご参加いただけます。',
    image: '/images/about/stories/P3A9707.webp',
    href: '/collections',
  },
];

export default function Activities() {
  return (
    <section className="pb-20 md:pb-28 bg-white">
      <div className="max-w-[1500px] mx-auto px-5 md:px-10">
        <SectionHeading ja="取り組み" />

        <ul className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {ITEMS.map((s) => (
            <li key={s.title}>
              <Link href={s.href} className="group block">
                <div className="relative aspect-[4/3] overflow-hidden bg-dim">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.image}
                    alt={s.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <h3 className="mt-3 text-[13px] md:text-sm font-medium text-primary group-hover:text-gray-600 transition-colors">
                  {s.title}
                </h3>
                <p className="mt-1.5 text-[12px] text-gray-600 leading-relaxed">{s.body}</p>
                <span className="mt-2 inline-block">
                  <CircleButton icon="arrow" variant="dark" size="sm" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
