/**
 * 定期購入チェックアウト用 API
 *
 * 仕様（オーナー合意済み）:
 *  - 1回目の決済はチェックアウト時（PaymentIntent）
 *  - 2回目以降は「毎月10日」など（Stripe Subscription の billing_cycle_anchor で制御）
 *
 * ここで Stripe Subscription は作らず、PaymentIntent のみ作成する。
 * 初回決済が成功した瞬間に webhook(payment_intent.succeeded) が:
 *  1) metadata.type === 'subscription_init' を検知
 *  2) Stripe Subscription を trial_end / billing_cycle_anchor 付きで作成
 *  3) order.stripe_subscription_id を更新
 *
 * 詳細は app/api/stripe-webhook/route.ts を参照。
 */

import { NextResponse } from 'next/server';
import Stripe from 'stripe';

type IntervalKey =
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'bimonthly'
  | 'quarterly'
  | 'semiannual'
  | 'annual';

const VALID_INTERVALS: IntervalKey[] = [
  'weekly',
  'biweekly',
  'monthly',
  'bimonthly',
  'quarterly',
  'semiannual',
  'annual',
];

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

interface SubscriptionItemInput {
  product_id: string;
  product_title: string;
  unit_price: number; // 割引後の単価(税込)
  quantity: number;
}

interface CreateSubscriptionBody {
  email: string;
  name?: string;
  phone?: string;
  interval: IntervalKey;
  items: SubscriptionItemInput[]; // 定期購入アイテム（すべて同一間隔）
  shipping_cost?: number; // 1回あたりの送料
  metadata?: Record<string, string>;
}

export async function POST(request: Request) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'Stripe Secret Keyが設定されていません' }, { status: 500 });
    }

    const body = (await request.json()) as CreateSubscriptionBody;
    const { email, name, phone, interval, items, shipping_cost, metadata = {} } = body ?? {};

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'メールアドレスが必要です' }, { status: 400 });
    }
    if (!interval || !VALID_INTERVALS.includes(interval)) {
      return NextResponse.json({ error: '配送間隔が不正です' }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: '定期購入アイテムがありません' }, { status: 400 });
    }
    for (const item of items) {
      if (!item.product_id || !item.product_title || !item.unit_price || !item.quantity) {
        return NextResponse.json({ error: '不正なアイテム情報です' }, { status: 400 });
      }
    }

    const stripe = new Stripe(stripeSecretKey);

    // 1) Customer を取得 or 作成
    let customer: Stripe.Customer;
    const existing = await stripe.customers.list({ email: email.trim(), limit: 1 });
    if (existing.data.length > 0) {
      customer = existing.data[0];
    } else {
      customer = await stripe.customers.create({
        email: email.trim(),
        name: name?.trim() || undefined,
        phone: phone?.trim() || undefined,
        metadata: {
          source: 'ikevege_checkout',
        },
      });
    }

    // 2) 初回決済額（=1か月分の総額）を計算
    const itemsTotal = items.reduce((sum, it) => sum + it.unit_price * it.quantity, 0);
    const total = itemsTotal + Math.max(0, Number(shipping_cost || 0));
    if (total <= 0) {
      return NextResponse.json({ error: '金額が不正です' }, { status: 400 });
    }

    // 3) Subscription 用 PaymentIntent を作成
    //    - setup_future_usage='off_session' でカードを保存（webhook 側で Subscription に紐付け）
    //    - metadata に Subscription 作成に必要な情報を持たせる
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total),
      currency: 'jpy',
      customer: customer.id,
      setup_future_usage: 'off_session',
      automatic_payment_methods: { enabled: true },
      metadata: {
        ...metadata,
        type: 'subscription_init',
        interval,
        item_count: String(items.length),
        items_json: JSON.stringify(
          items.map((it) => ({
            id: it.product_id,
            t: it.product_title.slice(0, 60), // 長すぎ防止
            p: Math.round(it.unit_price),
            q: it.quantity,
          }))
        ).slice(0, 480), // Stripe metadata 1値の上限 500 char に収める
        shipping_cost: String(Math.max(0, Number(shipping_cost || 0))),
      },
    });

    if (!paymentIntent?.client_secret) {
      return NextResponse.json(
        { error: '初回決済の ClientSecret を取得できませんでした' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      // ※ Subscription は webhook 側で作成するため、ここでは null を返す
      subscriptionId: null,
      customerId: customer.id,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      livemode: paymentIntent.livemode,
      secretKeyPrefix: stripeSecretKey.startsWith('sk_test')
        ? 'sk_test'
        : stripeSecretKey.startsWith('sk_live')
          ? 'sk_live'
          : 'unknown',
    });
  } catch (error: any) {
    console.error('Subscription作成エラー:', error);
    return NextResponse.json(
      { error: error?.message || 'Subscriptionの作成に失敗しました' },
      { status: 500 }
    );
  }
}
