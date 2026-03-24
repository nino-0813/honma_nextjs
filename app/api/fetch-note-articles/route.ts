import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPublicEnv } from '@/lib/publicEnv';

type ParsedArticle = {
  title: string;
  content: string;
  excerpt: string;
  image_url: string | null;
  note_url: string;
  published_at: string;
};

const parseRSS = (xmlText: string): ParsedArticle[] => {
  const items: ParsedArticle[] = [];
  const itemMatches = xmlText.matchAll(/<item>([\s\S]*?)<\/item>/g);

  for (const match of itemMatches) {
    const itemContent = match[1];
    const titleMatch = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/);
    const linkMatch = itemContent.match(/<link>(.*?)<\/link>/);
    const pubDateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);
    const descriptionMatch = itemContent.match(
      /<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description>(.*?)<\/description>/
    );

    let imageUrl: string | null = null;
    if (descriptionMatch) {
      const imgMatch =
        descriptionMatch[1]?.match(/<img[^>]+src=["']([^"']+)["']/) ||
        descriptionMatch[2]?.match(/<img[^>]+src=["']([^"']+)["']/);
      if (imgMatch) imageUrl = imgMatch[1];
    }

    const cleanDescription = descriptionMatch
      ? (descriptionMatch[1] || descriptionMatch[2] || '')
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .trim()
      : '';

    const excerpt = cleanDescription.substring(0, 200) + (cleanDescription.length > 200 ? '...' : '');

    if (titleMatch && linkMatch) {
      items.push({
        title: (titleMatch[1] || titleMatch[2] || '').trim(),
        content: cleanDescription,
        excerpt,
        image_url: imageUrl,
        note_url: linkMatch[1].trim(),
        published_at: pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString(),
      });
    }
  }

  return items;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rssUrl } = body;

    if (!rssUrl || typeof rssUrl !== 'string') {
      return NextResponse.json({ error: 'RSS URL is required' }, { status: 400 });
    }

    const response = await fetch(rssUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS: ${response.statusText}`);
    }

    const xmlText = await response.text();
    const articles = parseRSS(xmlText);

    if (articles.length === 0) {
      return NextResponse.json({
        count: 0,
        message: '記事が見つかりませんでした',
      });
    }

    const supabaseUrl = getPublicEnv('SUPABASE_URL');
    const supabaseKey = getPublicEnv('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase credentials not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const errors: string[] = [];

    for (const article of articles) {
      try {
        const { data: existing, error: searchError } = await supabase
          .from('blog_articles')
          .select('id')
          .eq('note_url', article.note_url)
          .maybeSingle();

        if (searchError) throw searchError;

        if (existing?.id) {
          const { error: updateError } = await supabase
            .from('blog_articles')
            .update({
              title: article.title,
              content: article.content,
              excerpt: article.excerpt,
              image_url: article.image_url,
              published_at: article.published_at,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (updateError) {
            errors.push(`記事の更新に失敗: ${article.title}`);
          }
        } else {
          const { error: insertError } = await supabase.from('blog_articles').insert({
            title: article.title,
            content: article.content,
            excerpt: article.excerpt,
            image_url: article.image_url,
            note_url: article.note_url,
            published_at: article.published_at,
            is_published: false,
          });

          if (insertError) {
            errors.push(`記事の作成に失敗: ${article.title}`);
          }
        }
      } catch {
        errors.push(`記事の処理中にエラー: ${article.title}`);
      }
    }

    return NextResponse.json({
      count: articles.length,
      saved: articles.length - errors.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `${articles.length}件の記事を処理しました（${articles.length - errors.length}件保存）`,
    });
  } catch (error) {
    console.error('Error fetching note articles:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '記事の取得に失敗しました',
      },
      { status: 500 }
    );
  }
}
