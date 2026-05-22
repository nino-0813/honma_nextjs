// 管理者用: incomplete / incomplete_expired のサブスクリプションを掃除
// Stripe側もキャンセルし、DBも削除する
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

    const body = (await request.json().catch(() => null)) as
      | { subscription_id?: string }
      | null;
    const targetId = body?.subscription_id;

    const stripe = new Stripe(stripeSecretKey);

    let query = supabaseAdmin
      .from('subscriptions')
      .select('id, stripe_subscription_id, status')
      .in('status', ['incomplete', 'incomplete_expired']);
    if (targetId) {
      query = query.eq('stripe_subscription_id', targetId);
    }

    const { data: targets, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!targets || targets.length === 0) {
      return NextResponse.json({ ok: true, cleaned: 0 });
    }

    let cleaned = 0;
    for (const row of targets) {
      try {
        // Stripeでキャンセル試行（既にcanceled/expiredなら無視）
        try {
          await stripe.subscriptions.cancel(row.stripe_subscription_id);
        } catch (e: any) {
          // 既にキャンセル済み等は無視
          if (!String(e?.message ?? '').includes('canceled') && !String(e?.code).includes('resource_missing')) {
            console.warn('[cleanup] stripe cancel warn:', row.stripe_subscription_id, e?.message);
          }
        }
        // DBから削除
        await supabaseAdmin.from('subscriptions').delete().eq('id', row.id);
        cleaned++;
      } catch (e: any) {
        console.error('[cleanup] failed for', row.stripe_subscription_id, e?.message);
      }
    }

    return NextResponse.json({ ok: true, cleaned });
  } catch (error: any) {
    console.error('cleanup-incomplete-subscriptions エラー:', error);
    return NextResponse.json({ error: error?.message || 'cleanup error' }, { status: 500 });
  }
}
