// Vercel Serverless Function types
type VercelRequest = {
  method?: string;
  body?: any;
  query?: Record<string, string>;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (data: any) => void;
  end: () => void;
  setHeader: (name: string, value: string) => void;
};

// RSSフィードをパースするためのシンプルな実装
const parseRSS = (xmlText: string) => {
  const items: any[] = [];
  
  // 簡易的なRSSパーサー（実際の実装ではrss-parserライブラリを使用することを推奨）
  const itemMatches = xmlText.matchAll(/<item>([\s\S]*?)<\/item>/g);
  
  for (const match of itemMatches) {
    const itemContent = match[1];
    const titleMatch = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/);
    const linkMatch = itemContent.match(/<link>(.*?)<\/link>/);
    const pubDateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);
    const descriptionMatch = itemContent.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description>(.*?)<\/description>/);
    
    // 画像URLを抽出（description内のimgタグから）
    let imageUrl = null;
    if (descriptionMatch) {
      const imgMatch = descriptionMatch[1]?.match(/<img[^>]+src=["']([^"']+)["']/) || 
                      descriptionMatch[2]?.match(/<img[^>]+src=["']([^"']+)["']/);
      if (imgMatch) {
        imageUrl = imgMatch[1];
      }
    }
    
    // HTMLタグを除去してテキストのみ抽出
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
    
    // 抜粋（最初の200文字）
    const excerpt = cleanDescription.substring(0, 200) + (cleanDescription.length > 200 ? '...' : '');
    
    if (titleMatch && linkMatch) {
      items.push({
        title: (titleMatch[1] || titleMatch[2] || '').trim(),
        content: cleanDescription,
        excerpt: excerpt,
        image_url: imageUrl,
        note_url: linkMatch[1].trim(),
        published_at: pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString(),
      });
    }
  }
  
  return items;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { rssUrl } = req.body;

  if (!rssUrl || typeof rssUrl !== 'string') {
    return res.status(400).json({ error: 'RSS URL is required' });
  }

  try {
    // RSSフィードを取得
    const response = await fetch(rssUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS: ${response.statusText}`);
    }

    const xmlText = await response.text();
    
    // RSSをパース
    const articles = parseRSS(xmlText);

    if (articles.length === 0) {
      return res.status(200).json({ 
        count: 0, 
        message: '記事が見つかりませんでした' 
      });
    }

    // Supabaseに保存（環境変数から取得）
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase credentials not configured' });
    }

    // 各記事をSupabaseに保存
    const savedCount = 0;
    const errors: string[] = [];

    for (const article of articles) {
      try {
        // note_urlで既存記事をチェック
        const checkResponse = await fetch(
          `${supabaseUrl}/rest/v1/blog_articles?note_url=eq.${encodeURIComponent(article.note_url)}&select=id`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (checkResponse.ok) {
          const existing = await checkResponse.json();
          
          if (existing && existing.length > 0) {
            // 既存記事は更新
            const updateResponse = await fetch(
              `${supabaseUrl}/rest/v1/blog_articles?id=eq.${existing[0].id}`,
              {
                method: 'PATCH',
                headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`,
                  'Content-Type': 'application/json',
                  'Prefer': 'return=minimal',
                },
                body: JSON.stringify({
                  title: article.title,
                  content: article.content,
                  excerpt: article.excerpt,
                  image_url: article.image_url,
                  published_at: article.published_at,
                  updated_at: new Date().toISOString(),
                }),
              }
            );

            if (!updateResponse.ok) {
              errors.push(`記事の更新に失敗: ${article.title}`);
            }
          } else {
            // 新規記事は作成
            const insertResponse = await fetch(
              `${supabaseUrl}/rest/v1/blog_articles`,
              {
                method: 'POST',
                headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`,
                  'Content-Type': 'application/json',
                  'Prefer': 'return=minimal',
                },
                body: JSON.stringify({
                  title: article.title,
                  content: article.content,
                  excerpt: article.excerpt,
                  image_url: article.image_url,
                  note_url: article.note_url,
                  published_at: article.published_at,
                  is_published: false, // デフォルトで非公開
                }),
              }
            );

            if (!insertResponse.ok) {
              errors.push(`記事の作成に失敗: ${article.title}`);
            }
          }
        }
      } catch (error) {
        errors.push(`記事の処理中にエラー: ${article.title}`);
      }
    }

    return res.status(200).json({
      count: articles.length,
      saved: articles.length - errors.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `${articles.length}件の記事を処理しました（${articles.length - errors.length}件保存）`,
    });
  } catch (error) {
    console.error('Error fetching note articles:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : '記事の取得に失敗しました',
    });
  }
}

