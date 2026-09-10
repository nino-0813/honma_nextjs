import { NextResponse } from 'next/server';
import Stripe from 'stripe';

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
    const { amount, currency = 'jpy', metadata = {}, email, name, phone } = body ?? {};

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: '金額が無効です' }, { status: 400 });
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
    });

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
