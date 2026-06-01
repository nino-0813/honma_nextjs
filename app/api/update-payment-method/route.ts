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

interface UpdatePaymentMethodBody {
  subscription_id: string;
  payment_method_id: string; // pm_xxx
}

/**
 * SetupIntent 確定後に呼ばれる。
 *  1. payment_method を Customer に attach（confirm 時に既に attached になっていることが多い）
 *  2. Customer の invoice_settings.default_payment_method を更新
 *  3. Subscription の default_payment_method を更新
 *
 * これで次回以降の課金は新しいカードで実行される。
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

    const body = (await request.json()) as UpdatePaymentMethodBody;
    const { subscription_id, payment_method_id } = body ?? {};
    if (!subscription_id || !subscription_id.startsWith('sub_')) {
      return NextResponse.json({ error: '不正なsubscription_id' }, { status: 400 });
    }
    if (!payment_method_id || !payment_method_id.startsWith('pm_')) {
      return NextResponse.json({ error: '不正なpayment_method_id' }, { status: 400 });
    }

    const { data: ownership } = await supabaseAdmin
      .from('subscriptions')
      .select('id, auth_user_id, status, stripe_customer_id, metadata')
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

    // 1) attach (もし未attachなら)
    try {
      await stripe.paymentMethods.attach(payment_method_id, {
        customer: ownership.stripe_customer_id,
      });
    } catch (e: any) {
      // 既にattachされていれば 400 (resource_already_exists) が返る → 無視
      if (e?.code !== 'resource_already_exists' && e?.raw?.code !== 'resource_already_exists') {
        throw e;
      }
    }

    // 2) Customer のデフォルト支払い方法に設定（請求書／領収書に使われる）
    await stripe.customers.update(ownership.stripe_customer_id, {
      invoice_settings: {
        default_payment_method: payment_method_id,
      },
    });

    // 3) Subscription の default_payment_method を更新（次回課金で使われる）
    const updated = await stripe.subscriptions.update(subscription_id, {
      default_payment_method: payment_method_id,
    });

    // DB metadata に記録
    await supabaseAdmin
      .from('subscriptions')
      .update({
        metadata: {
          ...(ownership.metadata as any),
          last_payment_method_changed_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription_id);

    return NextResponse.json({
      ok: true,
      subscription_id,
      status: updated.status,
    });
  } catch (error: any) {
    console.error('支払い方法更新エラー:', error);
    return NextResponse.json(
      { error: error?.message || 'カード情報の更新に失敗しました' },
      { status: 500 }
    );
  }
}
