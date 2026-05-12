// Stripe Webhook handler (Next.js App Router Route Handler)
// - Verifies Stripe signature with STRIPE_WEBHOOK_SECRET
// - Idempotent via public.stripe_webhook_events (event_id)
// - Marks orders paid/failed and decrements stock atomically via RPC

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getEnv(name: string): string | undefined {
  return process.env[name];
}

function getSupabaseAdmin() {
  const url = getEnv('SUPABASE_URL') || getEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function postToGAS(payload: any) {
  const gasUrl = getEnv('GAS_URL');
  if (!gasUrl) {
    console.log('[GAS] GAS_URL is not set. Skipping GAS notification.');
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    console.log('[GAS] sending order payload', {
      gasUrl,
      order_number: payload?.order_number,
      payment_status: payload?.payment_status,
      order_status: payload?.order_status,
    });

    const resp = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const text = await resp.text().catch(() => '');
    if (!resp.ok) {
      console.error('[GAS] request failed', { status: resp.status, statusText: resp.statusText, body: text });
      return;
    }

    console.log('[GAS] request succeeded', { status: resp.status, body: text });
  } catch (err: any) {
    // MUST NOT break Stripe webhook flow
    console.error('[GAS] request error (ignored)', err?.message || err, err);
  } finally {
    clearTimeout(timeout);
  }
}

function generateOrderNumber(now = new Date()) {
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD-${year}${month}${day}-${random}`;
}

export async function POST(request: Request) {
  const stripeSecretKey = getEnv('STRIPE_SECRET_KEY');
  const webhookSecret = getEnv('STRIPE_WEBHOOK_SECRET');
  if (!stripeSecretKey || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe webhook env is missing' }, { status: 500 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY is missing' },
      { status: 500 }
    );
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) return new NextResponse('Missing stripe-signature', { status: 400 });

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeSecretKey);

    const rawBody = await request.text();
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    // Idempotency: record Stripe event id
    // NOTE:
    // - Stripe Dashboard の "Resend" は同一 event_id の再送になる。
    // - duplicate の場合でも「注文がまだ paid でないなら再処理する」。
    let isDuplicateEvent = false;
    const { error: idemErr } = await supabaseAdmin
      .from('stripe_webhook_events')
      .insert([{ event_id: event.id }]);
    if (idemErr) {
      if (String(idemErr.code) === '23505') {
        isDuplicateEvent = true;
      } else {
        console.warn('stripe_webhook_events insert error:', idemErr);
      }
    }

    if (event.type === 'payment_intent.succeeded') {
      const pi: any = event.data.object;
      const paymentIntentId = pi.id as string;
      const amountReceived = Number(pi.amount_received ?? pi.amount ?? 0);

      // 注文レコードを検索（最大3回リトライ、各1秒待機）
      let order: any = null;
      let orderErr: any = null;
      const maxRetries = 3;
      let retryCount = 0;

      while (retryCount < maxRetries && !order) {
        const result = await supabaseAdmin
          .from('orders')
          .select(
            'id, created_at, order_number, first_name, last_name, email, phone, shipping_address, shipping_city, shipping_postal_code, subtotal, shipping_cost, total, payment_status, order_status, coupon_id, notes'
          )
          .eq('payment_intent_id', paymentIntentId)
          .maybeSingle();

        orderErr = result.error;
        order = result.data;

        if (order) break;

        if (retryCount < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          retryCount++;
        } else {
          break;
        }
      }

      if (orderErr) {
        console.error('[Webhook] Order fetch error:', orderErr);
        try {
          await supabaseAdmin.from('stripe_webhook_events').delete().eq('event_id', event.id);
        } catch {}
        return NextResponse.json(
          { error: 'order_fetch_error', message: orderErr.message },
          { status: 500 }
        );
      }

      if (!order) {
        console.error('[Webhook] Order not found for payment_intent_id:', paymentIntentId, {
          amountReceived,
          eventId: event.id,
          retryCount,
        });
        return NextResponse.json({
          received: true,
          warning: 'order_not_found',
          payment_intent_id: paymentIntentId,
          message: 'Order record not found. Manual review required.',
        });
      }

      if (isDuplicateEvent && order.payment_status === 'paid') {
        return NextResponse.json({ received: true, duplicate: true, skipped: 'already_paid' });
      }

      if (Number(order.total) !== amountReceived) {
        console.error('Amount mismatch', { orderTotal: order.total, amountReceived, paymentIntentId });
      }

      const wasPaid = order.payment_status === 'paid';

      const nextOrderNumber = order.order_number || generateOrderNumber();
      const nowIso = new Date().toISOString();
      const nextNotes =
        Number(order.total) !== amountReceived
          ? `${(order as any).notes ? String((order as any).notes) + '\n' : ''}[webhook] amount_mismatch: order.total=${order.total}, pi.amount_received=${amountReceived}`
          : (order as any).notes;

      const { error: updErr } = await supabaseAdmin
        .from('orders')
        .update({
          payment_status: 'paid',
          paid_at: nowIso,
          payment_method: (pi.payment_method_types && pi.payment_method_types[0]) || 'card',
          order_number: nextOrderNumber,
          order_status: 'processing',
          notes: nextNotes ?? null,
          updated_at: nowIso,
        })
        .eq('id', order.id);
      if (updErr) throw updErr;

      // 副作用（在庫減算/GAS/クーポン）は「paidへ遷移する瞬間」にだけ実行
      if (!wasPaid) {
        try {
          const payload = {
            created_at: order.created_at,
            order_number: nextOrderNumber,
            name:
              `${order.last_name ?? ''}${order.first_name ? ` ${order.first_name}` : ''}`.trim() ||
              `${order.first_name ?? ''} ${order.last_name ?? ''}`.trim(),
            email: order.email,
            phone: order.phone,
            shipping_address: order.shipping_address,
            shipping_city: order.shipping_city,
            shipping_postal_code: order.shipping_postal_code,
            subtotal: order.subtotal,
            shipping_cost: order.shipping_cost,
            total: order.total,
            payment_status: 'paid',
            order_status: 'processing',
          };
          await postToGAS(payload);
        } catch (gasErr: any) {
          console.error('[GAS] unexpected error (ignored)', gasErr?.message || gasErr, gasErr);
        }

        const { data: items, error: itemsErr } = await supabaseAdmin
          .from('order_items')
          .select('product_id, quantity, selected_options')
          .eq('order_id', order.id);
        if (itemsErr) throw itemsErr;

        for (const it of items || []) {
          const pid = it.product_id;
          const qty = Number(it.quantity || 0);
          const selected = it.selected_options ?? null;
          if (!pid || !qty) continue;
          const { error: rpcErr } = await supabaseAdmin.rpc('decrement_product_stock', {
            p_product_id: pid,
            p_selected_options: selected,
            p_qty: qty,
          });
          if (rpcErr) {
            console.error('decrement_product_stock failed', { pid, qty, rpcErr });
          }
        }

        if (order.coupon_id) {
          const { error: couponErr } = await supabaseAdmin.rpc('increment_coupon_usage', {
            p_coupon_id: order.coupon_id,
          });
          if (couponErr) {
            console.error('increment_coupon_usage failed', { couponId: order.coupon_id, couponErr });
          }
        }
      }

      return NextResponse.json({ received: true });
    }

    if (event.type === 'payment_intent.payment_failed') {
      const pi: any = event.data.object;
      const paymentIntentId = pi.id as string;
      await supabaseAdmin
        .from('orders')
        .update({ payment_status: 'failed' })
        .eq('payment_intent_id', paymentIntentId);
      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('stripe webhook error', err);
    return new NextResponse(`Webhook Error: ${err?.message || 'unknown'}`, { status: 400 });
  }
}

export async function GET() {
  return new NextResponse('Method Not Allowed', { status: 405 });
}
