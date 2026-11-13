import { createHash } from 'node:crypto';
import { computeBillingCycleAnchor, computeFirstShippingDate } from './subscriptionShipping';
import { datedShipmentShippingPlan } from './shippingRates';
type Item = { id: string; product_id: string; product_title: string; product_price: number; quantity: number; is_subscription: boolean };
export type BillingGroup = { key: string; firstShipping: string; anchor: number; items: Item[]; shipping: number; subscriptionId?: string; planCreatedAt?: number };
const day = (date: Date) => new Date(date.getTime() + 9 * 3600000).toISOString().slice(0, 10);

export function buildBillingGroups(items: Item[], products: any[], checkout: Date, interval: string, shipping: number): BillingGroup[] {
  if (interval === 'weekly' || interval === 'biweekly') return [];
  if (!Number.isSafeInteger(shipping) || shipping < 0) throw new Error('Invalid recurring shipping');
  const byProduct = new Map(products.map(product => [product.id, product]));
  const groups = new Map<string, Item[]>();
  const seen = new Set<string>();
  for (const item of [...items].sort((a,b) => a.id.localeCompare(b.id))) {
    if (!item.id || seen.has(item.id) || !byProduct.has(item.product_id) || !Number.isSafeInteger(item.product_price) || item.product_price <= 0 || !Number.isSafeInteger(item.quantity) || item.quantity <= 0) throw new Error('Invalid subscription source item');
    seen.add(item.id);
    const first = day(computeFirstShippingDate(checkout, byProduct.get(item.product_id).first_shipping_override_date));
    groups.set(first, [...(groups.get(first) || []), item]);
  }
  const result: BillingGroup[] = [];
  for (const [firstShipping, entries] of [...groups].sort(([a],[b]) => a.localeCompare(b))) {
    let chunk: Item[] = [];
    const flush = () => {
      if (!chunk.length) return;
      const ids = chunk.map(item => item.id);
      const key = createHash('sha256').update(JSON.stringify([interval, firstShipping, ids])).digest('hex').slice(0,24);
      const anchor = computeBillingCycleAnchor(checkout, interval, firstShipping);
      if (!anchor) throw new Error('Missing billing anchor');
      result.push({ key, firstShipping, anchor, items: chunk, shipping: 0 }); chunk = [];
    };
    // Stripe metadata values have a 500-character limit.
    for (const item of entries) {
      if (chunk.length >= 8 || JSON.stringify([...chunk, item].map(entry => entry.id)).length > 320) flush();
      chunk.push(item);
      if (JSON.stringify(chunk.map(entry => entry.id)).length > 500) throw new Error('Item scope exceeds Stripe metadata limit');
    }
    flush();
  }
  const weights = result.map(group => group.items.reduce((sum,item) => sum + item.product_price * item.quantity, 0));
  const total = weights.reduce((a,b) => a+b,0);
  if (!Number.isSafeInteger(total) || total <= 0) throw new Error('Invalid subscription total');
  return result;
}

