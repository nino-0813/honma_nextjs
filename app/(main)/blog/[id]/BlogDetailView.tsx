'use client';

import { useState, useEffect, type ReactNode } from 'react';
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

type BlockType = 'paragraph' | 'heading1' | 'heading2' | 'image' | 'bulletList' | 'numberedList' | 'quote' | 'code' | 'divider' | 'toc' | 'embed' | 'file';
interface ContentBlock {
  id?: string;
  type: BlockType;
  content?: string;
  imageUrl?: string;
  listItems?: string[];
  embedUrl?: string;
  fileUrl?: string;
  fileName?: string;
}

function renderBlockContent(content: string): ReactNode {
  if (!content?.trim()) return null;
  if (looksLikeHtml(content)) {
    return <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />;
  }
  return content;
}

function renderBlocks(blocks: ContentBlock[]): ReactNode {
  const baseClass = 'blog-prose text-sm md:text-base text-gray-700 leading-loose md:leading-relaxed';
  const headings = blocks.filter((b) => b.type === 'heading1' || b.type === 'heading2');

  return (
    <div className={`${baseClass} space-y-4`}>
      {blocks.map((block, idx) => {
        const key = (block as { id?: string }).id ?? idx;
        switch (block.type) {
          case 'heading1':
            return (
              <h2 key={key} className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4 first:mt-0">
                {renderBlockContent(block.content || '')}
              </h2>
            );
          case 'heading2':
            return (
              <h3 key={key} className="text-lg md:text-xl font-bold text-gray-900 mt-6 mb-3">
                {renderBlockContent(block.content || '')}
              </h3>
            );
          case 'image':
            if (block.imageUrl) {
              return (
                <figure key={key} className="my-6">
                  <img
                    src={block.imageUrl}
                    alt=""
                    className="max-w-full h-auto rounded-lg mx-auto w-full"
                  />
                  {block.content && (
                    <figcaption className="text-center text-sm text-gray-500 mt-2">
                      {renderBlockContent(block.content)}
                    </figcaption>
                  )}
                </figure>
              );
            }
            return null;
          case 'bulletList':
          case 'numberedList': {
            const items = block.listItems?.filter((i) => i?.trim()) ?? [];
            if (items.length === 0) return null;
            const List = block.type === 'numberedList' ? 'ol' : 'ul';
            const listClass = block.type === 'numberedList' ? 'list-decimal list-inside' : 'list-disc list-inside';
            return (
              <List key={key} className={`${listClass} my-4 space-y-1 pl-2`}>
                {items.map((item, i) => (
                  <li key={i}>{renderBlockContent(item)}</li>
                ))}
              </List>
            );
          }
          case 'quote':
            return (
              <blockquote key={key} className="border-l-4 border-gray-300 pl-4 italic my-4 text-gray-600">
                {renderBlockContent(block.content || '')}
              </blockquote>
            );
          case 'code':
            return (
              <pre key={key} className="bg-gray-800 text-gray-100 rounded-lg p-4 my-4 overflow-x-auto text-sm">
                <code>{block.content || ''}</code>
              </pre>
            );
          case 'divider':
            return <hr key={key} className="border-t border-gray-200 my-6" />;
          case 'toc':
            if (headings.length === 0) return null;
            return (
              <nav key={key} className="my-6 p-4 rounded-lg border border-gray-200 bg-gray-50">
                <p className="text-sm font-semibold text-gray-700 mb-2">目次</p>
                <ul className="space-y-1 text-sm text-gray-700">
                  {headings.map((h, i) => (
                    <li key={i} className={h.type === 'heading2' ? 'pl-4 text-gray-600' : ''}>
                      {h.content || '(無題)'}
                    </li>
                  ))}
                </ul>
              </nav>
            );
          case 'embed':
            if (block.embedUrl) {
              return (
                <div key={key} className="my-6">
                  <a href={block.embedUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">
                    {block.embedUrl}
                  </a>
                  {block.content && <p className="text-sm text-gray-500 mt-1">{block.content}</p>}
                </div>
              );
            }
            return null;
          case 'file':
            if (block.fileUrl) {
              return (
                <div key={key} className="my-6">
                  <a href={block.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">
                    {block.fileName || 'ダウンロード'}
                  </a>
                  {block.content && <p className="text-sm text-gray-500 mt-1">{block.content}</p>}
                </div>
              );
            }
            return null;
          default: {
            // paragraph
            const text = block.content?.trim();
            if (!text) return null;
            if (looksLikeHtml(text)) {
              return (
                <p
                  key={key}
                  className="leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(text) }}
                />
              );
            }
            return <p key={key} className="leading-relaxed">{text}</p>;
          }
        }
      })}
    </div>
  );
}

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
      const parsed = JSON.parse(article.content) as unknown;
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((b) => b && typeof b === 'object' && 'type' in b)) {
        contentBlock = renderBlocks(parsed as ContentBlock[]);
      } else if (Array.isArray(parsed) && parsed.length > 0) {
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
        .blog-prose a {
          display: block;
          padding: 0.75rem 1rem;
          margin: 0.75rem 0;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          background: #f9fafb;
          color: inherit;
          text-decoration: underline;
          font-weight: 600;
          transition: background 0.15s, border-color 0.15s;
        }
        .blog-prose a:hover { background: #f3f4f6; border-color: #d1d5db; }
        .blog-prose a::after {
          content: attr(href);
          display: block;
          font-size: 0.75rem;
          font-weight: 400;
          color: #6b7280;
          margin-top: 0.25rem;
          word-break: break-all;
        }
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
