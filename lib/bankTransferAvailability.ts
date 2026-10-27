export async function bankTransferAllowed(db: any, items: any[], metadata: any): Promise<boolean> {
  if (!db || !Array.isArray(items) || !items.length || metadata?.type === 'subscription_init' ||
    items.some(i => i.purchaseType === 'subscription' || i.is_subscription || !i.product_id)) return false;
  const ids = [...new Set(items.map(i => i.product_id))];
  const { data, error } = await db.from('products').select('id,bank_transfer_disabled').in('id', ids);
  // On missing migration / failed lookup, offer cards only, never bypass a restriction.
  return !error && data?.length === ids.length && data.every((p: any) => p.bank_transfer_disabled === false);
}
