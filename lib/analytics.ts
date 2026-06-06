/**
 * GA4 eコマースイベント送信用のヘルパー
 *
 * 使い方:
 *   import { trackViewItem, trackAddToCart, trackPurchase } from '@/lib/analytics';
 *   trackViewItem(product);
 *
 * 設計方針:
 *  - window.gtag が無ければ noop（SSR・開発時のNo-tagケースで安全）
 *  - 同じ payload で何度も呼ばれることを想定し、呼び出し側で重複排除すること
 *  - GA4 標準イベント名/パラメータ仕様に準拠（推奨イベント）
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

const CURRENCY = 'JPY';

/** 共通: gtag が読み込まれていれば送信 */
function send(eventName: string, params: Record<string, any>): void {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') return;
  try {
    window.gtag('event', eventName, params);
  } catch (e) {
    // 計測失敗はサイレントに（ユーザー体験に影響させない）
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[analytics]', eventName, e);
    }
  }
}

/** GA4 が期待する item の最小ペイロード */
export interface AnalyticsItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  item_category?: string;
  item_variant?: string;
  /** subscription / one_time */
  item_brand?: string;
}

/** 商品データから GA4 アイテム形式に変換するヘルパー */
export function toAnalyticsItem(args: {
  id: string;
  title: string;
  price: number;
  quantity?: number;
  category?: string | null;
  variant?: string | null;
  brand?: string | null;
}): AnalyticsItem {
  return {
    item_id: args.id,
    item_name: args.title,
    price: Math.round(args.price),
    quantity: Math.max(1, Math.round(args.quantity ?? 1)),
    ...(args.category ? { item_category: args.category } : {}),
    ...(args.variant ? { item_variant: args.variant } : {}),
    ...(args.brand ? { item_brand: args.brand } : {}),
  };
}

/** 商品詳細ページ閲覧 */
export function trackViewItem(items: AnalyticsItem[], value?: number): void {
  send('view_item', {
    currency: CURRENCY,
    value: value ?? items.reduce((sum, it) => sum + it.price * it.quantity, 0),
    items,
  });
}

/** カート追加 */
export function trackAddToCart(items: AnalyticsItem[], value?: number): void {
  send('add_to_cart', {
    currency: CURRENCY,
    value: value ?? items.reduce((sum, it) => sum + it.price * it.quantity, 0),
    items,
  });
}

/** カートドロワー表示 */
export function trackViewCart(items: AnalyticsItem[], value?: number): void {
  send('view_cart', {
    currency: CURRENCY,
    value: value ?? items.reduce((sum, it) => sum + it.price * it.quantity, 0),
    items,
  });
}

/** カートから削除 */
export function trackRemoveFromCart(items: AnalyticsItem[], value?: number): void {
  send('remove_from_cart', {
    currency: CURRENCY,
    value: value ?? items.reduce((sum, it) => sum + it.price * it.quantity, 0),
    items,
  });
}

/** チェックアウト開始 */
export function trackBeginCheckout(
  items: AnalyticsItem[],
  value?: number,
  couponCode?: string | null,
): void {
  send('begin_checkout', {
    currency: CURRENCY,
    value: value ?? items.reduce((sum, it) => sum + it.price * it.quantity, 0),
    items,
    ...(couponCode ? { coupon: couponCode } : {}),
  });
}

/** 決済成功（注文確定） */
export function trackPurchase(args: {
  transactionId: string;
  value: number;
  items: AnalyticsItem[];
  shipping?: number;
  tax?: number;
  couponCode?: string | null;
}): void {
  send('purchase', {
    transaction_id: args.transactionId,
    currency: CURRENCY,
    value: Math.round(args.value),
    ...(typeof args.shipping === 'number' ? { shipping: Math.round(args.shipping) } : {}),
    ...(typeof args.tax === 'number' ? { tax: Math.round(args.tax) } : {}),
    ...(args.couponCode ? { coupon: args.couponCode } : {}),
    items: args.items,
  });
}
