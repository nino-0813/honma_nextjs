/**
 * サイト共通定数（SEO・JSON-LD・メタデータ用）
 */
export const SITE_NAME = 'イケベジ | 佐渡ヶ島のオーガニックファーム';
export const DEFAULT_DESCRIPTION =
  '自然栽培の考えをベースに、品種が秘めた旨みと香りをまっすぐに届けるため、島の有機資源で土を磨き上げ、農薬に頼らず育てました。新潟県佐渡産の自然栽培米を販売するIKEVEGE（イケベジ）の公式サイト。';

/** 本番の正規URL。サーバーでは process.env で動的に取得 */
export function getBaseUrl(): string {
  if (typeof window !== 'undefined') return window.location.origin;
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'https://ikevege.com';
}
