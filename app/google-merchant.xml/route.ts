import { supabase, convertDatabaseProductToProduct, type DatabaseProduct } from '@/lib/supabase';
import { isProductPreorder } from '@/lib/productStatus';
import { getBaseUrl, SITE_NAME } from '@/lib/site';
import type { Product } from '@/types';

/**
 * Google Merchant Center 用の商品フィード（RSS 2.0）
 *
 * URL: https://www.ikevege.com/google-merchant.xml
 * Merchant Center の「商品ソース > スケジュール設定された取得」にこのURLを登録する。
 *
 * /api/ 配下ではなくルート直下に置いているのは、robots.txt で /api/ を
 * Disallow しているため（Merchant Center の取得は robots.txt に従う）。
 */

/** 1時間ごとに再生成。Merchant Center の取得は1日1回で十分 */
export const revalidate = 3600;

/** GTIN/JANコードを持たないため、brand + identifier_exists=no で申告する */
const BRAND_NAME = 'イケベジ';

/** 1商品あたりのバリエーション展開数の上限（異常データでの爆発を防ぐ） */
const MAX_COMBOS_PER_PRODUCT = 50;

type Combo = {
  values: string[];
  ids: string[];
  priceDelta: number;
  inStock: boolean;
};

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** 制御文字を除去（XMLに入れると取得エラーになる） */
function stripControlChars(s: string): string {
  return s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}

/**
 * 商品説明をフィード用に整形。
 * Merchant Center は説明文中のURLを認めないため除去し、改行を詰める。
 */
