import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import {
  computeNextShippingDate,
  isWithinChangeDeadline,
  type SubscriptionIntervalKey,
} from '@/lib/subscriptionShipping';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STRIPE_INTERVAL_MAP: Record<SubscriptionIntervalKey, { interval: 'day' | 'week' | 'month' | 'year'; interval_count: number }> = {
  weekly: { interval: 'week', interval_count: 1 },
  biweekly: { interval: 'week', interval_count: 2 },
  monthly: { interval: 'month', interval_count: 1 },
  bimonthly: { interval: 'month', interval_count: 2 },
  quarterly: { interval: 'month', interval_count: 3 },
  semiannual: { interval: 'month', interval_count: 6 },
  annual: { interval: 'year', interval_count: 1 },
};

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

interface UpdateIntervalBody {
  subscription_id: string;
  new_interval: SubscriptionIntervalKey;
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

    // 認証ユーザー取得
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

    const body = (await request.json()) as UpdateIntervalBody;
    const { subscription_id, new_interval } = body ?? {};
    if (!subscription_id || !subscription_id.startsWith('sub_')) {
      return NextResponse.json({ error: '不正なsubscription_id' }, { status: 400 });
    }
    if (!new_interval || !STRIPE_INTERVAL_MAP[new_interval]) {
      return NextResponse.json({ error: '不正なinterval' }, { status: 400 });
    }

    // 所有権確認
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
        { error: '稼働中の定期購入のみ変更できます' },
        { status: 400 }
      );
    }
    if ((ownership.metadata as any)?.cancel_at_period_end) {
      return NextResponse.json(
        { error: '解約予定の定期購入は変更できません' },
        { status: 400 }
      );
    }
    if (ownership.interval === new_interval) {
      return NextResponse.json(
        { error: '同じ配送頻度には変更できません' },
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
        { error: '変更の締切（次回発送月の9日終日）を過ぎています' },
        { status: 400 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);

    // Stripe Subscription を取得し、各アイテムを新しい interval の price に差し替える
    const sub = await stripe.subscriptions.retrieve(subscription_id, {
      expand: ['items.data.price.product'],
    });

    const newRecurring = STRIPE_INTERVAL_MAP[new_interval];
    const itemsUpdate: Array<{ id: string; price: string }> = [];

    for (const item of sub.items.data) {
      const oldPrice = item.price;
      const productId = typeof oldPrice.product === 'string' ? oldPrice.product : oldPrice.product.id;
      // 既存と同じ product / unit_amount / currency で新しい recurring の Price を作成
      const newPrice = await stripe.prices.create({
        product: productId,
        unit_amount: oldPrice.unit_amount ?? 0,
        currency: oldPrice.currency,
        recurring: newRecurring,
        metadata: { interval: new_interval },
      });
      itemsUpdate.push({ id: item.id, price: newPrice.id });
    }

    // Subscription を更新（プロレーションなし、現サイクルはそのまま）
    const updated = await stripe.subscriptions.update(subscription_id, {
      items: itemsUpdate,
      proration_behavior: 'none',
      metadata: {
        ...(sub.metadata || {}),
        interval: new_interval,
      },
    });

    // DB更新
    await supabaseAdmin
      .from('subscriptions')
      .update({
        interval: new_interval,
        next_billing_at: updated.current_period_end
          ? new Date(updated.current_period_end * 1000).toISOString()
          : ownership.next_billing_at,
        metadata: {
          ...(ownership.metadata as any),
          interval: new_interval,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription_id);

    return NextResponse.json({
      ok: true,
      subscription_id,
      interval: new_interval,
      status: updated.status,
    });
  } catch (error: any) {
    console.error('Subscription interval更新エラー:', error);
    return NextResponse.json(
      { error: error?.message || 'お届けサイクルの変更に失敗しました' },
      { status: 500 }
    );
  }
}
