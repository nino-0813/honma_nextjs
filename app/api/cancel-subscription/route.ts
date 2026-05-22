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

interface CancelSubscriptionBody {
  subscription_id: string; // Stripe subscription id (sub_xxx)
  cancel_at_period_end?: boolean; // true=期末解約, false=即時解約
}

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

    // 認証ユーザーをトークンから取得
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

    const body = (await request.json()) as CancelSubscriptionBody;
    const { subscription_id, cancel_at_period_end = true } = body ?? {};

    if (!subscription_id || !subscription_id.startsWith('sub_')) {
      return NextResponse.json({ error: '不正なsubscription_id' }, { status: 400 });
    }

    // 自分の subscription かどうかを検証
    const { data: ownership } = await supabaseAdmin
      .from('subscriptions')
      .select('id, auth_user_id, status')
      .eq('stripe_subscription_id', subscription_id)
      .maybeSingle();

    if (!ownership) {
      return NextResponse.json({ error: '定期購入が見つかりません' }, { status: 404 });
    }
    if (ownership.auth_user_id && ownership.auth_user_id !== authUser.id) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }
    if (ownership.status === 'canceled') {
      return NextResponse.json({ error: 'すでに解約済みです' }, { status: 400 });
    }

    const stripe = new Stripe(stripeSecretKey);

    let updated: Stripe.Subscription;
    if (cancel_at_period_end) {
      // 期末解約: 現サイクルまで配送、その後停止
      updated = await stripe.subscriptions.update(subscription_id, {
        cancel_at_period_end: true,
      });
    } else {
      // 即時解約
      updated = await stripe.subscriptions.cancel(subscription_id);
    }

    // DB側も更新（Webhookでも更新されるが即時反映用）
    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: updated.status,
        canceled_at: updated.canceled_at ? new Date(updated.canceled_at * 1000).toISOString() : null,
        metadata: {
          ...(ownership as any).metadata,
          cancel_at_period_end: updated.cancel_at_period_end,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription_id);

    return NextResponse.json({
      ok: true,
      subscription_id,
      status: updated.status,
      cancel_at_period_end: updated.cancel_at_period_end,
      current_period_end: updated.current_period_end
        ? new Date(updated.current_period_end * 1000).toISOString()
        : null,
    });
  } catch (error: any) {
    console.error('Subscriptionキャンセルエラー:', error);
    return NextResponse.json(
      { error: error?.message || '定期購入のキャンセルに失敗しました' },
      { status: 500 }
    );
  }
}
