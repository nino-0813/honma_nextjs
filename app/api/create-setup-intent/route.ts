import { NextResponse } from 'next/server';
import Stripe from 'stripe';
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

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

interface CreateSetupIntentBody {
  subscription_id: string;
}

/**
 * Stripe SetupIntent を作成してカード入力UI用の client_secret を返す。
 * 既存の Customer に対して off_session 用カードを登録するために使用。
 */
export async function POST(request: Request) {
  try {
    const stripeSecretKey = getEnv('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'Stripe Secret Keyが設定されていません' }, { status: 500 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabaseが設定されていません' }, { status: 500 });
    }

    // 認証
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: '認証トークンがありません' }, { status: 401 });
    }
    const accessToken = authHeader.slice('Bearer '.length).trim();
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(accessToken);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: '認証エラー' }, { status: 401 });
    }
    const authUser = userData.user;

    const body = (await request.json()) as CreateSetupIntentBody;
    const { subscription_id } = body ?? {};
    if (!subscription_id || !subscription_id.startsWith('sub_')) {
      return NextResponse.json({ error: '不正なsubscription_id' }, { status: 400 });
    }

    // 所有権確認 → stripe_customer_id を取得
    const { data: ownership } = await supabaseAdmin
      .from('subscriptions')
      .select('id, auth_user_id, status, stripe_customer_id')
      .eq('stripe_subscription_id', subscription_id)
      .maybeSingle();

    if (!ownership) {
      return NextResponse.json({ error: '定期購入が見つかりません' }, { status: 404 });
    }
    if (ownership.auth_user_id && ownership.auth_user_id !== authUser.id) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }
    if (!ownership.stripe_customer_id) {
      return NextResponse.json({ error: 'Stripe Customer 情報がありません' }, { status: 400 });
    }

    const stripe = new Stripe(stripeSecretKey);
    const setupIntent = await stripe.setupIntents.create({
      customer: ownership.stripe_customer_id,
      usage: 'off_session',
      automatic_payment_methods: { enabled: true },
      metadata: {
        subscription_id,
        purpose: 'subscription_card_change',
      },
    });

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      customerId: ownership.stripe_customer_id,
    });
  } catch (error: any) {
    console.error('SetupIntent作成エラー:', error);
    return NextResponse.json(
      { error: error?.message || 'カード入力の準備に失敗しました' },
      { status: 500 }
    );
  }
}
