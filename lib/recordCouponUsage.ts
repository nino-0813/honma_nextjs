export async function recordCouponUsage(db: any, order: { id: string; coupon_id: string }) {
  const result = await db.rpc('record_order_coupon_usage', { p_order_id: order.id });
  // Compatibility until the order-aware guard migration is applied. Only fall
  // back on an explicitly missing function, not transient or permission failures.
  if (result.error && ['PGRST202', '42883'].includes(result.error.code)) {
    return db.rpc('increment_coupon_usage', { p_coupon_id: order.coupon_id });
  }
  return result;
}
