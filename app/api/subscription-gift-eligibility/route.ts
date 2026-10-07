import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'サーバー設定が不足しています' }, { status: 500 });
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: userError } = await db.auth.getUser(authHeader.slice(7).trim());
  if (userError || !userData.user) return NextResponse.json({ error: '認証エラー' }, { status: 401 });
  const userId = userData.user.id;

  const [{ data: subscription }, { data: paidOrder }] = await Promise.all([
    db.from('subscriptions').select('id').eq('auth_user_id', userId).limit(1).maybeSingle(),
    db.from('orders').select('id').eq('auth_user_id', userId).eq('payment_status', 'paid')
      .not('subscription_interval', 'is', null).limit(1).maybeSingle(),
  ]);

  return NextResponse.json({
    eligible: !subscription && !paidOrder,
    reason: subscription || paidOrder ? 'already_used' : null,
  });
}
