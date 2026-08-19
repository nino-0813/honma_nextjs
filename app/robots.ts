import type { MetadataRoute } from 'next';
import { getBaseUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  const base = getBaseUrl();
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // 検索結果に出す必要がなく、クロール予算を浪費するパス
        disallow: ['/admin', '/api/', '/mypage', '/account', '/checkout', '/coming-soon'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
