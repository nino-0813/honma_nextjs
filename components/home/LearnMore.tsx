import Link from 'next/link';
import SectionHeading from './SectionHeading';
import { supabase } from '@/lib/supabase';
import { LEARN_MORE_CARDS, PLACEHOLDER_TOPICS } from './placeholders';
import FadeIn from '@/components/FadeIn';

const ACTIVITIES = [
  {
    title: 'イケてるパートナーズ',
    body: '1年を通して佐渡の田んぼとつながる、企業向けのオーナー制度です。',
    image: '/images/joinus/artboard_1_copy.webp',
    href: '/join-us',
    label: '取り組み',
  },
  {
    title: '佐渡Kids生きもの調査隊',
    body: '子どもたちと田んぼの生きものを1年かけて調べる環境学習プログラムです。',
    image: '/images/joinus/sadokids-fieldwork.jpg',
    href: '/join-us',
    label: '取り組み',
  },
  {
    title: 'クラウドファンディング',
    body: 'スマート農機の導入に挑戦し、佐渡の栽培技術と新しい技術を掛け合わせています。',
    image: '/images/joinus/crowdfunding-1052.webp',
    href: '/join-us',
    label: '取り組み',
  },
  {
    title: '稲刈りリトリート',
    body: '実際に佐渡へ来て、田んぼに入り、イケベジの米づくりを体験できます。',
    image: '/images/renewal/activities/harvest-retreat.webp',
    href: '/collections',
    label: '取り組み',
  },
];

type GalleryItem = {
  title: string;
  body: string;
  image: string;
  href: string;
  label: string;
};

/** ブランドの背景、note、取り組みを一つにまとめた画像ギャラリー。 */
export default async function LearnMore() {
  let articles: GalleryItem[] = [];

  if (supabase) {
    const { data } = await supabase
      .from('blog_articles')
      .select('id, title, image_url, note_url')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(4);

    articles = (data ?? []).map((article) => ({
      title: article.title as string,
      body: '日々の農作業や佐渡での暮らしを、書き手の言葉でお届けします。',
      image: (article.image_url as string) || '/images/home/parallax/sunset_riceplanting_7_800.webp',
      href: (article.note_url as string) || `/blog/${article.id}`,
      label: 'イケベジのnote',
    }));
  }

  if (articles.length === 0) {
    articles = PLACEHOLDER_TOPICS.slice(0, 4).map((article) => ({
      title: article.title,
      body: '日々の農作業や佐渡での暮らしを、書き手の言葉でお届けします。',
      image: article.image,
      href: article.href,
      label: 'イケベジのnote',
    }));
  }

  const combinedItems: GalleryItem[] = [
    ...LEARN_MORE_CARDS.map((item) => ({ ...item, href: item.href === '#' ? '/about' : item.href, label: 'イケベジを知る' })),
    ...articles,
    ...ACTIVITIES,
  ];
  // 元の複数セクションに重複していた同名コンテンツは、ギャラリー内では一枚にまとめる。
  const items = combinedItems.filter(
    (item, index) => combinedItems.findIndex((candidate) => candidate.title === item.title) === index,
  );

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-[1500px] mx-auto px-5 md:px-10">
        <FadeIn>
          <SectionHeading ja="もっと知る" />
        </FadeIn>

        <ul className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {items.map((item, i) => (
            <li key={`${item.label}-${item.title}`}>
              <FadeIn delay={Math.min(i, 3) * 70}>
              <Link
                href={item.href}
                className="group relative block aspect-[4/3] overflow-hidden bg-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hekishoku focus-visible:ring-offset-2"
                aria-label={`${item.title}：${item.body}`}
              >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 ease-out motion-reduce:transition-none group-hover:scale-[1.04] group-focus-visible:scale-[1.04]"
                  />
                <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent md:opacity-0 transition-opacity duration-300 motion-reduce:transition-none group-hover:opacity-100 group-focus-visible:opacity-100" />
                <span className="absolute inset-x-0 bottom-0 flex flex-col justify-end p-5 md:p-6 text-white md:translate-y-3 md:opacity-0 transition-all duration-300 ease-out motion-reduce:transition-none group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                  <span className="text-[11px] font-medium tracking-[0.14em] text-white/80">{item.label}</span>
                  <span className="mt-1.5 text-lg md:text-xl font-medium leading-snug">{item.title}</span>
                  <span className="mt-2 text-sm leading-relaxed text-white/90 line-clamp-2">{item.body}</span>
                  <span className="mt-4 inline-flex items-center gap-2 text-xs font-medium">
                    詳しく見る
                    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                      <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </span>
              </Link>
              </FadeIn>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
