import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!url || !key || !stripeKey) return NextResponse.json({ error: 'サーバー設定が不足しています' }, { status: 500 });

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: userData, error: userError } = await db.auth.getUser(authHeader.slice(7).trim());
    if (userError || !userData.user) return NextResponse.json({ error: '認証エラー' }, { status: 401 });

    const { subscription_id } = await request.json();
    const { data: row } = await db.from('subscriptions')
      .select('auth_user_id, metadata').eq('stripe_subscription_id', subscription_id).maybeSingle();
    if (!row) return NextResponse.json({ error: '定期便が見つかりません' }, { status: 404 });
    if (row.auth_user_id && row.auth_user_id !== userData.user.id) return NextResponse.json({ error: '権限がありません' }, { status: 403 });

    const saved = row.metadata?.current_product;
    if (saved?.product_title) return NextResponse.json({ product: saved });

    const stripe = new Stripe(stripeKey);
    const subscription: any = await stripe.subscriptions.retrieve(subscription_id, { expand: ['items.data.price.product'] });
    const item = subscription.items.data.find((entry: any) => {
      const product: any = entry.price.product;
      return product?.metadata?.product_id !== '__shipping__';
    });
    if (!item) return NextResponse.json({ error: '現在の商品を確認できません' }, { status: 404 });
    const product: any = item.price.product;
    return NextResponse.json({
      product: {
        product_id: product?.metadata?.product_id || null,
        product_title: product?.name || item.description || '定期便商品',
        product_image: Array.isArray(product?.images) ? product.images[0] || null : null,
        product_price: Number(item.price.unit_amount || 0),
        quantity: Number(item.quantity || 1),
        selected_options: null,
      },
    });
  } catch (error: any) {
    console.error('定期便商品情報取得エラー:', error);
    return NextResponse.json({ error: error?.message || '商品情報の取得に失敗しました' }, { status: 500 });
  }
}
