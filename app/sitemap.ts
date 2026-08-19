import type { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';
import { getBaseUrl } from '@/lib/site';

/** サイトマップは1時間ごとに再生成（商品・記事の追加を反映） */
export const revalidate = 3600;

/** 検索結果に出したい固定ページ（優先度つき） */
const STATIC_PATHS: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '/', priority: 1.0, changeFrequency: 'daily' },
  { path: '/collections', priority: 0.9, changeFrequency: 'daily' },
  { path: '/collections/rice', priority: 0.9, changeFrequency: 'daily' },
  { path: '/collections/rice/koshihikari', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/collections/rice/kamenoo', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/collections/rice/nikomaru', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/collections/rice/yearly', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/collections/crescent', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/collections/other', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/about', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/blog', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/faq', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/join-us', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/legal', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/privacy', priority: 0.2, changeFrequency: 'yearly' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getBaseUrl();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map(({ path, priority, changeFrequency }) => ({
    url: `${base}${path === '/' ? '' : path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  if (!supabase) return entries;

  // 公開中の商品ページ
  try {
    const { data: products } = await supabase
      .from('products')
      .select('handle, updated_at, is_visible, status')
      .eq('status', 'active');

    for (const p of products ?? []) {
      if (p.is_visible === false || !p.handle) continue;
      entries.push({
        url: `${base}/products/${p.handle}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : now,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  } catch {
    // 取得に失敗しても固定ページのサイトマップは返す
  }

  // 公開中のブログ記事
  try {
    const { data: articles } = await supabase
      .from('blog_articles')
      .select('id, published_at, created_at')
      .eq('is_published', true);

    for (const a of articles ?? []) {
      if (!a.id) continue;
      entries.push({
        url: `${base}/blog/${a.id}`,
        lastModified: new Date(a.published_at || a.created_at || now),
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    }
  } catch {
    // 同上
  }

  return entries;
}
