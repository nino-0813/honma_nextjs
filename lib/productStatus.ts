import type { Product } from '@/types';

/**
 * 予約商品かどうか。
 * - scheduled_shipping_date が未設定 → 通常販売
 * - scheduled_shipping_date > 今日 → 予約商品（バッジ表示対象）
 * - scheduled_shipping_date <= 今日 → 通常販売（バッジ非表示）
 */
export function isProductPreorder(p: Product): boolean {
  if (!p.scheduledShippingDate) return false;
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const shipStr = String(p.scheduledShippingDate).slice(0, 10);
  return shipStr > todayStr;
}

/**
 * サムネイル一覧で「Sold Out」表示にすべきかどうか。
 * - product.soldOut フラグが立っていれば true
 * - バリエーション付き商品は、在庫管理ありのタイプすべてが在庫切れなら true
 * - バリエーション無し商品は stock が 0 以下なら true
 */
export function isProductSoldOut(p: Product): boolean {
  if (p.soldOut) return true;

  if (p.hasVariants && p.variants_config && p.variants_config.length > 0) {
    const managedTypes = p.variants_config.filter(
      (t) => t.stockManagement === 'individual' || t.stockManagement === 'shared'
    );
    if (managedTypes.length === 0) return false;
    return managedTypes.every((t) => {
      if (t.sharedStock !== null && t.sharedStock !== undefined) {
        return Number(t.sharedStock) <= 0;
      }
      const opts = t.options.filter((o) => o.stock !== null && o.stock !== undefined);
      if (opts.length === 0) return false;
      return opts.every((o) => Number(o.stock) <= 0);
    });
  }

  if (p.stock !== undefined && p.stock !== null) {
    return Number(p.stock) <= 0;
  }
  return false;
}
