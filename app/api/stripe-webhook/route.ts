// Stripe Webhook handler (Next.js App Router Route Handler)
// - Verifies Stripe signature with STRIPE_WEBHOOK_SECRET
// - Idempotent via public.stripe_webhook_events (event_id)
// - Marks orders paid/failed and decrements stock atomically via RPC

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { computeBillingCycleAnchor, intervalToMonths } from '@/lib/subscriptionShipping';

type SubscriptionIntervalKey =
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'bimonthly'
  | 'quarterly'
  | 'semiannual'
  | 'annual';

const STRIPE_INTERVAL_MAP: Record<SubscriptionIntervalKey, { interval: 'day' | 'week' | 'month' | 'year'; interval_count: number }> = {
  weekly: { interval: 'week', interval_count: 1 },
  biweekly: { interval: 'week', interval_count: 2 },
  monthly: { interval: 'month', interval_count: 1 },
  bimonthly: { interval: 'month', interval_count: 2 },
  quarterly: { interval: 'month', interval_count: 3 },
  semiannual: { interval: 'month', interval_count: 6 },
  annual: { interval: 'year', interval_count: 1 },
};

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

/**
 * 初回決済成功後に Stripe Subscription を遅延作成する。
 *
 * - billing_cycle_anchor を「2回目決済日」（10日ルール）に設定
 * - trial_end を anchor と同じにして、anchor まで自動請求が走らないようにする
 * - 1回目の決済は別途完了済み（このwebhookのトリガー）
 * - default_payment_method をPaymentIntentから引き継ぐ
 * - metadata.auth_user_id を持たせ、subscription.created webhookでフォールバック可能に
 *
 * 失敗してもこのwebhookハンドラ全体は壊さない（ログのみ）。
 * 失敗時の影響: お客さんは初回分は決済済み・発送される。Subscriptionが無いので2回目以降が来ない。
 *   → 管理画面で気付いて手動で復旧する想定。
 */
