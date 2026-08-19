/**
 * サイト共通定数（SEO・JSON-LD・メタデータ用）
 */
export const SITE_NAME = 'イケベジ | 佐渡ヶ島のオーガニックファーム';
export const DEFAULT_DESCRIPTION =
  '自然栽培の考えをベースに、品種が秘めた旨みと香りをまっすぐに届けるため、島の有機資源で土を磨き上げ、農薬に頼らず育てました。新潟県佐渡産の自然栽培米を販売するIKEVEGE（イケベジ）の公式サイト。';

/**
 * 本番の正規URL（canonical / OGP / JSON-LD / sitemap の基準）。
 *
 * 重要: ここが Vercel のデプロイURL（*.vercel.app）になると、
 * 全ページの canonical がプレビューURLを指し、本番ドメインの検索評価が失われる。
 * そのため既定値は本番ドメイン固定とし、VERCEL_URL は preview 環境でのみ使う。
 */
export const SITE_URL = 'https://www.ikevege.com';

export function getBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  // プレビュー環境だけは自身のURLを使う（本番は必ず SITE_URL）
  if (process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return SITE_URL;
}
