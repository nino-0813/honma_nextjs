import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!url || !serviceKey || !stripeKey) {
    return NextResponse.json({ error: 'server_not_configured' }, { status: 500 });
  }

  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const stripe = new Stripe(stripeKey);
  const { data: orders, error } = await db.from('orders')
    .select('id, payment_intent_id')
    .eq('payment_method', 'bank_transfer')
    .eq('payment_status', 'pending')
    .is('inventory_released_at', null)
    .lt('payment_due_at', new Date().toISOString());
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let expired = 0;
  const failures: string[] = [];
  for (const order of orders || []) {
    try {
      if (order.payment_intent_id) {
        const pi = await stripe.paymentIntents.retrieve(order.payment_intent_id);
        if (pi.status === 'succeeded') continue;
        if (pi.status !== 'canceled') await stripe.paymentIntents.cancel(pi.id);
      }
      const { error: releaseError } = await db.rpc('release_bank_transfer_order', { p_order_id: order.id });
      if (releaseError) throw releaseError;
      await db.from('orders').update({ payment_status: 'failed', order_status: 'cancelled' }).eq('id', order.id);
      expired++;
    } catch (e: any) {
      failures.push(`${order.id}: ${e?.message || String(e)}`);
    }
  }
  return NextResponse.json({ checked: orders?.length || 0, expired, failures });
}
