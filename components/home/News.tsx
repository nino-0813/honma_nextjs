import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import SectionHeading from './SectionHeading';
import { PLACEHOLDER_NEWS, SHOW_PLACEHOLDER_BADGE } from './placeholders';
import FadeIn from '@/components/FadeIn';

const ROW_COUNT = 5;

type Row = { date: string; title: string; href: string; image?: string; label?: string; isPlaceholder?: boolean };

const FALLBACK_IMAGES = [
  '/images/home/parallax/sunset_riceplanting_7_800.webp',
  '/images/about/stories/about_story_taue_123.webp',
  '/images/joinus/sadokids-fieldwork.jpg',
];

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

/**
 * お知らせ（ベースフードの News に相当）。
 * グレーの面で囲い、左に見出しと一覧ボタン、右に日付つきの行を並べる。
 *
 * 注意: 現在はトピックスと同じ blog_articles を参照している。
 * 記事に種別を持たせるかは未決のため暫定。
 */
export default async function News() {
  let rows: Row[] = [];

  if (supabase) {
    const { data } = await supabase
      .from('blog_articles')
      .select('id, title, image_url, published_at, created_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(ROW_COUNT);

    rows = (data ?? []).map((a) => ({
      date: (a.published_at as string) || (a.created_at as string),
      title: a.title as string,
      href: `/blog/${a.id}`,
      image: (a.image_url as string) || undefined,
      label: 'お知らせ',
    }));
  }

  rows = [...rows, ...PLACEHOLDER_NEWS.map((n) => ({ ...n, label: 'お知らせ' }))]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, ROW_COUNT);

  return (
    <section className="bg-white py-24 md:py-36">
      <div className="mx-auto max-w-[1180px] px-6 md:px-12">
          <div className="relative grid grid-cols-1 gap-12 lg:grid-cols-[260px_1fr] lg:gap-16">
            <div className="flex flex-col gap-6">
              <FadeIn>
                <SectionHeading en="Journal" ja="イケベジ便り" />
              </FadeIn>
              <Link
                href="/blog"
                className="inline-flex min-h-12 self-start items-center gap-2 rounded-full border border-gray-400 bg-white px-6 py-3 text-xs text-primary transition-colors hover:border-primary"
              >
                すべてのお知らせを見る
                <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
                  <path d="M5 11L11 5M6 5h5v5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>

            <ul className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2">
              {rows.map((r, i) => (
                <li key={`${r.title}-${i}`}>
                  <FadeIn delay={Math.min(i, 3) * 60}>
                  <Link href={r.href} className="group grid grid-cols-[120px_1fr] items-start gap-5 border-b border-gray-200 pb-7">
                    <div className="aspect-[4/3] overflow-hidden rounded-[14px] bg-dim">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r.image || FALLBACK_IMAGES[i % FALLBACK_IMAGES.length]} alt="" aria-hidden="true" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                    </div>
                    <div className="min-w-0">
                      <p className="flex items-center gap-3 text-[11px] text-gray-500">
                        <time className="tabular-nums">{formatDate(r.date)}</time>
                        {r.label && <span>{r.label}</span>}
                        {r.isPlaceholder && SHOW_PLACEHOLDER_BADGE && (
                          <span className="rounded-sm bg-yuunagi-ink/90 px-1.5 py-0.5 text-[9px] text-white">仮素材</span>
                        )}
                      </p>
                      <p className="mt-2 text-[13px] font-medium leading-relaxed text-primary transition-colors group-hover:text-hekishoku md:text-sm">
                        {r.title}
                      </p>
                    </div>
                  </Link>
                  </FadeIn>
                </li>
              ))}
            </ul>
          </div>
      </div>
    </section>
  );
}
