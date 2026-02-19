'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { FadeInImage } from '@/components/UI';

interface BlogArticle {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  image_url?: string;
  note_url?: string;
  published_at?: string;
  created_at: string;
}

export default function BlogPage() {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchArticles = async () => {
      if (!supabase) {
        setError('データの取得に失敗しました');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const { data, error: fetchError } = await supabase
          .from('blog_articles')
          .select('*')
          .eq('is_published', true)
          .order('published_at', { ascending: false })
          .order('created_at', { ascending: false });
        if (fetchError) throw fetchError;
        setArticles(data || []);
      } catch (err) {
        console.error('記事の取得に失敗しました:', err);
        setError('記事の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="pt-28 pb-24 min-h-screen bg-white overflow-x-hidden w-full">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <div className="mb-12 text-center">
          <h1 className="text-xl md:text-2xl font-serif tracking-[0.15em] font-normal mb-4">BLOG</h1>
        </div>
        {loading && (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4" />
            <p className="text-gray-500">読み込み中...</p>
          </div>
        )}
        {error && (
          <div className="text-center py-16">
            <p className="text-red-500">{error}</p>
          </div>
        )}
        {!loading && !error && articles.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500">ブログ記事は準備中です。</p>
          </div>
        )}
        {!loading && !error && articles.length > 0 && (
          <div className="grid gap-8 md:gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/blog/${article.id}`}
                className="group block h-full rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="aspect-[4/3] overflow-hidden bg-gray-50">
                  {article.image_url ? (
                    <FadeInImage
                      src={article.image_url}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      width={400}
                      height={300}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-50" />
                  )}
                </div>
                <div className="px-4 pt-4 pb-5 flex flex-col gap-3">
                  {article.published_at && (
                    <time className="text-xs text-gray-500">{formatDate(article.published_at)}</time>
                  )}
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-gray-700 transition-colors" style={{ fontFamily: '"Helvetica Neue", "Hiragino Sans", "Hiragino Kaku Gothic ProN", Arial, "Noto Sans JP", Meiryo, sans-serif' }}>
                    {article.title}
                  </h2>
                  {article.excerpt && (
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{article.excerpt}</p>
                  )}
                  <div className="text-sm text-primary font-medium mt-auto">続きを読む →</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
