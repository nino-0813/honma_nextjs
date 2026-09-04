import SectionHeading from './SectionHeading';
import { supabase } from '@/lib/supabase';
import { LEARN_MORE_CARDS, PLACEHOLDER_TOPICS } from './placeholders';
import FadeIn from '@/components/FadeIn';
import LearnMoreGallery, { type GalleryItem } from './LearnMoreGallery';

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
      <div className="max-w-[1120px] mx-auto px-10 md:px-16">
        <FadeIn>
          <SectionHeading ja="もっと知る" />
        </FadeIn>
        <LearnMoreGallery items={items} />
      </div>
    </section>
  );
}
