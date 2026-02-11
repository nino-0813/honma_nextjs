'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { FadeInImage } from '@/components/UI';
import { IconArrowLeft } from '@/components/Icons';

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

type BlogArticleCard = Pick<BlogArticle, 'id' | 'title' | 'image_url' | 'published_at' | 'excerpt' | 'created_at'>;

const rewriteIkevegeUrl = (url: string) => {
  if (!url) return url;
  return url.replace(/online\.ikevege\.com/gi, 'www.ikevege.com');
};

const sanitizeHtml = (rawHtml: string) => {
  if (!rawHtml) return '';
  let html = rawHtml;
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  html = html.replace(/\son\w+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, '');
  html = html.replace(/\s(href|src)\s*=\s*("javascript:[^"]*"|'javascript:[^']*')/gi, '');
  return html;
};

const looksLikeHtml = (value: string) => /<[^>]+>/.test(value);

export default function BlogDetailView({
  articleId,
  article: initialArticle,
  isUnpublished,
}: {
  articleId: string;
  article: BlogArticle | null;
  isUnpublished?: boolean;
}) {
  const [article, setArticle] = useState<BlogArticle | null>(initialArticle ?? null);
  const [loading, setLoading] = useState(!initialArticle && !isUnpublished);
  const [recommendedArticles, setRecommendedArticles] = useState<BlogArticleCard[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [articleId]);

  useEffect(() => {
    if (initialArticle) {
      setArticle(initialArticle);
      setLoading(false);
      return;
    }
    if (isUnpublished) {
      setLoading(false);
      return;
    }
    const fetchArticle = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data } = await supabase.from('blog_articles').select('*').eq('id', articleId).eq('is_published', true).single();
      setArticle(data || null);
      setLoading(false);
    };
    fetchArticle();
  }, [articleId, initialArticle, isUnpublished]);

  useEffect(() => {
    if (!article?.id) return;
    const run = async () => {
      if (!supabase) return;
      const { data } = await supabase
        .from('blog_articles')
        .select('id, title, image_url, published_at, excerpt, created_at')
        .neq('id', article.id)
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(20);
      if (data && data.length > 0) {
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        setRecommendedArticles(shuffled.slice(0, 3));
      }
    };
    run();
  }, [article?.id]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="pt-28 pb-24 min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4" />
            <p className="text-gray-500">読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isUnpublished) {
    return (
      <div className="pt-28 pb-24 min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <div className="text-center py-16">
            <p className="text-red-500 mb-4">この記事は非公開です</p>
            <Link href="/blog" className="text-primary hover:underline">BLOG一覧に戻る</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="pt-28 pb-24 min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <div className="text-center py-16">
            <p className="text-red-500 mb-4">記事が見つかりませんでした</p>
            <Link href="/blog" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <IconArrowLeft className="w-4 h-4" />
              BLOG一覧に戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }

  let contentBlock: React.ReactNode;
  if (!article.content) {
    contentBlock = <p className="text-gray-500">コンテンツがありません</p>;
  } else {
    try {
      const parsed = JSON.parse(article.content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        contentBlock = (
          <div
            className="blog-prose prose prose-slate text-sm md:text-base max-w-none text-gray-700 leading-loose md:leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(
                parsed
                  .map((b: { content?: string; text?: string }) => b?.content || b?.text || '')
                  .filter(Boolean)
                  .join('<p></p>')
              ),
            }}
          />
        );
      } else {
        contentBlock = looksLikeHtml(article.content) ? (
          <div
            className="blog-prose prose prose-slate text-sm md:text-base max-w-none text-gray-700 leading-loose md:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}
          />
        ) : (
          <div className="blog-prose text-sm md:text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
            {article.content}
          </div>
        );
      }
    } catch {
      contentBlock = looksLikeHtml(article.content) ? (
        <div
          className="blog-prose prose prose-slate text-sm md:text-base max-w-none text-gray-700 leading-loose md:leading-relaxed"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}
        />
      ) : (
        <div className="blog-prose text-sm md:text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
          {article.content}
        </div>
      );
    }
  }

  return (
    <div className="pt-20 md:pt-28 pb-24 min-h-screen bg-white">
      <style>{`
        .blog-prose { font-family: "Helvetica Neue", "Hiragino Sans", "Hiragino Kaku Gothic ProN", Arial, "Noto Sans JP", Meiryo, sans-serif; }
        .blog-prose img { max-width: 100%; height: auto; margin: 1rem 0; border-radius: 0.75rem; }
        .blog-prose a { color: inherit; text-decoration: underline; }
      `}</style>
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 md:mb-8 transition-colors"
        >
          <IconArrowLeft className="w-4 h-4" />
          <span>BLOG一覧に戻る</span>
        </Link>
        <article>
          {article.image_url && (
            <div className="mb-6 md:mb-8 -mx-6 md:mx-0 h-auto md:h-[60vh] overflow-hidden bg-gray-100 rounded-none md:rounded-lg">
              <FadeInImage
                src={article.image_url}
                alt={article.title}
                className="w-full h-full min-h-[200px] md:min-h-[60vh] object-contain md:object-cover object-center"
                width={896}
                height={504}
              />
            </div>
          )}
          <div className="mb-4 md:mb-6">
            {article.published_at && (
              <time className="text-xs md:text-sm text-gray-500 tracking-wide">
                {formatDate(article.published_at)}
              </time>
            )}
          </div>
          <h1
            className="text-xl md:text-4xl font-medium text-gray-900 mb-6 md:mb-8 leading-snug md:leading-tight"
            style={{ fontFamily: '"Helvetica Neue", "Hiragino Sans", "Hiragino Kaku Gothic ProN", Arial, "Noto Sans JP", Meiryo, sans-serif' }}
          >
            {article.title}
          </h1>
          <div className="blog-prose">{contentBlock}</div>
          {article.note_url && (
            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-2">この記事はnoteでも公開されています</p>
              <a
                href={rewriteIkevegeUrl(article.note_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm"
              >
                noteで見る →
              </a>
            </div>
          )}
        </article>
        {recommendedArticles.length > 0 && (
          <section className="mt-16 md:mt-20 pt-12 border-t border-gray-200">
            <h2 className="text-xl md:text-2xl font-medium text-gray-900 mb-8" style={{ fontFamily: '"Helvetica Neue", "Hiragino Sans", "Hiragino Kaku Gothic ProN", Arial, "Noto Sans JP", Meiryo, sans-serif' }}>
              おすすめの記事
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
              {recommendedArticles.map((rec, index) => (
                <Link
                  key={rec.id}
                  href={`/blog/${rec.id}`}
                  className={`block group hover:opacity-80 transition-opacity ${index === 2 ? 'hidden md:block' : ''}`}
                >
                  {rec.image_url && (
                    <div className="mb-4 aspect-video overflow-hidden rounded-lg bg-gray-100 relative">
                      <FadeInImage
                        src={rec.image_url}
                        alt={rec.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        width={400}
                        height={225}
                      />
                    </div>
                  )}
                  <h3 className="text-sm md:text-base font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-gray-600 transition-colors" style={{ fontFamily: '"Helvetica Neue", "Hiragino Sans", "Hiragino Kaku Gothic ProN", Arial, "Noto Sans JP", Meiryo, sans-serif' }}>
                    {rec.title}
                  </h3>
                  {rec.published_at && <time className="text-xs text-gray-500">{formatDate(rec.published_at)}</time>}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
