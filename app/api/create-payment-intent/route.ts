import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

type CheckoutItem = {
  product_id?: string;
  handle?: string;
  unit_price?: number;
  quantity?: number;
  free_shipping?: boolean;
};

function getAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function validateStartSetBenefit(body: any): Promise<string | null> {
  const items: CheckoutItem[] = Array.isArray(body?.items) ? body.items : [];
  const candidateIds = items.map((item) => item.product_id).filter((id): id is string => Boolean(id));
  if (candidateIds.length === 0) return null;

  const db = getAdminClient();
  if (!db) return '初回購入特典の確認に必要な設定がありません';
  const { data: products, error: productError } = await db
    .from('products')
    .select('id, handle, price')
    .in('id', candidateIds);
  if (productError) return '商品価格の確認に失敗しました';

  const startSet = (products || []).find((product: any) => product.handle === 'start-set');
  if (!startSet) return null;

  const token = typeof body?.auth_access_token === 'string' ? body.auth_access_token : '';
  if (!token) return 'お試しセットの初回特典確認にはログインが必要です';
  const { data: authData, error: authError } = await db.auth.getUser(token);
  const userId = authData.user?.id;
  if (authError || !userId) return 'ログイン情報を確認できませんでした';

  const { data: existingOrder, error: orderError } = await db
    .from('orders')
    .select('id')
    .eq('auth_user_id', userId)
    .or('payment_status.eq.paid,and(payment_status.eq.pending,payment_method.eq.bank_transfer)')
    .limit(1)
    .maybeSingle();
  if (orderError) return '購入履歴の確認に失敗しました';

  const eligible = !existingOrder;
  const submitted = items.find((item) => item.product_id === startSet.id);
  const expectedPrice = eligible ? Math.round(Number(startSet.price) * 0.9) : Number(startSet.price);
  if (!submitted || Number(submitted.unit_price) !== expectedPrice) {
    return 'お試しセットの価格が最新の購入条件と一致しません。画面を再読み込みしてください';
  }
  if (Boolean(submitted.free_shipping) !== eligible) {
    return 'お試しセットの送料条件が最新の購入条件と一致しません。画面を再読み込みしてください';
  }
  return null;
}

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

export async function POST(request: Request) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'Stripe Secret Keyが設定されていません' }, { status: 500 });
    }

    const body = await request.json();
    const { amount, currency = 'jpy', metadata = {}, email, name, phone, idempotency_key } = body ?? {};

    if (!idempotency_key || !/^[A-Za-z0-9_-]{8,120}$/.test(idempotency_key)) {
      return NextResponse.json({ error: '決済の再送防止キーが不正です' }, { status: 400 });
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: '金額が無効です' }, { status: 400 });
    }

    const startSetValidationError = await validateStartSetBenefit(body);
    if (startSetValidationError) {
      return NextResponse.json({ error: startSetValidationError }, { status: 409 });
    }

    // Use account default Stripe API version.
    const stripe = new Stripe(stripeSecretKey);
    const bankTransferEnabled = process.env.ENABLE_STRIPE_BANK_TRANSFER === 'true';

    let customerId: string | undefined;
    if (bankTransferEnabled) {
      if (!email || typeof email !== 'string') {
        return NextResponse.json({ error: '銀行振込の利用にはメールアドレスが必要です' }, { status: 400 });
      }
      const existing = await stripe.customers.list({ email: email.trim(), limit: 1 });
      const customer = existing.data[0] ?? await stripe.customers.create({
        email: email.trim(),
        name: typeof name === 'string' ? name.trim() : undefined,
        phone: typeof phone === 'string' ? phone.trim() : undefined,
        metadata: { source: 'ikevege_checkout' },
      });
      customerId = customer.id;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: String(currency).toLowerCase(),
      customer: customerId,
      metadata: { ...metadata, bank_transfer_enabled: String(bankTransferEnabled) },
      payment_method_types: bankTransferEnabled ? ['card', 'customer_balance'] : ['card'],
      ...(bankTransferEnabled ? {
        payment_method_options: {
          customer_balance: {
            funding_type: 'bank_transfer',
            bank_transfer: { type: 'jp_bank_transfer' },
          },
        },
      } : {}),
    }, { idempotencyKey: `single_checkout_${idempotency_key}` });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      customerId: customerId ?? null,
      bankTransferEnabled,
      livemode: paymentIntent.livemode,
      secretKeyPrefix: stripeSecretKey.startsWith('sk_test')
        ? 'sk_test'
        : stripeSecretKey.startsWith('sk_live')
          ? 'sk_live'
          : 'unknown',
    });
  } catch (error: any) {
    console.error('PaymentIntent作成エラー:', error);
    return NextResponse.json(
      { error: error?.message || 'PaymentIntentの作成に失敗しました' },
      { status: 500 }
    );
  }
}
