import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { applySubscriptionProductChange } from '@/lib/subscriptionChanges';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!url || !key || !stripeKey) return NextResponse.json({ error: 'server_not_configured' }, { status: 500 });
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const stripe = new Stripe(stripeKey);
  const { data: subs, error } = await db.from('subscriptions').select('id, stripe_subscription_id, metadata').in('status', ['active', 'trialing']);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  let applied = 0;
  const failures: string[] = [];
  for (const sub of subs || []) {
    const pending = sub.metadata?.pending_changes?.product;
    const pendingShipping = sub.metadata?.pending_changes?.shipping;
    if (pending?.apply_at && new Date(pending.apply_at).getTime() <= Date.now()) try {
      await applySubscriptionProductChange({ db, stripe, subscriptionId: sub.stripe_subscription_id, productId: pending.product_id, millingOptionId: pending.milling_option_id });
      const pendingChanges = { ...(sub.metadata?.pending_changes || {}) };
      delete pendingChanges.product;
      await db.from('subscriptions').update({
        metadata: { ...(sub.metadata || {}), pending_changes: pendingChanges, last_product_change: { ...pending, applied_at: new Date().toISOString() } },
        updated_at: new Date().toISOString(),
      }).eq('id', sub.id);
      applied++;
    } catch (e: any) {
      failures.push(`${sub.stripe_subscription_id}: ${e?.message || String(e)}`);
    }
    if (pendingShipping?.apply_at && new Date(pendingShipping.apply_at).getTime() <= Date.now()) try {
      const { data: current } = await db.from('subscriptions').select('stripe_customer_id, metadata').eq('id', sub.id).single();
      if (current?.stripe_customer_id) {
        await stripe.customers.update(current.stripe_customer_id, {
          shipping: {
            name: pendingShipping.name || 'Customer', phone: pendingShipping.phone || undefined,
            address: { postal_code: pendingShipping.postal_code, line1: pendingShipping.address, city: pendingShipping.city, country: 'JP' },
          },
        });
      }
      const { data: order } = await db.from('orders').select('id').eq('stripe_subscription_id', sub.stripe_subscription_id).order('created_at', { ascending: true }).limit(1).maybeSingle();
      if (!order) throw new Error('定期便の元注文が見つかりません');
      const { error: orderError } = await db.from('orders').update({
        shipping_name: pendingShipping.name || null, shipping_phone: pendingShipping.phone || null,
        shipping_postal_code: pendingShipping.postal_code, shipping_city: pendingShipping.city,
        shipping_address: pendingShipping.address, updated_at: new Date().toISOString(),
      }).eq('id', order.id);
      if (orderError) throw orderError;
      const pendingChanges = { ...(current?.metadata?.pending_changes || {}) };
      delete pendingChanges.shipping;
      await db.from('subscriptions').update({
        metadata: { ...(current?.metadata || {}), shipping: { ...pendingShipping, updated_at: new Date().toISOString() }, pending_changes: pendingChanges },
        updated_at: new Date().toISOString(),
      }).eq('id', sub.id);
      applied++;
    } catch (e: any) {
      failures.push(`${sub.stripe_subscription_id} shipping: ${e?.message || String(e)}`);
    }
  }
  return NextResponse.json({ checked: subs?.length || 0, applied, failures });
}
