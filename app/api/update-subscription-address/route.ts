import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import {
  computeNextShippingDate,
  getSubscriptionChangeTiming,
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

interface UpdateAddressBody {
  subscription_id: string;
  shipping_name?: string;
  shipping_phone?: string;
  shipping_postal_code: string;
  shipping_city: string; // 都道府県＋市区町村
  shipping_address: string; // 番地・建物名等
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

    const body = (await request.json()) as UpdateAddressBody;
    const {
      subscription_id,
      shipping_name,
      shipping_phone,
      shipping_postal_code,
      shipping_city,
      shipping_address,
    } = body ?? {};

    if (!subscription_id || !subscription_id.startsWith('sub_')) {
      return NextResponse.json({ error: '不正なsubscription_id' }, { status: 400 });
    }
    if (!shipping_postal_code || !shipping_city || !shipping_address) {
      return NextResponse.json(
        { error: '郵便番号・都道府県/市区町村・番地は必須です' },
        { status: 400 }
      );
    }

    // 所有権確認
    const { data: ownership } = await supabaseAdmin
      .from('subscriptions')
      .select('id, auth_user_id, status, interval, created_at, next_billing_at, metadata, stripe_customer_id')
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

    // スキップ後の実際の次回発送日を基準に適用回を決める
    const nextShipping = computeNextShippingDate({
      created_at: ownership.created_at,
      next_billing_at: ownership.next_billing_at,
      interval: ownership.interval,
      firstShippingOverride:
        typeof (ownership.metadata as any)?.first_shipping_override === 'string'
          ? (ownership.metadata as any).first_shipping_override
          : null,
    });
    if (!nextShipping) return NextResponse.json({ error: '次回発送日を確認できません' }, { status: 400 });
    const timing = getSubscriptionChangeTiming(new Date(), nextShipping, ownership.interval);
    const addressChange = {
      name: shipping_name ?? null, phone: shipping_phone ?? null,
      postal_code: shipping_postal_code, city: shipping_city, address: shipping_address,
    };
    if (!timing.appliesToNextShipment) {
      const metadata = {
        ...(ownership.metadata as any),
        pending_changes: {
          ...((ownership.metadata as any)?.pending_changes || {}),
          shipping: {
            ...addressChange,
            effective_shipping_date: timing.effectiveShippingDate.toISOString(),
            apply_at: timing.applyAt.toISOString(),
            requested_at: new Date().toISOString(),
          },
        },
      };
      const { error } = await supabaseAdmin.from('subscriptions').update({ metadata, updated_at: new Date().toISOString() }).eq('id', ownership.id);
      if (error) throw error;
      return NextResponse.json({ ok: true, scheduled: true, effective_shipping_date: timing.effectiveShippingDate.toISOString() });
    }

    // Stripeに失敗した場合はDBを変更しない。
    const stripe = new Stripe(stripeSecretKey);
    if (ownership.stripe_customer_id) {
      await stripe.customers.update(ownership.stripe_customer_id, {
        shipping: {
          name: shipping_name || authUser.email || 'Customer', phone: shipping_phone || undefined,
          address: { postal_code: shipping_postal_code, line1: shipping_address, city: shipping_city, country: 'JP' },
        },
      });
    }

    // この定期購入に紐づく "最初の" orders 行（webhook が複製元として使用する原本）を更新
    // → 次回サイクル以降の発送はこの住所が使われる
    const { data: firstOrder } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('stripe_subscription_id', subscription_id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (firstOrder?.id) {
      const { error: orderUpdateError } = await supabaseAdmin
        .from('orders')
        .update({
          shipping_postal_code,
          shipping_city,
          shipping_address,
          // shipping_name / shipping_phone はマイグレーションで追加されているなら更新
          ...(shipping_name ? { shipping_name } : {}),
          ...(shipping_phone ? { shipping_phone } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', firstOrder.id);
      if (orderUpdateError) throw orderUpdateError;
    }

    // subscriptions.metadata にも保存（参照用）
    const newMetadata = {
      ...(ownership.metadata as any),
      shipping: {
        name: shipping_name ?? null,
        phone: shipping_phone ?? null,
        postal_code: shipping_postal_code,
        city: shipping_city,
        address: shipping_address,
        updated_at: new Date().toISOString(),
      },
    };
    const { error: subscriptionUpdateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        metadata: newMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription_id);
    if (subscriptionUpdateError) throw subscriptionUpdateError;

    return NextResponse.json({ ok: true, scheduled: false, subscription_id, effective_shipping_date: timing.effectiveShippingDate.toISOString() });
  } catch (error: any) {
    console.error('Subscription配送先更新エラー:', error);
    return NextResponse.json(
      { error: error?.message || '配送先の更新に失敗しました' },
      { status: 500 }
    );
  }
}
