/** Legacy contracts have no marker: never infer a new scope for them. */
export function subscriptionItemIds(metadata: any): string[] | null {
  if (metadata?.billing_group_version !== '1') return null;
  const ids = JSON.parse(metadata.source_item_ids || 'null');
  if (!Array.isArray(ids) || !ids.length || ids.some(id => typeof id !== 'string' || !id) || new Set(ids).size !== ids.length) throw new Error('定期契約の商品対応情報が不正です');
  return ids;
}
export function subscriptionSourceOrderId(metadata: any): string | null {
  return metadata?.billing_group_version === '1' && typeof metadata.order_id === 'string' && metadata.order_id ? metadata.order_id : null;
}
export function scopeSubscriptionItems<T extends { id?: string; is_subscription?: boolean }>(items: T[], metadata: any): T[] {
  const ids = subscriptionItemIds(metadata);
  if (!ids) return items;
  const scoped = items.filter(item => item.id && ids.includes(item.id) && item.is_subscription);
  if (scoped.length !== ids.length) throw new Error('定期契約の元商品明細を確認できません');
  return scoped;
}
export function subscriptionShippingCost(metadata: any): number | null {
  if (metadata?.billing_group_version !== '1') return null;
  const amount = Number(metadata.recurring_shipping_yen);
  if (!/^\d+$/.test(String(metadata.recurring_shipping_yen)) || !Number.isSafeInteger(amount) || amount < 0) throw new Error('定期契約の送料情報が不正です');
  return amount;
}
/** Keep the initial payment as one real order; scope only its item view. */
export function subscriptionOrders(sub: any, orders: any[]): any[] {
  const source = subscriptionSourceOrderId(sub.metadata);
  return orders.filter(order => order.stripe_subscription_id === sub.stripe_subscription_id || order.id === source)
    .map(order => source && order.id === source ? { ...order,
      order_items: scopeSubscriptionItems(order.order_items || [], sub.metadata), shared_initial_order: true,
    } : order).sort((a,b) => a.created_at.localeCompare(b.created_at));
}
