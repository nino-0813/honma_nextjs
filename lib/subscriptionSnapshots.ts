/** A recurring invoice is a new shipment, never a copy of fulfillment evidence. */
export function cloneRecurringItem(item: Record<string, any>) {
  const next = { ...item };
  delete next.id;
  delete next.created_at;
  next.shipping_status = "before_shipping";
  next.shipping_carrier = null;
  next.tracking_number = null;
  return next;
}
/** Stripe metadata must not erase the application's scheduled/current contract snapshots. */
export function mergeSubscriptionMetadata(
  existing: Record<string, any> | null,
  stripe: Record<string, any> | null,
) {
  const merged = { ...(existing || {}), ...(stripe || {}) };
  for (const key of [
    "current_product",
    "pending_changes",
    "last_product_change",
    "shipping",
  ]) {
    if (existing && Object.prototype.hasOwnProperty.call(existing, key))
      merged[key] = existing[key];
    else delete merged[key];
  }
  return merged;
}

/** Compare-and-set the metadata JSON so an intervening scheduled change cannot
 * be overwritten. On repeated contention, fail instead of silently losing it. */
export async function persistSubscriptionState(
  db: any,
  id: string,
  state: Record<string, any>,
) {
  const { metadata: stripeMetadata, ...fields } = state;
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: current, error: readError } = await db
      .from("subscriptions")
      .select("metadata")
      .eq("id", id)
      .single();
    if (readError || !current)
      throw readError || new Error("Subscription not found");
    let query = db
      .from("subscriptions")
      .update({
        ...fields,
        metadata: mergeSubscriptionMetadata(current.metadata, stripeMetadata),
      })
      .eq("id", id);
    query =
      current.metadata === null
        ? query.is("metadata", null)
        : query.eq("metadata", JSON.stringify(current.metadata));
    const { data, error } = await query.select("id");
    if (error) throw error;
    if (data?.length) return;
  }
  throw new Error("Subscription metadata changed concurrently; retry sync");
}