async function createDeferredSubscription(
  stripe: any,
  supabaseAdmin: any,
  pi: any,
  order: any
) {
  const logCtx = { orderId: order?.id, paymentIntentId: pi?.id };
  try {
    // 1) Customer / PaymentMethod 検証
    if (!pi?.customer) {
      console.error('[DeferredSub] PI に customer がありません', logCtx);
      return;
    }
    if (!pi?.payment_method) {
      console.error('[DeferredSub] PI に payment_method がありません', logCtx);
      return;
    }

    // 2) interval を決定（order.subscription_interval を優先、なければ pi.metadata.interval）
    const intervalKey = String(
      order?.subscription_interval || pi?.metadata?.interval || ''
    ) as SubscriptionIntervalKey;
    if (!STRIPE_INTERVAL_MAP[intervalKey]) {
      console.error('[DeferredSub] interval が不正', { ...logCtx, interval: intervalKey });
      return;
    }
    const recurring = STRIPE_INTERVAL_MAP[intervalKey];

    // 3) order_items から定期購入アイテムを取得（is_subscription=true）
    const { data: orderItems, error: itemsErr } = await supabaseAdmin
      .from('order_items')
      .select('product_id, product_title, product_price, quantity, is_subscription')
      .eq('order_id', order.id);
    if (itemsErr) {
      console.error('[DeferredSub] order_items 取得失敗', { ...logCtx, err: itemsErr });
      return;
    }
    const subItems = (orderItems || []).filter((it: any) => Boolean(it.is_subscription));
    if (subItems.length === 0) {
      console.error('[DeferredSub] 注文に定期購入アイテムがありません', logCtx);
      return;
    }

    // 4) Stripe Product / Price (recurring) を作成
    const stripeItems: any[] = [];
    for (const it of subItems) {
      const unitPrice = Math.round(Number(it.product_price || 0));
      if (unitPrice <= 0) {
        console.error('[DeferredSub] アイテム単価が無効', { ...logCtx, item: it });
        continue;
      }
      const product = await stripe.products.create({
        name: String(it.product_title || '商品').slice(0, 250),
        metadata: {
          product_id: String(it.product_id || ''),
          source: 'ikevege_subscription',
        },
      });
      stripeItems.push({
        quantity: Math.max(1, Number(it.quantity || 1)),
        price_data: {
          currency: 'jpy',
          product: product.id,
          unit_amount: unitPrice,
          recurring,
        },
      });
    }
    if (stripeItems.length === 0) {
      console.error('[DeferredSub] 有効なアイテムが0件になりました', logCtx);
      return;
    }

    // 5) 送料も毎回 recurring 請求として追加
    const shippingCost = Math.max(0, Number(order.shipping_cost || 0));
    if (shippingCost > 0) {
      const shippingProduct = await stripe.products.create({
        name: '送料',
        metadata: { product_id: '__shipping__', source: 'ikevege_subscription' },
      });
      stripeItems.push({
        quantity: 1,
        price_data: {
          currency: 'jpy',
          product: shippingProduct.id,
          unit_amount: Math.round(shippingCost),
          recurring,
        },
      });
    }

    // 6) billing_cycle_anchor を計算（2回目決済日 = JST 10日 05:00）
    //    products テーブルから first_shipping_override_date を取得して anchor 計算に反映する
    const checkoutDate = new Date((pi?.created ?? Math.floor(Date.now() / 1000)) * 1000);
    let firstShippingOverride: string | null = null;
    try {
      const productIds = Array.from(
        new Set(subItems.map((it: any) => it.product_id).filter((v: any) => typeof v === 'string' && v.length > 0))
      );
      if (productIds.length > 0) {
        const { data: prods } = await supabaseAdmin
          .from('products')
          .select('id, first_shipping_override_date')
          .in('id', productIds);
        const overrides = (prods || [])
          .map((p: any) => (typeof p.first_shipping_override_date === 'string' ? p.first_shipping_override_date.slice(0, 10) : null))
          .filter((d: any): d is string => Boolean(d));
        if (overrides.length > 0) {
          // 複数商品の場合は最も遅い日を採用
          overrides.sort();
          firstShippingOverride = overrides[overrides.length - 1];
        }
      }
    } catch (e) {
      console.warn('[DeferredSub] override 取得失敗（フォールバックして15日ルールで継続）', e);
    }
    const anchorUnix = computeBillingCycleAnchor(checkoutDate, intervalKey, firstShippingOverride);

    // 7) Subscription を作成
    //
    // ※ Stripe仕様: billing_cycle_anchor と trial_end を同時指定すると proration 必須になり
    //   proration_behavior='none' と矛盾してエラーになる。
    //   解決策: trial_end のみを指定すれば Stripe は trial_end を起点に請求サイクルを開始する。
    //   trial_end=「次の10日 05:00 JST」だと、その日から毎月10日 05:00 JST に自動請求が走る。
    const subscriptionParams: any = {
      customer: pi.customer,
      items: stripeItems,
      default_payment_method: pi.payment_method,
      metadata: {
        interval: intervalKey,
        auth_user_id: String(order.auth_user_id || ''),
        order_id: String(order.id || ''),
        first_payment_intent_id: String(pi.id || ''),
        ...(firstShippingOverride ? { first_shipping_override: firstShippingOverride } : {}),
      },
    };
    if (anchorUnix) {
      subscriptionParams.trial_end = anchorUnix;
    }

    console.log('[DeferredSub] 作成パラメータ', {
      ...logCtx,
      interval: intervalKey,
      itemsCount: stripeItems.length,
      anchorUnix,
      customer: pi.customer,
      paymentMethod: pi.payment_method,
    });

    const subscription = await stripe.subscriptions.create(subscriptionParams);

    // 8) orders に stripe_subscription_id を保存
    const updates: any = {
      stripe_subscription_id: subscription.id,
      stripe_customer_id: pi.customer,
      updated_at: new Date().toISOString(),
    };
    if (!order.subscription_interval) {
      updates.subscription_interval = intervalKey;
    }
    const { error: updErr } = await supabaseAdmin
      .from('orders')
      .update(updates)
      .eq('id', order.id);
    if (updErr) {
      console.error('[DeferredSub] order 更新エラー', { ...logCtx, err: updErr });
    }

    console.log('[DeferredSub] 作成成功', {
      ...logCtx,
      subscriptionId: subscription.id,
      interval: intervalKey,
      status: subscription.status,
    });
  } catch (e: any) {
    // Stripe API のエラー詳細を全部出す（type/code/raw も含む）
    console.error('[DeferredSub] 作成失敗', {
      ...logCtx,
      message: e?.message,
      type: e?.type,
      code: e?.code,
      decline_code: e?.decline_code,
      raw: e?.raw,
      stack: e?.stack,
    });
  }
}

