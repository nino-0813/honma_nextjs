// 管理者用の定期購入キャンセルAPI
// 管理者は他人のsubscriptionも操作できる
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

async function isAdminUser(supabaseAdmin: ReturnType<typeof getSupabaseAdmin>, accessToken: string) {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data?.user) return null;
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', data.user.id)
    .maybeSingle();
  if (!profile?.is_admin) return null;
  return data.user;
}

export async function POST(request: Request) {
  try {
    const stripeSecretKey = getEnv('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'Stripe Secret Keyが未設定' }, { status: 500 });
    }
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase未設定' }, { status: 500 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: '認証トークンがありません' }, { status: 401 });
    }
    const accessToken = authHeader.slice('Bearer '.length).trim();
    const adminUser = await isAdminUser(supabaseAdmin, accessToken);
    if (!adminUser) {
      return NextResponse.json({ error: '管理者権限がありません' }, { status: 403 });
    }

    const body = (await request.json()) as {
      subscription_id: string;
      cancel_at_period_end?: boolean;
    };
    const { subscription_id, cancel_at_period_end = true } = body ?? {};
    if (!subscription_id || !subscription_id.startsWith('sub_')) {
      return NextResponse.json({ error: '不正なsubscription_id' }, { status: 400 });
    }

    const stripe = new Stripe(stripeSecretKey);
    let updated: Stripe.Subscription;
    if (cancel_at_period_end) {
      updated = await stripe.subscriptions.update(subscription_id, {
        cancel_at_period_end: true,
      });
    } else {
      updated = await stripe.subscriptions.cancel(subscription_id);
    }

    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: updated.status,
        canceled_at: updated.canceled_at ? new Date(updated.canceled_at * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription_id);

    return NextResponse.json({
      ok: true,
      subscription_id,
      status: updated.status,
      cancel_at_period_end: updated.cancel_at_period_end,
      canceled_immediately: !cancel_at_period_end,
    });
  } catch (error: any) {
    console.error('Admin Subscriptionキャンセルエラー:', error);
    return NextResponse.json({ error: error?.message || 'キャンセルに失敗しました' }, { status: 500 });
  }
}