export async function quoteBillingGroupShipping(db: any, order: any, groups: BillingGroup[], products: any[]) {
  const prefecture = [order.shipping_address,order.shipping_city].map(value => String(value || '').trim().match(/^(北海道|東京都|京都府|大阪府|.{2,3}県)/)?.[0]).find(Boolean);
  if (!prefecture) throw new Error('配送先の都道府県を確認できません');
  const { data: rows,error } = await db.from('product_shipping_methods').select('product_id,shipping_method_id').in('product_id',products.map(product => product.id));
  if (error || !rows) throw error || new Error('配送方法の対応を取得できません');
  const links: Record<string,string[]> = {};
  for (const row of rows) links[row.product_id] = [...(links[row.product_id] || []),row.shipping_method_id];
  const ids = [...new Set(rows.map((row: any) => row.shipping_method_id))];
  let methods: any[] = [];
  if (ids.length) {
    const result = await db.from('shipping_methods').select('*').in('id',ids);
    if (result.error || !result.data) throw result.error || new Error('送料を取得できません');
    methods = result.data;
  }
  const byProduct = new Map(products.map(product => [product.id,product]));
  const plan = datedShipmentShippingPlan(groups.flatMap(group => group.items.map(item => ({ firstShipping:group.firstShipping,product_id:item.product_id,title:item.product_title,quantity:item.quantity,free:Boolean(byProduct.get(item.product_id)?.is_free_shipping) }))),links,methods,prefecture);
  for (const shipment of plan.shipments) {
    const sameDay = groups.filter(group => group.firstShipping === shipment.firstShipping);
    // Metadata-size chunks still represent one shipment: never charge its postage twice.
    const weights = sameDay.map(group => group.items.reduce((sum,item) => sum+item.product_price*item.quantity,0));
    const total = weights.reduce((sum,weight) => sum+weight,0);
    sameDay.forEach((group,index) => { group.shipping = Math.floor(shipment.totalCost * weights[index]/total); });
    let rest = shipment.totalCost-sameDay.reduce((sum,group) => sum+group.shipping,0);
    for (const group of sameDay) if (rest-- > 0) group.shipping++;
  }
}

const fingerprint = (items: Item[], interval: string, shipping: number) => createHash('sha256').update(JSON.stringify([
  interval, shipping, [...items].sort((a,b) => a.id.localeCompare(b.id)).map(item => [item.id,item.product_id,item.product_title,item.product_price,item.quantity]),
])).digest('hex');
const packed = (group: BillingGroup) => JSON.stringify({ key: group.key, first: group.firstShipping, anchor: group.anchor,
  ids: group.items.map(item => item.id), shipping: group.shipping, ...(group.subscriptionId ? { sub: group.subscriptionId } : {}) });

/** Snapshot the complete plan on the original PI before creating anything billable.
 * A retry reads this plan rather than today's product shipping settings. */
export async function freezeBillingGroups(stripe: any, pi: any, groups: BillingGroup[], interval: string, shipping: number, quote: () => Promise<void>): Promise<BillingGroup[] | null> {
  const current = await stripe.paymentIntents.retrieve(pi.id);
  const metadata = current.metadata || {};
  const items = groups.flatMap(group => group.items);
  const hash = fingerprint(items, interval, shipping);
  if (metadata.split_plan_version === '1') {
    const count = Number(metadata.split_plan_count);
    const started = Number(metadata.split_plan_started);
    if (!Number.isInteger(count) || count < 1 || count > 40 || !Number.isFinite(started) || metadata.split_plan_fingerprint !== hash) throw new Error('保存済み請求計画との照合が必要です');
    const mapped = new Map(items.map(item => [item.id,item]));
    const seen = new Set<string>();
    const restored = Array.from({length:count}, (_,index) => {
      const saved = JSON.parse(metadata[`split_plan_${index}`] || 'null');
      if (!saved || typeof saved.key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(saved.first) || !Number.isSafeInteger(saved.anchor) || !Number.isSafeInteger(saved.shipping) || saved.shipping < 0 || !Array.isArray(saved.ids) || !saved.ids.length || (saved.sub != null && (typeof saved.sub !== 'string' || !saved.sub.startsWith('sub_')))) throw new Error('Invalid saved billing group');
      const members = saved.ids.map((id: string) => {
        if (!mapped.has(id) || seen.has(id)) throw new Error('Invalid saved item membership');
        seen.add(id);return mapped.get(id)!;
      });
      if (computeBillingCycleAnchor(new Date(pi.created * 1000), interval, saved.first) !== saved.anchor) throw new Error('Invalid saved anchor');
      return { key:saved.key, firstShipping:saved.first, anchor:saved.anchor, items:members, shipping:saved.shipping, subscriptionId:saved.sub, planCreatedAt:started };
    });
    if (seen.size !== items.length) throw new Error('Invalid saved billing totals');
    return restored;
  }
  if (new Set(groups.map(group => group.firstShipping)).size <= 1) return null;
  await quote();
  if (groups.reduce((sum,group) => sum+group.shipping,0) !== shipping) throw new Error('決済時の発送別送料と一致しないため手動確認が必要です');
  const started = Date.now();
  if (started - pi.created * 1000 > 23 * 3600000) throw new Error('初回決済から時間が経過しているため手動確認が必要です');
  const plan: Record<string,string> = { split_plan_version:'1', split_plan_count:String(groups.length), split_plan_started:String(started), split_plan_fingerprint:hash };
  groups.forEach((group,index) => { plan[`split_plan_${index}`] = packed(group); group.planCreatedAt = started; });
  if (groups.length > 40 || Object.values(plan).some(value => value.length > 500) || new Set([...Object.keys(metadata),...Object.keys(plan)]).size > 50) throw new Error('請求計画が保存上限を超えています');
  await stripe.paymentIntents.update(pi.id, { metadata:plan }, { idempotencyKey:`split-plan-v1:${pi.id}` });
  return groups;
}

