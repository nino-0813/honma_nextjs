import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import {
  computeNextShippingDate,
  isWithinChangeDeadline,
  intervalToMonths,
} from '@/lib/subscriptionShipping';

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

interface SkipSubscriptionBody {
  subscription_id: string;
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

    // 認証ユーザーを取得
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

    const body = (await request.json()) as SkipSubscriptionBody;
    const { subscription_id } = body ?? {};
    if (!subscription_id || !subscription_id.startsWith('sub_')) {
      return NextResponse.json({ error: '不正なsubscription_id' }, { status: 400 });
    }

    // 所有権と状態を検証
    const { data: ownership } = await supabaseAdmin
      .from('subscriptions')
      .select('id, auth_user_id, status, interval, created_at, next_billing_at, metadata')
      .eq('stripe_subscription_id', subscription_id)
      .maybeSingle();

    if (!ownership) {
      return NextResponse.json({ error: '定期購入が見つかりません' }, { status: 404 });
    }
    if (ownership.auth_user_id && ownership.auth_user_id !== authUser.id) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }
    if (ownership.status !== 'active' && ownership.status !== 'trialing') {
      return NextResponse.json(
        { error: '稼働中の定期購入のみスキップできます' },
        { status: 400 }
      );
    }
    if ((ownership.metadata as any)?.cancel_at_period_end) {
      return NextResponse.json(
        { error: '解約予定の定期購入はスキップできません' },
        { status: 400 }
      );
    }

    // 9日締切バリデーション
    const nextShipping = computeNextShippingDate({
      created_at: ownership.created_at,
      next_billing_at: ownership.next_billing_at,
      interval: ownership.interval,
      firstShippingOverride:
        typeof (ownership.metadata as any)?.first_shipping_override === 'string'
          ? (ownership.metadata as any).first_shipping_override
          : null,
    });
    if (!isWithinChangeDeadline(new Date(), nextShipping)) {
      return NextResponse.json(
        { error: 'スキップの締切（次回発送月の9日終日）を過ぎています' },
        { status: 400 }
      );
    }

    // Stripe から最新を取得して連続スキップを検証
    const stripe = new Stripe(stripeSecretKey);
    const sub = await stripe.subscriptions.retrieve(subscription_id);
    const currentPeriodEnd = sub.current_period_end; // unix秒
    const skippedUntil = (ownership.metadata as any)?.skipped_until as number | undefined;
    if (typeof skippedUntil === 'number' && skippedUntil === currentPeriodEnd) {
      return NextResponse.json(
        { error: '2回連続のスキップはできません' },
        { status: 400 }
      );
    }

    // 次の課金日を1サイクル分後ろにずらす（trial_end方式）
    const monthsToSkip = intervalToMonths(ownership.interval) || 1;
    const oldEnd = new Date(currentPeriodEnd * 1000);
    const newTrialEnd = new Date(oldEnd);
    newTrialEnd.setUTCMonth(newTrialEnd.getUTCMonth() + monthsToSkip);
    const newTrialEndSec = Math.floor(newTrialEnd.getTime() / 1000);

    const updated = await stripe.subscriptions.update(subscription_id, {
      trial_end: newTrialEndSec,
      proration_behavior: 'none',
    });

    // DB更新（metadata.skipped_until に記録 → 次回チェックで連続スキップ防止）
    const newMetadata = {
      ...(ownership.metadata as any),
      skipped_until: updated.current_period_end,
      last_skipped_at: new Date().toISOString(),
    };
    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: updated.status,
        next_billing_at: updated.current_period_end
          ? new Date(updated.current_period_end * 1000).toISOString()
          : ownership.next_billing_at,
        metadata: newMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription_id);

    return NextResponse.json({
      ok: true,
      subscription_id,
      status: updated.status,
      next_billing_at: updated.current_period_end
        ? new Date(updated.current_period_end * 1000).toISOString()
        : null,
    });
  } catch (error: any) {
    console.error('Subscriptionスキップエラー:', error);
    return NextResponse.json(
      { error: error?.message || '定期購入のスキップに失敗しました' },
      { status: 500 }
    );
  }
}
