/**
 * JSON-LD 構造化データ（SEO・リッチリザルト用）
 * https://developers.google.com/search/docs/appearance/structured-data
 */

import { getBaseUrl } from './site';
import type { Product } from '@/types';

const BASE = getBaseUrl();

/** Organization（サイト全体で1回） */
export function jsonLdOrganization() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'IKEVEGE（イケベジ）',
    url: BASE,
    logo: `${BASE}/favicon.webp`,
    description:
      '新潟県佐渡産の自然栽培米を販売。自然栽培の考えをベースに、品種が秘めた旨みと香りをまっすぐに届けます。',
    address: {
      '@type': 'PostalAddress',
      addressRegion: '新潟県',
      addressLocality: '佐渡市',
    },
  };
}

/** WebSite（検索ボックス等のリッチリザルト用） */
export function jsonLdWebSite() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'イケベジ | 佐渡ヶ島のオーガニックファーム',
    url: BASE,
    description: '新潟県佐渡産の自然栽培米を販売するIKEVEGE（イケベジ）の公式サイト。',
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${BASE}/collections?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

/** Product（商品詳細ページ用） */
export function jsonLdProduct(product: Product, canonicalPath: string) {
  const url = `${BASE}${canonicalPath}`;
  const image = product.image?.startsWith('http') ? product.image : `${BASE}${product.image}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description || undefined,
    image: [image, ...(product.images || []).map((img) => (img.startsWith('http') ? img : `${BASE}${img}`))],
    url,
    sku: product.sku || product.id,
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'JPY',
      price: product.price,
      availability: product.soldOut
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
    },
  };
}

/** BreadcrumbList（パンくず用） */
export function jsonLdBreadcrumb(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${BASE}${item.path}`,
    })),
  };
}

/** Article / BlogPosting（ブログ記事用） */
export function jsonLdArticle(params: {
  title: string;
  description?: string;
  image?: string;
  publishedAt?: string;
  modifiedAt?: string;
  url: string;
}) {
  const { title, description, image, publishedAt, modifiedAt, url } = params;
  const fullUrl = url.startsWith('http') ? url : `${BASE}${url}`;
  const imageUrl = image?.startsWith('http') ? image : image ? `${BASE}${image}` : undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description || undefined,
    image: imageUrl,
    datePublished: publishedAt,
    dateModified: modifiedAt || publishedAt,
    url: fullUrl,
    publisher: {
      '@type': 'Organization',
      name: 'IKEVEGE（イケベジ）',
      logo: { '@type': 'ImageObject', url: `${BASE}/favicon.webp` },
    },
  };
}

