import type { CartItem, EventMileTransaction, Product } from '@/types';
import { supabase } from '@/lib/supabase';

/**
 * カート内の商品から、付与予定マイル数を計算する。
 *
 * ルール（オーナー合意済み）:
 * - 商品ごとに mile_earn_rate (%) が設定されている
 * - 「送料込みの注文合計」に対して「カート内商品の最大 mile_earn_rate」を掛ける
 *   例: お米10% + その他5% が混在 → 全体に 10% 適用
 * - カート内に対象商品が一つも無い場合は 0
 * - 端数は小数点以下切り捨て
 */
export function calculateEarnableMiles(
  cartItems: Pick<CartItem, 'product' | 'quantity' | 'finalPrice'>[],
  shippingCost: number = 0
): number {
  if (!cartItems || cartItems.length === 0) return 0;

  // 商品ごとの最大付与率を求める
  let maxRate = 0;
  let hasTarget = false;
  for (const item of cartItems) {
    const rate = Number(item.product?.mileEarnRate ?? 0);
    if (rate > 0) {
      hasTarget = true;
      if (rate > maxRate) maxRate = rate;
    }
  }
  if (!hasTarget || maxRate <= 0) return 0;

  // カートの商品代金合計
  const itemsSubtotal = cartItems.reduce((sum, it) => {
    const unit = it.finalPrice ?? it.product.price;
    return sum + unit * it.quantity;
  }, 0);

  const totalAmount = itemsSubtotal + Math.max(0, shippingCost);
  const miles = Math.floor((totalAmount * maxRate) / 100);
  return Math.max(0, miles);
}

/** カート内にイベントチケット商品が含まれているか */
export function cartHasEventTicket(
  cartItems: Pick<CartItem, 'product'>[]
): boolean {
  return cartItems.some((it) => Boolean(it.product?.isEventTicket));
}

/** カートが「全てイベントチケット商品」かどうか */
export function cartIsAllEventTickets(
  cartItems: Pick<CartItem, 'product'>[]
): boolean {
  if (cartItems.length === 0) return false;
  return cartItems.every((it) => Boolean(it.product?.isEventTicket));
}

/** 単一商品の付与予定マイル（商品ページ表示用、送料抜き、quantity=1） */
export function productEarnableMilesPreview(product: Product): number {
  const rate = Number(product?.mileEarnRate ?? 0);
  if (rate <= 0) return 0;
  return Math.floor((product.price * rate) / 100);
}

/** プロフィールから現在のマイル残高を取得 */
export async function getEventMileBalance(userId: string): Promise<number> {
  if (!supabase) return 0;
  const { data, error } = await supabase
    .from('profiles')
    .select('event_mile_balance')
    .eq('id', userId)
    .single();
  if (error || !data) return 0;
  const raw = (data as any).event_mile_balance;
  return Math.max(0, Math.round(Number(raw ?? 0)));
}

/** 自分のマイル取引履歴を取得（新しい順） */
export async function getEventMileTransactions(
  userId: string,
  limit: number = 50
): Promise<EventMileTransaction[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('event_mile_transactions')
    .select('*')
    .eq('auth_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as EventMileTransaction[];
}
