import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { computeNextShippingDate, formatJapaneseDate, getSubscriptionChangeTiming } from '@/lib/subscriptionShipping';
import { applySubscriptionProductChange } from '@/lib/subscriptionChanges';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!url || !key || !stripeKey) return NextResponse.json({ error: 'サーバー設定が不足しています' }, { status: 500 });
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const auth = request.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) return NextResponse.json({ error: '認証トークンがありません' }, { status: 401 });
    const { data: userData } = await db.auth.getUser(auth.slice(7));
    if (!userData.user) return NextResponse.json({ error: '認証エラー' }, { status: 401 });
    const { subscription_id, product_id, milling_option_id } = await request.json();
    if (!subscription_id?.startsWith('sub_') || !product_id || !milling_option_id) {
      return NextResponse.json({ error: '変更内容が不正です' }, { status: 400 });
    }
    const { data: sub } = await db.from('subscriptions')
      .select('*').eq('stripe_subscription_id', subscription_id).maybeSingle();
    if (!sub) return NextResponse.json({ error: '定期購入が見つかりません' }, { status: 404 });
    if (sub.auth_user_id && sub.auth_user_id !== userData.user.id) return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    if (!['active', 'trialing'].includes(sub.status)) return NextResponse.json({ error: '稼働中の定期購入のみ変更できます' }, { status: 400 });

    const nextShipping = computeNextShippingDate({
      created_at: sub.created_at, next_billing_at: sub.next_billing_at, interval: sub.interval,
      firstShippingOverride: typeof sub.metadata?.first_shipping_override === 'string' ? sub.metadata.first_shipping_override : null,
    });
    if (!nextShipping) return NextResponse.json({ error: '次回発送日を確認できません' }, { status: 400 });
    const timing = getSubscriptionChangeTiming(new Date(), nextShipping, sub.interval);
    if (!timing.appliesToNextShipment) {
      const metadata = {
        ...(sub.metadata || {}),
        pending_changes: {
          ...(sub.metadata?.pending_changes || {}),
          product: {
            product_id, milling_option_id,
            effective_shipping_date: timing.effectiveShippingDate.toISOString(),
            apply_at: timing.applyAt.toISOString(),
            requested_at: new Date().toISOString(),
          },
        },
      };
      const { error } = await db.from('subscriptions').update({ metadata, updated_at: new Date().toISOString() }).eq('id', sub.id);
      if (error) throw error;
      return NextResponse.json({ ok: true, scheduled: true, effective_shipping_date: timing.effectiveShippingDate.toISOString(), message: `${formatJapaneseDate(timing.effectiveShippingDate)}発送分から変更します` });
    }

    const result = await applySubscriptionProductChange({ db, stripe: new Stripe(stripeKey), subscriptionId: subscription_id, productId: product_id, millingOptionId: milling_option_id });
    return NextResponse.json({ ok: true, scheduled: false, effective_shipping_date: timing.effectiveShippingDate.toISOString(), price: result.unitAmount });
  } catch (error: any) {
    console.error('Subscription商品変更エラー:', error);
    return NextResponse.json({ error: error?.message || '商品変更に失敗しました' }, { status: 500 });
  }
}
