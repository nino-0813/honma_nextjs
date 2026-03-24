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
    const { amount, currency = 'jpy', metadata = {} } = body ?? {};

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: '金額が無効です' }, { status: 400 });
    }

    // Use account default Stripe API version.
    const stripe = new Stripe(stripeSecretKey);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: String(currency).toLowerCase(),
      metadata,
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({
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
    console.error('PaymentIntent作成エラー:', error);
    return NextResponse.json(
      { error: error?.message || 'PaymentIntentの作成に失敗しました' },
      { status: 500 }
    );
  }
}