/**
 * 注文に対してイベントマイルを付与する（ログインユーザーのみ）。
 *
 * - 同一 order_id に対する 'earn' 履歴があれば再付与しない（idempotent）
 * - 計算式: (subtotal + shipping_cost) × カート内最大 mile_earn_rate / 100
 * - event_miles_used が指定されている場合は先に 'use' 履歴を記録して残高を引き落とす
 * - 失敗してもwebhook全体のレスポンスは止めない（ログ出力のみ）
 */
async function grantEventMilesForOrder(supabaseAdmin: any, orderId: string) {
  try {
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('id, auth_user_id, subtotal, shipping_cost, event_miles_used')
      .eq('id', orderId)
      .maybeSingle();
    if (orderErr || !order) {
      console.warn('[EventMile] order not found', orderId, orderErr);
      return;
    }
    if (!order.auth_user_id) {
      console.log('[EventMile] guest order, no miles granted', orderId);
      return;
    }

    // 多重実行ガード
    const { data: existingEarn } = await supabaseAdmin
      .from('event_mile_transactions')
      .select('id')
      .eq('order_id', orderId)
      .eq('type', 'earn')
      .maybeSingle();
    if (existingEarn) {
      console.log('[EventMile] already granted, skipping', orderId);
      return;
    }

    // 注文明細 + 商品の mile_earn_rate を集計
    const { data: items } = await supabaseAdmin
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', orderId);
    if (!items || items.length === 0) {
      console.log('[EventMile] no order_items', orderId);
      return;
    }

    const productIds = Array.from(
      new Set(items.map((it: any) => it.product_id).filter((v: any): v is string => !!v))
    );
    let maxRate = 0;
    if (productIds.length > 0) {
      const { data: products } = await supabaseAdmin
        .from('products')
        .select('id, mile_earn_rate')
        .in('id', productIds);
      const rateById: Record<string, number> = {};
      (products || []).forEach((p: any) => {
        rateById[p.id] = Math.max(0, Math.min(100, Math.round(Number(p.mile_earn_rate ?? 0))));
      });
      for (const it of items) {
        const rate = rateById[it.product_id] ?? 0;
        if (rate > maxRate) maxRate = rate;
      }
    }

    // 現在の残高を取得
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('event_mile_balance')
      .eq('id', order.auth_user_id)
      .maybeSingle();
    const currentBalance = Math.max(0, Math.round(Number(profile?.event_mile_balance ?? 0)));

    // (a) 利用マイル（注文で指定されていれば残高から引き落とし）
    const milesRequested = Math.max(0, Math.round(Number(order.event_miles_used ?? 0)));
    let runningBalance = currentBalance;
    if (milesRequested > 0) {
      const actualUse = Math.min(milesRequested, runningBalance);
      if (actualUse < milesRequested) {
        console.error('[EventMile] insufficient balance for use', {
          orderId,
          milesRequested,
          currentBalance,
          actualUse,
        });
      }
      if (actualUse > 0) {
        runningBalance -= actualUse;
        await supabaseAdmin.from('event_mile_transactions').insert([
          {
            auth_user_id: order.auth_user_id,
            order_id: orderId,
            type: 'use',
            amount: -actualUse,
            balance_after: runningBalance,
            description:
              actualUse < milesRequested
                ? `イベントチケット購入で利用（残高不足のため${actualUse}マイルのみ）`
                : 'イベントチケット購入で利用',
          },
        ]);
      }
    }

    // (b) 付与マイル: (subtotal + shipping_cost) × maxRate%
    if (maxRate > 0) {
      const grossAmount = Number(order.subtotal ?? 0) + Number(order.shipping_cost ?? 0);
      const milesToGrant = grossAmount > 0 ? Math.floor((grossAmount * maxRate) / 100) : 0;
      if (milesToGrant > 0) {
        runningBalance += milesToGrant;
        await supabaseAdmin.from('event_mile_transactions').insert([
          {
            auth_user_id: order.auth_user_id,
            order_id: orderId,
            type: 'earn',
            amount: milesToGrant,
            balance_after: runningBalance,
            description: `ご注文の購入特典マイル（付与率 ${maxRate}%）`,
          },
        ]);
      }
    }

    // (c) profile残高を最終値に更新（earn/useの結果合算）
    if (runningBalance !== currentBalance) {
      const { error: balErr } = await supabaseAdmin
        .from('profiles')
        .update({ event_mile_balance: runningBalance })
        .eq('id', order.auth_user_id);
      if (balErr) {
        console.error('[EventMile] update balance error', balErr);
      } else {
        console.log('[EventMile] granted/used', {
          orderId,
          before: currentBalance,
          after: runningBalance,
          delta: runningBalance - currentBalance,
        });
      }
    }
  } catch (e: any) {
    // 失敗してもwebhook全体は壊さない
    console.error('[EventMile] grant error (ignored)', e?.message || e);
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
            'id, created_at, order_number, first_name, last_name, email, phone, shipping_address, shipping_city, shipping_postal_code, subtotal, shipping_cost, total, payment_status, order_status, coupon_id, notes, auth_user_id, stripe_subscription_id, subscription_interval'
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

        // イベントマイル付与（ログインユーザーかつ対象商品が含まれる場合）
        await grantEventMilesForOrder(supabaseAdmin, order.id);

        // 定期購入の場合: ここで初めて Stripe Subscription を作成する
        if (pi?.metadata?.type === 'subscription_init' && !order.stripe_subscription_id) {
          await createDeferredSubscription(stripe, supabaseAdmin, pi, order);
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

    // ============================================================
    // 定期購入: Subscription ライフサイクル
    // ============================================================
    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated'
    ) {
      const sub: any = event.data.object;
      const stripeSubscriptionId = sub.id as string;
      const stripeCustomerId = sub.customer as string;
      const status = sub.status as string;
      const intervalFromMeta = sub.metadata?.interval || null;
      // 新しい Stripe API では current_period_end は subscription item 側にある
      const periodEndUnix =
        sub.current_period_end ??
        sub.items?.data?.[0]?.current_period_end ??
        null;
      const currentPeriodEnd = periodEndUnix
        ? new Date(periodEndUnix * 1000).toISOString()
        : null;
      const canceledAt = sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null;

      // 元注文から auth_user_id / email を取得
      // metadata.order_id があればそれで直接引く（最も確実）
      const orderIdFromMeta = String(sub.metadata?.order_id || '');
      let originalOrder: any = null;
      if (orderIdFromMeta) {
        const r = await supabaseAdmin
          .from('orders')
          .select('auth_user_id, email, subscription_interval')
          .eq('id', orderIdFromMeta)
          .maybeSingle();
        originalOrder = r.data;
      }
      // フォールバック: stripe_subscription_id で検索（旧フローや retry 時用）
      if (!originalOrder) {
        const r = await supabaseAdmin
          .from('orders')
          .select('auth_user_id, email, subscription_interval')
          .eq('stripe_subscription_id', stripeSubscriptionId)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();
        originalOrder = r.data;
      }

      // metadata からの fallback（レースで order がまだ更新されていない場合に有用）
      const authUserIdFromMeta = String(sub.metadata?.auth_user_id || '') || null;

      // Stripe Customer からメールを取得（フォールバック）
      let email = originalOrder?.email ?? null;
      if (!email) {
        try {
          const customer = await stripe.customers.retrieve(stripeCustomerId);
          if (customer && !(customer as any).deleted) {
            email = (customer as any).email ?? null;
          }
        } catch (e) {
          console.warn('[Webhook] failed to fetch customer email', e);
        }
      }

      const row = {
        stripe_subscription_id: stripeSubscriptionId,
        stripe_customer_id: stripeCustomerId,
        auth_user_id: originalOrder?.auth_user_id ?? authUserIdFromMeta,
        email: email ?? 'unknown@example.com',
        status,
        interval: intervalFromMeta || originalOrder?.subscription_interval || 'monthly',
        // Stripeのmetadataに加えて、Stripe Subscriptionトップレベルの cancel_at_period_end も保存
        // これにより「期末解約予約中」の状態がwebhook再受信でも消えなくなる
        metadata: {
          ...(sub.metadata ?? {}),
          cancel_at_period_end: Boolean(sub.cancel_at_period_end),
          // cancel_at（将来のキャンセル予定時刻）も入れておく
          ...(sub.cancel_at
            ? { cancel_at: new Date(sub.cancel_at * 1000).toISOString() }
            : {}),
        },
        next_billing_at: currentPeriodEnd,
        canceled_at: canceledAt,
        updated_at: new Date().toISOString(),
      };

      const { error: upsertErr } = await supabaseAdmin
        .from('subscriptions')
        .upsert([row], { onConflict: 'stripe_subscription_id' });
      if (upsertErr) {
        console.error('[Webhook] subscriptions upsert error:', upsertErr);
      }
      return NextResponse.json({ received: true });
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub: any = event.data.object;
      const stripeSubscriptionId = sub.id as string;
      const canceledAt = sub.canceled_at
        ? new Date(sub.canceled_at * 1000).toISOString()
        : new Date().toISOString();

      const { error: updErr } = await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'canceled',
          canceled_at: canceledAt,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', stripeSubscriptionId);
      if (updErr) {
        console.error('[Webhook] subscriptions cancel update error:', updErr);
      }
      return NextResponse.json({ received: true });
    }

    // ============================================================
    // 定期請求の各サイクル: 新規 order を生成
    // billing_reason:
    //   - 'subscription_create' → 初回（既存の payment_intent.succeeded で処理済み）
    //   - 'subscription_cycle' → 2回目以降の自動請求
    // ============================================================
    // ============================================================
    // invoice.paid (旧API) / invoice_payment.paid (新API) のどちらでも受け付ける
    //   新API: invoice_payment object に invoice 参照と payment.payment_intent
    //          が入っているので、invoice 本体は Stripe API で取り直す。
    // ============================================================
    const eventType: string = event.type;
    if (eventType === 'invoice.paid' || eventType === 'invoice_payment.paid') {
      let invoice: any;
      let stripePaymentIntentId: string | null;

      if (eventType === 'invoice_payment.paid') {
        const invoicePayment: any = event.data.object;
        const invoiceId = invoicePayment.invoice as string | undefined;
        if (!invoiceId) {
          return NextResponse.json({ received: true, skipped: 'invoice_payment_no_invoice' });
        }
        // 完全な invoice を Stripe から取得
        invoice = await stripe.invoices.retrieve(invoiceId);
        // payment_intent は invoice_payment 側に入っているケースがあるので優先
        stripePaymentIntentId =
          (invoicePayment.payment?.payment_intent as string | null | undefined) ??
          (invoice.payment_intent as string | null | undefined) ??
          null;
      } else {
        invoice = (event.data as any).object;
        stripePaymentIntentId = invoice.payment_intent as string | null;
      }

      const billingReason = invoice.billing_reason as string;
      const stripeSubscriptionId = invoice.subscription as string | null;

      if (!stripeSubscriptionId) {
        return NextResponse.json({ received: true, skipped: 'not_subscription_invoice' });
      }
      if (billingReason === 'subscription_create') {
        // 初回は payment_intent.succeeded ハンドラに任せる
        return NextResponse.json({ received: true, skipped: 'first_cycle_handled_elsewhere' });
      }
      if (billingReason !== 'subscription_cycle' && billingReason !== 'subscription_update') {
        return NextResponse.json({ received: true, skipped: `unhandled_billing_reason:${billingReason}` });
      }

      // 既に同じpayment_intent_idでordersが存在すれば重複生成しない
      if (stripePaymentIntentId) {
        const { data: existing } = await supabaseAdmin
          .from('orders')
          .select('id')
          .eq('payment_intent_id', stripePaymentIntentId)
          .maybeSingle();
        if (existing) {
          return NextResponse.json({ received: true, skipped: 'order_already_exists' });
        }
      }

      // 元注文（最初の請求時に作られた order）をテンプレートとして取得
      const { data: original, error: origErr } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('stripe_subscription_id', stripeSubscriptionId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (origErr) {
        console.error('[Webhook] original order fetch error:', origErr);
        return NextResponse.json({ error: 'original_order_fetch_failed' }, { status: 500 });
      }
      if (!original) {
        console.error('[Webhook] original order not found for subscription:', stripeSubscriptionId);
        return NextResponse.json({
          received: true,
          warning: 'original_order_not_found',
          stripe_subscription_id: stripeSubscriptionId,
        });
      }

      const newOrderNumber = generateOrderNumber();
      const nowIso = new Date().toISOString();
      const amountPaid = Number(invoice.amount_paid ?? 0);

      // 注文の複製（id, order_number, payment_intent_id 等は差し替え）
      const cloneOrder: any = { ...original };
      delete cloneOrder.id;
      delete cloneOrder.created_at;
      cloneOrder.order_number = newOrderNumber;
      cloneOrder.payment_intent_id = stripePaymentIntentId;
      cloneOrder.payment_status = 'paid';
      cloneOrder.paid_at = nowIso;
      cloneOrder.order_status = 'processing';
      cloneOrder.updated_at = nowIso;
      cloneOrder.notes = `[定期請求] サイクル ${invoice.number || ''} - 元注文 ${original.order_number ?? original.id}`;
      // 金額が異なる場合はinvoiceの値で上書き（送料変動などのため）
      if (amountPaid && Number(original.total) !== amountPaid) {
        cloneOrder.total = amountPaid;
      }

      const { data: inserted, error: insErr } = await supabaseAdmin
        .from('orders')
        .insert([cloneOrder])
        .select('id')
        .single();
      if (insErr || !inserted?.id) {
        console.error('[Webhook] clone order insert error:', insErr);
        return NextResponse.json({ error: 'clone_order_failed' }, { status: 500 });
      }

      // 注文明細を複製
      const { data: origItems } = await supabaseAdmin
        .from('order_items')
        .select('*')
        .eq('order_id', original.id);

      if (origItems && origItems.length > 0) {
        const newItems = origItems.map((it: any) => {
          const next: any = { ...it };
          delete next.id;
          delete next.created_at;
          next.order_id = inserted.id;
          return next;
        });
        const { error: itemsErr } = await supabaseAdmin.from('order_items').insert(newItems);
        if (itemsErr) {
          console.error('[Webhook] clone order_items insert error:', itemsErr);
        }
      }

      // 在庫減算
      if (origItems) {
        for (const it of origItems) {
          if (!it.product_id || !it.quantity) continue;
          const { error: rpcErr } = await supabaseAdmin.rpc('decrement_product_stock', {
            p_product_id: it.product_id,
            p_selected_options: it.selected_options ?? null,
            p_qty: Number(it.quantity),
          });
          if (rpcErr) {
            console.error('[Webhook] decrement_product_stock failed for recurring', { pid: it.product_id, rpcErr });
          }
        }
      }

      // GAS通知（既存形式に揃える）
      try {
        const payload = {
          created_at: nowIso,
          order_number: newOrderNumber,
          name:
            `${original.last_name ?? ''}${original.first_name ? ` ${original.first_name}` : ''}`.trim() ||
            `${original.first_name ?? ''} ${original.last_name ?? ''}`.trim(),
          email: original.email,
          phone: original.phone,
          shipping_address: original.shipping_address,
          shipping_city: original.shipping_city,
          shipping_postal_code: original.shipping_postal_code,
          subtotal: original.subtotal,
          shipping_cost: original.shipping_cost,
          total: cloneOrder.total,
          payment_status: 'paid',
          order_status: 'processing',
          is_subscription_cycle: true,
          subscription_interval: original.subscription_interval,
        };
        await postToGAS(payload);
      } catch (gasErr: any) {
        console.error('[GAS] recurring order notify error (ignored)', gasErr?.message || gasErr);
      }

      // イベントマイル付与（定期購入も支払い完了の都度付与）
      await grantEventMilesForOrder(supabaseAdmin, inserted.id);

      // subscriptions テーブルの next_billing_at を進める
      try {
        const { data: subFromStripe } = await stripe.subscriptions.retrieve(stripeSubscriptionId).then(
          (s) => ({ data: s as any }),
          (err) => {
            console.warn('[Webhook] retrieve subscription failed', err?.message);
            return { data: null as any };
          }
        );
        if (subFromStripe) {
          const periodEndUnix =
            subFromStripe.current_period_end ??
            subFromStripe.items?.data?.[0]?.current_period_end ??
            null;
          await supabaseAdmin
            .from('subscriptions')
            .update({
              status: subFromStripe.status,
              next_billing_at: periodEndUnix
                ? new Date(periodEndUnix * 1000).toISOString()
                : null,
              updated_at: nowIso,
            })
            .eq('stripe_subscription_id', stripeSubscriptionId);
        }
      } catch (e: any) {
        console.warn('[Webhook] update subscriptions next_billing_at failed', e?.message);
      }

      return NextResponse.json({ received: true, new_order_id: inserted.id });
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice: any = event.data.object;
      const stripeSubscriptionId = invoice.subscription as string | null;
      if (stripeSubscriptionId) {
        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'past_due', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', stripeSubscriptionId);
      }
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
