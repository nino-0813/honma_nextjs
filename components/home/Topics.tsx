import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import SectionHeading from './SectionHeading';
import Carousel from '@/components/Carousel';
import PlaceholderBadge from './PlaceholderBadge';
import { PLACEHOLDER_TOPICS, type TopicCard } from './placeholders';

const CARD_COUNT = 6;

function formatDate(v?: string) {
  if (!v) return '';
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? ''
    : `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * トピックス。
 * 左に見出し、右に横スクロールのカード（ベースフードと同じ2カラム構成）。
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
      date: (a.published_at as string) || (a.created_at as string),
      image: (a.image_url as string) || '/images/home/parallax/sunset_riceplanting_7_800.webp',
      href: `/blog/${a.id}`,
    }));
  }

  cards = [...cards, ...PLACEHOLDER_TOPICS].slice(0, CARD_COUNT);

  return (
    <section className="py-20 md:py-28 lg:min-h-screen lg:flex lg:items-center bg-white">
      <div className="w-full max-w-[1500px] mx-auto px-5 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-10 lg:gap-16">
          <div className="lg:pt-2">
            <SectionHeading
              en="Topics"
              ja="トピックス"
              description="新商品やキャンペーンのお知らせ、佐渡の田んぼの様子をお届けします。"
            />
          </div>

          <Carousel ariaLabel="トピックス">
            {cards.map((c, i) => (
              <li key={`${c.title}-${i}`} className="snap-start shrink-0 w-[280px] md:w-[380px] lg:w-[420px]">
                <Link href={c.href} className="group block">
                  <div className="relative aspect-[4/3] overflow-hidden bg-dim">
                    {c.isPlaceholder && <PlaceholderBadge />}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.image}
                      alt={c.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="mt-4 text-sm md:text-base font-medium text-primary leading-relaxed line-clamp-2 group-hover:text-gray-600 transition-colors">
                    {c.title}
                  </h3>
                  {c.date && (
                    <time className="mt-1.5 block text-xs text-gray-400 tabular-nums">{formatDate(c.date)}</time>
                  )}
                </Link>
              </li>
            ))}
          </Carousel>
        </div>
      </div>
    </section>
  );
}
