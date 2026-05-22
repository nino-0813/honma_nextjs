// 既存の subscriptions レコードを Stripe から最新化するためのユーティリティAPI
// 主にデバッグ/バックフィル用途。本番ではWebhookで自動更新される。
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

    const stripe = new Stripe(stripeSecretKey);

    // 自分の subscription を全件取得
    const { data: subs, error: subsErr } = await supabaseAdmin
      .from('subscriptions')
      .select('id, stripe_subscription_id, status')
      .eq('auth_user_id', authUser.id);

    if (subsErr) {
      return NextResponse.json({ error: subsErr.message }, { status: 500 });
    }
    if (!subs || subs.length === 0) {
      return NextResponse.json({ ok: true, synced: 0 });
    }

    let updated = 0;
    for (const row of subs) {
      try {
        const sub: any = await stripe.subscriptions.retrieve(row.stripe_subscription_id);
        const periodEndUnix =
          sub.current_period_end ??
          sub.items?.data?.[0]?.current_period_end ??
          null;
        const next_billing_at = periodEndUnix
          ? new Date(periodEndUnix * 1000).toISOString()
          : null;
        const canceledAt = sub.canceled_at
          ? new Date(sub.canceled_at * 1000).toISOString()
          : null;

        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: sub.status,
            next_billing_at,
            canceled_at: canceledAt,
            metadata: {
              ...(sub.metadata ?? {}),
              cancel_at_period_end: sub.cancel_at_period_end,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', row.stripe_subscription_id);
        updated++;
      } catch (e: any) {
        console.warn('[sync-subscription] failed for', row.stripe_subscription_id, e?.message);
      }
    }

    return NextResponse.json({ ok: true, synced: updated });
  } catch (error: any) {
    console.error('sync-subscription エラー:', error);
    return NextResponse.json({ error: error?.message || 'sync error' }, { status: 500 });
  }
}
