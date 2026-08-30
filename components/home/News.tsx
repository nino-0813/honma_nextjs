import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import SectionHeading from './SectionHeading';
import { PLACEHOLDER_NEWS, SHOW_PLACEHOLDER_BADGE } from './placeholders';

const ROW_COUNT = 5;

type Row = { date: string; title: string; href: string; isPlaceholder?: boolean };

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * ニュース（ベースフード構成の最後尾）。
 * 即時性の高い情報を日付つきの一覧で置く。
 *
 * 注意: 現在はトピックスと同じ blog_articles を参照している。
 * 記事に種別（お知らせ / 記事）を持たせるかは未決のため、暫定で同じソース。
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
    }));
  }

  // 実記事と仮データを混ぜたうえで日付の新しい順に並べ直す
  rows = [...rows, ...PLACEHOLDER_NEWS]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, ROW_COUNT);

  return (
    <section className="py-14 md:py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading label="News" title="お知らせ" />

        <ul className="mt-7 border-t border-gray-200">
          {rows.map((r, i) => (
            <li key={`${r.title}-${i}`} className="border-b border-gray-200">
              <Link
                href={r.href}
                className="group flex flex-col md:flex-row md:items-center gap-1 md:gap-6 py-4 md:py-5"
              >
                <time className="shrink-0 text-xs text-gray-500 tabular-nums tracking-wider">
                  {formatDate(r.date)}
                </time>
                <span className="text-sm text-primary leading-relaxed group-hover:text-gray-600 transition-colors">
                  {r.title}
                  {r.isPlaceholder && SHOW_PLACEHOLDER_BADGE && (
                    <span className="ml-2 align-middle rounded-sm bg-amber-700/90 px-1.5 py-0.5 text-[9px] tracking-wider text-white">
                      仮素材
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-8 text-center">
          <Link
            href="/blog"
            className="inline-block px-8 py-3 rounded-full border border-primary text-sm tracking-wider text-primary hover:bg-primary hover:text-white transition-colors"
          >
            お知らせ一覧
          </Link>
        </div>
      </div>
    </section>
  );
}