function cleanDescription(raw: string | undefined, fallback: string): string {
  const text = stripControlChars(raw || '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return (text || fallback).slice(0, 5000);
}

/** id が50文字を超える場合の短縮用ハッシュ */
function shortHash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

/** バリエーションの全組み合わせを作る（種類 × 内容量 など） */
function buildCombos(p: Product): Combo[] {
  const types = (p.variants_config || []).filter((t) => t.options?.length > 0);
  const empty: Combo = { values: [], ids: [], priceDelta: 0, inStock: true };

  if (!p.hasVariants || types.length === 0) {
    return [{ ...empty, inStock: Number(p.stock ?? 0) > 0 }];
  }

  let combos: Combo[] = [empty];
  for (const t of types) {
    const next: Combo[] = [];
    for (const c of combos) {
      for (const o of t.options) {
        // 在庫の持ち方はタイプごとに異なる（共有 / 個別 / 在庫管理なし）
        const stock =
          t.stockManagement === 'none'
            ? null
            : t.stockManagement === 'shared'
              ? (t.sharedStock ?? null)
              : (o.stock ?? null);
        next.push({
          values: [...c.values, o.value],
          ids: [...c.ids, o.id],
          priceDelta: c.priceDelta + (Number(o.priceAdjustment) || 0),
          inStock: c.inStock && (stock === null || Number(stock) > 0),
        });
        if (next.length >= MAX_COMBOS_PER_PRODUCT) break;
      }
      if (next.length >= MAX_COMBOS_PER_PRODUCT) break;
    }
    combos = next;
  }
  return combos;
}

/** フィードに載せない商品を弾く。理由を返す（null なら掲載可） */
function exclusionReason(p: Product, now: Date): string | null {
  if (p.isEventTicket) return 'イベントチケット（物販ではない）';
  if (!p.image) return 'メイン画像なし';
  if (!p.price || p.price <= 0) return '価格が未設定';
  if (p.saleStartAt && new Date(p.saleStartAt) > now) return '販売開始前';
  if (p.saleEndAt && new Date(p.saleEndAt) < now) return '販売終了';
  return null;
}

export async function GET() {
  const base = getBaseUrl();
  const now = new Date();

  if (!supabase) {
    return new Response('Supabase is not configured', { status: 503 });
  }

  // RLS により active かつ表示中の商品だけが返る
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'active')
    .order('display_order', { ascending: true });

  if (error) {
    return new Response(`Failed to load products: ${error.message}`, { status: 500 });
  }

  const products = (data as DatabaseProduct[]).map(convertDatabaseProductToProduct);

  const items: string[] = [];
  const skipped: string[] = [];

  for (const p of products) {
    const reason = exclusionReason(p, now);
    if (reason) {
      skipped.push(`${p.handle}: ${reason}`);
      continue;
    }

    const combos = buildCombos(p);
    const hasVariants = combos.length > 1 || combos[0].values.length > 0;

    const link = `${base}/products/${p.handle}`;
    const description = cleanDescription(
      p.description,
      `新潟県佐渡産の${p.subcategory || p.category}「${p.title}」。イケベジ公式オンラインショップ。`
    );
    const productType = [p.category, p.subcategory].filter(Boolean).join(' > ');
    const preorder = isProductPreorder(p);
    const additionalImages = (p.images || []).filter((img) => img && img !== p.image).slice(0, 10);

    for (const combo of combos) {
      const rawId = combo.ids.length ? `${p.handle}-${combo.ids.join('-')}` : p.handle;
      const id = rawId.length <= 50 ? rawId : `${p.handle.slice(0, 30)}-${shortHash(rawId)}`;

      const title = `${p.title}${combo.values.length ? `（${combo.values.join(' / ')}）` : ''}`.slice(0, 150);
      const price = p.price + combo.priceDelta;

      // 予約商品は preorder（availability_date が必須）
      const availability = preorder
        ? 'preorder'
        : p.soldOut || !combo.inStock
          ? 'out_of_stock'
          : 'in_stock';

      const fields: string[] = [
        `<g:id>${xmlEscape(id)}</g:id>`,
        `<g:title>${xmlEscape(title)}</g:title>`,
        `<g:description>${xmlEscape(description)}</g:description>`,
        `<g:link>${xmlEscape(link)}</g:link>`,
        `<g:image_link>${xmlEscape(p.image)}</g:image_link>`,
        ...additionalImages.map((img) => `<g:additional_image_link>${xmlEscape(img)}</g:additional_image_link>`),
        `<g:availability>${availability}</g:availability>`,
        // 日本の価格は税込。products.price が税込で保存されている
        `<g:price>${price} JPY</g:price>`,
        `<g:condition>new</g:condition>`,
        `<g:brand>${xmlEscape(BRAND_NAME)}</g:brand>`,
      ];

      // JANコードは無いが自社生産品なので、SKUを MPN として申告する。
      // SKUも無い商品だけ identifier_exists=no にする（両方出すと矛盾扱いになる）
      if (p.sku) {
        fields.push(`<g:mpn>${xmlEscape(p.sku)}</g:mpn>`);
      } else {
        fields.push(`<g:identifier_exists>no</g:identifier_exists>`);
      }

      if (preorder && p.scheduledShippingDate) {
        fields.push(`<g:availability_date>${p.scheduledShippingDate}T00:00:00+09:00</g:availability_date>`);
      }
      if (productType) fields.push(`<g:product_type>${xmlEscape(productType)}</g:product_type>`);
      if (hasVariants) fields.push(`<g:item_group_id>${xmlEscape(p.handle)}</g:item_group_id>`);
      // 入札・レポートを品種単位で切れるようにしておく
      if (p.subcategory || p.category) {
        fields.push(`<g:custom_label_0>${xmlEscape(p.subcategory || p.category)}</g:custom_label_0>`);
      }

      items.push(`    <item>\n      ${fields.join('\n      ')}\n    </item>`);
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${xmlEscape(SITE_NAME)}</title>
    <link>${xmlEscape(base)}</link>
    <description>新潟県佐渡産の自然栽培米を販売するイケベジの商品フィード</description>
    <!-- generated: ${now.toISOString()} / items: ${items.length} / skipped: ${skipped.length} -->
${skipped.map((s) => `    <!-- skipped ${xmlEscape(s)} -->`).join('\n')}
${items.join('\n')}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
