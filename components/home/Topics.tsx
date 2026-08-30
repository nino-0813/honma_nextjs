import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import SectionHeading from './SectionHeading';
import PlaceholderBadge from './PlaceholderBadge';
import { PLACEHOLDER_TOPICS, type TopicCard } from './placeholders';

/** 表示するカード枚数。足りない分は仮カードで埋める */
const CARD_COUNT = 4;

/**
 * トピックス（ベースフード構成の2番目）。
 * お知らせ・記事・お得情報を横スクロールのカードで見せる。
 * 要件上は「選んだ自分はセンスがいい」と感じてもらう場。
 */
export default async function Topics() {
  let cards: TopicCard[] = [];

  if (supabase) {
    const { data } = await supabase
      .from('blog_articles')
      .select('id, title, image_url, published_at, created_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(CARD_COUNT);

    cards = (data ?? []).map((a) => ({
      title: a.title as string,
      label: '記事',
      image: (a.image_url as string) || '/images/home/parallax/sunset_riceplanting_7_800.webp',
      href: `/blog/${a.id}`,
    }));
  }

  // 記事が足りない分は仮カードで埋める
  cards = [...cards, ...PLACEHOLDER_TOPICS].slice(0, CARD_COUNT);

  return (
    <section className="py-14 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4 mb-8">
          <SectionHeading
            label="Topics"
            title="トピックス"
            description="新商品やキャンペーンのお知らせ、佐渡の田んぼの様子をお届けします。"
          />
          <Link
            href="/blog"
            className="hidden md:inline-block shrink-0 text-xs tracking-wider text-gray-600 border-b border-gray-300 pb-0.5 hover:text-primary hover:border-primary transition-colors"
          >
            すべて見る
          </Link>
        </div>

        {/* 横スクロール（ベースフードと同じ見せ方） */}
        <div className="-mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 overflow-x-auto scrollbar-hide">
          <ul className="flex gap-4 md:gap-6 snap-x snap-mandatory">
            {cards.map((c, i) => (
              <li key={`${c.title}-${i}`} className="snap-start shrink-0 w-[260px] md:w-[320px]">
                <Link href={c.href} className="group block">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-dim">
                    {c.isPlaceholder && <PlaceholderBadge />}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.image}
                      alt={c.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <p className="mt-3 text-[10px] tracking-[0.15em] text-amber-700 uppercase">{c.label}</p>
                  <h3 className="mt-1 text-sm md:text-[15px] text-primary leading-relaxed line-clamp-2 group-hover:text-gray-600 transition-colors">
                    {c.title}
                  </h3>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <Link
          href="/blog"
          className="md:hidden mt-6 block text-center text-xs tracking-wider text-gray-600 border border-gray-300 rounded-full py-3 hover:border-primary transition-colors"
        >
          すべて見る
        </Link>
      </div>
    </section>
  );
}