/** Stable create keys let partial failures retry without making duplicate contracts. */
export async function createBillingGroups(stripe: any, db: any, pi: any, order: any, groups: BillingGroup[], recurring: any, now = new Date()) {
  if (groups.some(group => !group.subscriptionId && (group.anchor * 1000 <= now.getTime() || !group.planCreatedAt || now.getTime() - group.planCreatedAt > 23 * 3600000))) throw new Error('安全な再実行期間を過ぎたため手動確認が必要です');
  const created: string[] = [];
  for (const [index,group] of groups.entries()) {
    if (group.subscriptionId) { created.push(group.subscriptionId);continue; }
    const prefix = `split-subscription-v1:${pi.id}:${group.key}`;
    const entries: any[] = [];
    for (const item of group.items) {
      const product = await stripe.products.create({ name: item.product_title.slice(0,250), metadata: { product_id: item.product_id, source: 'ikevege_subscription' } }, { idempotencyKey: `${prefix}:item:${item.id}` });
      entries.push({ quantity: item.quantity, price_data: { currency: 'jpy', product: product.id, unit_amount: item.product_price, recurring } });
    }
    if (group.shipping > 0) {
      const product = await stripe.products.create({ name: '送料', metadata: { product_id: '__shipping__', source: 'ikevege_subscription' } }, { idempotencyKey: `${prefix}:shipping` });
      entries.push({ quantity: 1, price_data: { currency: 'jpy', product: product.id, unit_amount: group.shipping, recurring } });
    }
    const subscription = await stripe.subscriptions.create({
      customer: pi.customer, default_payment_method: pi.payment_method, items: entries, trial_end: group.anchor,
      metadata: { billing_group_version: '1', billing_group_key: group.key, order_id: String(order.id),
        source_item_ids: JSON.stringify(group.items.map(item => item.id)), recurring_shipping_yen: String(group.shipping),
        auth_user_id: String(order.auth_user_id || ''), first_payment_intent_id: String(pi.id),
        first_shipping_override: group.firstShipping, interval: String(order.subscription_interval || pi.metadata.interval) },
    }, { idempotencyKey: `${prefix}:contract` });
    group.subscriptionId = subscription.id;
    await stripe.paymentIntents.update(pi.id, { metadata:{ [`split_plan_${index}`]:packed(group) } }, { idempotencyKey:`${prefix}:record` });
    created.push(subscription.id);
  }
  const { error } = await db.from('orders').update({ stripe_subscription_id: created[0], stripe_customer_id: pi.customer,
    subscription_interval: order.subscription_interval || pi.metadata.interval, updated_at: now.toISOString() }).eq('id',order.id);
  if (error) throw error;
  return created;
}
