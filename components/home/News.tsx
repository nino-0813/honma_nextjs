import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import SectionHeading from './SectionHeading';
import { PLACEHOLDER_NEWS, SHOW_PLACEHOLDER_BADGE } from './placeholders';
import FadeIn from '@/components/FadeIn';

const ROW_COUNT = 5;

type Row = { date: string; title: string; href: string; label?: string; isPlaceholder?: boolean };

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
      .select('id, title, published_at, created_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(ROW_COUNT);

    rows = (data ?? []).map((a) => ({
      date: (a.published_at as string) || (a.created_at as string),
      title: a.title as string,
      href: `/blog/${a.id}`,
      label: 'お知らせ',
    }));
  }

  rows = [...rows, ...PLACEHOLDER_NEWS.map((n) => ({ ...n, label: 'お知らせ' }))]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, ROW_COUNT);

  return (
    <section className="pb-20 md:pb-28 bg-white">
      <div className="max-w-[1500px] mx-auto px-5 md:px-10">
        <div className="bg-secondary/40 px-6 md:px-10 py-10 md:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 lg:gap-12">
            <div className="flex flex-col gap-5">
              <FadeIn>
                <SectionHeading en="News" ja="お知らせ" />
              </FadeIn>
              <Link
                href="/blog"
                className="self-start inline-flex items-center gap-2 rounded-full border border-gray-400 bg-white px-5 py-2.5 text-xs text-primary hover:border-primary transition-colors"
              >
                すべてのお知らせを見る
                <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
                  <path d="M5 11L11 5M6 5h5v5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>

            <ul>
              {rows.map((r, i) => (
                <li key={`${r.title}-${i}`} className="border-b border-gray-300/70 first:border-t">
                  <Link href={r.href} className="group flex items-start gap-4 py-4 md:py-5">
                    <div className="flex-1 min-w-0">
                      <p className="flex items-center gap-3 text-[11px] text-gray-500">
                        <time className="tabular-nums">{formatDate(r.date)}</time>
                        {r.label && <span>{r.label}</span>}
                        {r.isPlaceholder && SHOW_PLACEHOLDER_BADGE && (
                          <span className="rounded-sm bg-yuunagi-ink/90 px-1.5 py-0.5 text-[9px] text-white">仮素材</span>
                        )}
                      </p>
                      <p className="mt-1 text-[13px] md:text-sm font-medium text-primary leading-relaxed group-hover:text-gray-600 transition-colors">
                        {r.title}
                      </p>
                    </div>
                    <svg
                      className="shrink-0 mt-1 w-3.5 h-3.5 text-gray-400 group-hover:text-primary transition-colors"
                      viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"
                    >
                      <path d="M5 11L11 5M6 5h5v5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
