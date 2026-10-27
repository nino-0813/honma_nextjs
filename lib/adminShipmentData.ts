import { computeFirstShippingDate, computeNextShippingDate } from './subscriptionShipping';
export const jstDay = (d: Date) => Number.isFinite(d.getTime()) ? new Date(d.getTime() + 9 * 3600000).toISOString().slice(0, 10) : '';
export function shipmentDay(sub: any) {
  if (!['active', 'trialing', 'past_due', 'unpaid'].includes(sub.status)) return null;
  const date = computeNextShippingDate({ ...sub, firstShippingOverride: sub.metadata?.first_shipping_override });
  return date && Number.isFinite(date.getTime()) ? jstDay(date) : null;
}
export function orderShipmentDay(order: any, sub: any, firstOrderId: string) {
  if (order.id === firstOrderId) return jstDay(computeFirstShippingDate(new Date(order.created_at), sub.metadata?.first_shipping_override));
  // A delayed payment can arrive in another shipping month. Never identify a
  // recurring shipment from payment/creation date alone.
  return typeof order.subscription_shipping_date === 'string' ? order.subscription_shipping_date.slice(0, 10) : null;
}
export function shipmentOrders(sub: any, orders: any[]) {
  const day = shipmentDay(sub);
  if (!day) return [];
  const related = orders.filter(o => o.stripe_subscription_id === sub.stripe_subscription_id).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const first = related[0]?.id;
  return related.filter(o => o.order_status !== 'cancelled' && o.order_status !== 'shipped' &&
    !(o.order_items?.length && o.order_items.every((i: any) => i.shipping_status === 'shipped')) &&
    orderShipmentDay(o, sub, first) === day);
}
export function shipmentHasShipped(sub: any, orders: any[]) {
  const related = orders.filter(o => o.stripe_subscription_id === sub.stripe_subscription_id).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const day = shipmentDay(sub);
  return Boolean(day && related.some(o => orderShipmentDay(o, sub, related[0]?.id) === day &&
    (o.order_status === 'shipped' || o.order_items?.length && o.order_items.every((i: any) => i.shipping_status === 'shipped'))));
}
export function nextShipmentProduct(sub: any, orders: any[]) {
  const current = sub.metadata?.current_product;
  if (current?.product_title) return `${current.product_title}${current.variant ? ` / ${current.variant}` : ''}`;
  const original = orders.filter(o => o.stripe_subscription_id === sub.stripe_subscription_id).sort((a, b) => a.created_at.localeCompare(b.created_at))[0];
  return (original?.order_items || []).filter((i: any) => i.is_subscription).map((i: any) => `${i.product_title}${i.variant ? ` / ${i.variant}` : ''}`).join('・') || '商品情報未登録';
}
export function csvText(rows: Record<string, unknown>[]) {
  const keys = Object.keys(rows[0] || {});
  const cell = (v: unknown) => {
    let text = String(v ?? '');
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };
  return '\ufeff' + [keys.map(cell).join(','), ...rows.map(r => keys.map(k => cell(r[k])).join(','))].join('\r\n');
}
