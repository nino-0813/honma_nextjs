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

const INTERVAL_MAP: Record<IntervalKey, { interval: 'day' | 'week' | 'month' | 'year'; interval_count: number }> = {
  weekly: { interval: 'week', interval_count: 1 },
  biweekly: { interval: 'week', interval_count: 2 },
  monthly: { interval: 'month', interval_count: 1 },
  bimonthly: { interval: 'month', interval_count: 2 },
  quarterly: { interval: 'month', interval_count: 3 },
  semiannual: { interval: 'month', interval_count: 6 },
  annual: { interval: 'year', interval_count: 1 },
};

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
    if (!interval || !(interval in INTERVAL_MAP)) {
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
    const recurring = INTERVAL_MAP[interval];

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

    // 1.5) 既存の 'incomplete' な Subscription を掃除（重複防止）
    //   チェックアウトページのtotal変化等で複数作成される問題を防ぐ
    try {
      const incompleteSubs = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'incomplete',
        limit: 10,
      });
      for (const old of incompleteSubs.data) {
        try {
          await stripe.subscriptions.cancel(old.id);
        } catch (e: any) {
          console.warn('[create-subscription] cancel orphan incomplete failed:', old.id, e?.message);
        }
      }
    } catch (e: any) {
      console.warn('[create-subscription] list incomplete failed:', e?.message);
    }

    // 2) Subscription items 構築（Stripe Productを動的に作成）
    const subscriptionItems: Stripe.SubscriptionCreateParams.Item[] = [];
    for (const item of items) {
      const stripeProduct = await stripe.products.create({
        name: item.product_title,
        metadata: {
          product_id: item.product_id,
          source: 'ikevege_subscription',
        },
      });
      subscriptionItems.push({
        quantity: item.quantity,
        price_data: {
          currency: 'jpy',
          product: stripeProduct.id,
          unit_amount: Math.round(item.unit_price),
          recurring,
        },
      });
    }

    // 3) 送料を recurring line item として追加（地域別送料は呼び出し側で計算済み）
    if (shipping_cost && shipping_cost > 0) {
      const shippingProduct = await stripe.products.create({
        name: '送料',
        metadata: {
          product_id: '__shipping__',
          source: 'ikevege_subscription',
        },
      });
      subscriptionItems.push({
        quantity: 1,
        price_data: {
          currency: 'jpy',
          product: shippingProduct.id,
          unit_amount: Math.round(shipping_cost),
          recurring,
        },
      });
    }

    // 4) Subscription 作成（default_incomplete でPaymentIntentを得る）
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: subscriptionItems,
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        ...metadata,
        interval,
        item_count: String(items.length),
      },
    });

    const latestInvoice = subscription.latest_invoice as Stripe.Invoice | null;
    const paymentIntent = (latestInvoice as any)?.payment_intent as Stripe.PaymentIntent | null;

    if (!paymentIntent?.client_secret) {
      return NextResponse.json(
        { error: '初回決済のClientSecretを取得できませんでした' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      subscriptionId: subscription.id,
      customerId: customer.id,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      livemode: subscription.livemode,
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
