import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Carousel from '@/components/Carousel';
import { PLACEHOLDER_TOPICS } from './placeholders';
import FadeIn from '@/components/FadeIn';

/**
 * note の記事セクション（ベースフードの「BASE FOOD note」に相当）。
 * グレーの面で囲い、左に説明、右に記事カルーセルを置く。
 *
 * blog_articles には note_url 列があるので、外部のnote記事もここに出せる。
 */
export default async function NoteSection() {
  let items: { title: string; date: string; image: string; href: string; isPlaceholder?: boolean }[] = [];

  if (supabase) {
    const { data } = await supabase
      .from('blog_articles')
      .select('id, title, image_url, note_url, published_at, created_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(6);

    items = (data ?? []).map((a) => ({
      title: a.title as string,
      date: (a.published_at as string) || (a.created_at as string),
      image: (a.image_url as string) || '/images/home/parallax/sunset_riceplanting_7_800.webp',
      href: (a.note_url as string) || `/blog/${a.id}`,
    }));
  }

  items = [
    ...items,
    ...PLACEHOLDER_TOPICS.map((t) => ({
      title: t.title,
      date: t.date ?? '',
      image: t.image,
      href: t.href,
      isPlaceholder: true,
    })),
  ].slice(0, 6);

  const fmt = (v: string) => {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <section className="pb-20 md:pb-28 bg-white">
      <div className="max-w-[1500px] mx-auto px-5 md:px-10">
        <div className="bg-secondary/40 px-6 md:px-10 py-10 md:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-10 lg:gap-16">
            <FadeIn className="flex flex-col gap-4">
              <p className="text-xl md:text-2xl font-serif tracking-wider text-primary">
                イケベジの
                <span className="italic font-normal"> note</span>
              </p>
              <p className="text-[12px] md:text-[13px] text-gray-600 leading-loose">
                日々の農作業や佐渡での暮らし、なぜこの育て方を選んでいるのかを、書き手の言葉でお届けしています。
              </p>
              <Link
                href="/blog"
                className="self-start inline-flex items-center gap-2 rounded-full border border-gray-400 bg-white px-5 py-2.5 text-xs text-primary hover:border-primary transition-colors"
              >
                すべての記事を見る
                <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
                  <path d="M5 11L11 5M6 5h5v5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </FadeIn>

            <FadeIn delay={80}>
            <Carousel ariaLabel="noteの記事">
              {items.map((a, i) => (
                <li key={`${a.title}-${i}`} className="snap-start shrink-0 w-[260px] md:w-[340px]">
                  <Link href={a.href} className="group block">
                    <div className="relative aspect-[16/10] overflow-hidden bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={a.image}
                        alt={a.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <h3 className="mt-3 text-[13px] font-medium text-primary leading-relaxed line-clamp-2">
                      {a.title}
                    </h3>
                    {a.date && <time className="mt-1 block text-[11px] text-gray-500">{fmt(a.date)}</time>}
                  </Link>
                </li>
              ))}
            </Carousel>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}
