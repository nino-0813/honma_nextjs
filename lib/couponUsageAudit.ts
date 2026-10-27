// The counter is historical: cancellation/refund must not subtract a prior use.
export function couponUsageAudit(orders: any[]) {
  const counts = new Map<string, Set<string>>();
  for (const order of orders) {
    if (!order.coupon_id || !order.id || !(order.paid_at || ['paid', 'refunded'].includes(order.payment_status))) continue;
    const set = counts.get(order.coupon_id) || new Set<string>();
    set.add(order.id); counts.set(order.coupon_id, set);
  }
  return Object.fromEntries([...counts].map(([id, ids]) => [id, ids.size]));
}
