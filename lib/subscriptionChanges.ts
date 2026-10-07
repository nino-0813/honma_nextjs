import Stripe from 'stripe';

export type PendingProductChange = {
  product_id: string;
  milling_option_id: string;
  effective_shipping_date: string;
  apply_at: string;
  requested_at: string;
};

const weightOf = (title: string) => title.match(/(\d+(?:\.\d+)?)\s*kg/i)?.[1] ?? null;

export async function applySubscriptionProductChange(args: {
  db: any;
  stripe: Stripe;
  subscriptionId: string;
  productId: string;
  millingOptionId: string;
}) {
  const { db, stripe, subscriptionId, productId, millingOptionId } = args;
  const { data: subscriptionRow, error: subscriptionError } = await db.from('subscriptions')
    .select('id, metadata').eq('stripe_subscription_id', subscriptionId).maybeSingle();
  if (subscriptionError || !subscriptionRow) throw new Error('定期便の契約情報が見つかりません');
  const { data: firstOrder, error: orderError } = await db.from('orders')
    .select('id')
    .eq('stripe_subscription_id', subscriptionId)
    .order('created_at', { ascending: true }).limit(1).maybeSingle();
  if (orderError || !firstOrder) throw new Error('定期便の元注文が見つかりません');

  const { data: currentItem, error: itemError } = await db.from('order_items')
    .select('*').eq('order_id', firstOrder.id).eq('is_subscription', true).limit(1).maybeSingle();
  if (itemError || !currentItem) throw new Error('定期便の商品が見つかりません');

  const { data: product, error: productError } = await db.from('products')
    .select('id, title, price, image, images, variants_config, subscription_discount_percent, subscription_enabled, status, is_active')
    .eq('id', productId).maybeSingle();
  if (productError || !product || product.status !== 'active' || product.is_active === false || product.subscription_enabled === false) {
    throw new Error('選択した商品は定期便に利用できません');
  }
  const currentTitle = subscriptionRow.metadata?.current_product?.product_title || currentItem.product_title;
  if (!weightOf(currentTitle) || weightOf(currentTitle) !== weightOf(product.title)) {
    throw new Error('重量変更は現在準備中です。同じ重量の商品を選択してください');
  }

  const variantTypes = Array.isArray(product.variants_config) ? product.variants_config : [];
  const millingType = variantTypes.find((v: any) =>
    String(v?.name || v?.label || '').includes('種類') || String(v?.name || v?.label || '').includes('精米'));
  const milling = millingType?.options?.find((o: any) => String(o.id) === millingOptionId);
  if (!millingType || !milling) throw new Error('精米区分が見つかりません');

  const discount = Math.max(0, Number(product.subscription_discount_percent || 0));
  const unitAmount = Math.round((Number(product.price) + Number(milling.priceAdjustment || 0)) * (1 - discount / 100));
  if (unitAmount <= 0) throw new Error('商品価格が不正です');

  const sub: any = await stripe.subscriptions.retrieve(subscriptionId, { expand: ['items.data.price.product'] });
  const stripeItem = sub.items.data.find((item: any) => {
    const stripeProduct: any = item.price.product;
    return stripeProduct?.metadata?.product_id !== '__shipping__';
  });
  if (!stripeItem) throw new Error('Stripeの商品明細が見つかりません');
  const recurring = stripeItem.price.recurring;
  if (!recurring) throw new Error('Stripeの定期価格が不正です');

  const newStripeProduct = await stripe.products.create({
    name: String(product.title).slice(0, 250),
    metadata: { product_id: product.id, source: 'ikevege_subscription' },
  });
  const newPrice = await stripe.prices.create({
    product: newStripeProduct.id,
    unit_amount: unitAmount,
    currency: 'jpy',
    recurring: { interval: recurring.interval, interval_count: recurring.interval_count },
  });

  // Stripeが失敗した場合、この後のDB変更には進まない。
  await stripe.subscriptions.update(subscriptionId, {
    items: [{ id: stripeItem.id, price: newPrice.id, quantity: currentItem.quantity || 1 }],
    proration_behavior: 'none',
  });

  const selectedOptions = {
    ...(subscriptionRow.metadata?.current_product?.selected_options || currentItem.selected_options || {}),
    [millingType.id]: milling.id,
  };
  const quantity = Math.max(1, Number(subscriptionRow.metadata?.current_product?.quantity || currentItem.quantity || 1));
  const lineTotal = unitAmount * quantity;
  const currentProduct = {
    product_id: product.id,
    product_title: product.title,
    product_price: unitAmount,
    product_image: product.image || product.images?.[0] || null,
    variant: milling.label || milling.name || milling.value || milling.id,
    selected_options: selectedOptions,
    quantity,
    line_total: lineTotal,
    updated_at: new Date().toISOString(),
  };
  // 過去の注文履歴は書き換えず、今後の請求・注文に使う契約スナップショットを更新する。
  const { error: updateSubscriptionError } = await db.from('subscriptions').update({
    metadata: { ...(subscriptionRow.metadata || {}), current_product: currentProduct },
    updated_at: new Date().toISOString(),
  }).eq('id', subscriptionRow.id);
  if (updateSubscriptionError) {
    await stripe.subscriptions.update(subscriptionId, {
      items: [{ id: stripeItem.id, price: stripeItem.price.id, quantity: stripeItem.quantity || 1 }],
      proration_behavior: 'none',
    });
    throw updateSubscriptionError;
  }
  return { product, milling, unitAmount, currentProduct };
}
