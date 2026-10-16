import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function GET(request: Request) {
  const db = getAdminClient();
  if (!db) return NextResponse.json({ error: 'server_not_configured' }, { status: 500 });

  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return NextResponse.json({ eligible: false, reason: 'login_required' }, { status: 401 });
  }

  const { data: authData, error: authError } = await db.auth.getUser(token);
  const userId = authData.user?.id;
  if (authError || !userId) {
    return NextResponse.json({ eligible: false, reason: 'invalid_session' }, { status: 401 });
  }

  // 既存の購入履歴表示と同じ扱い:
  // 支払済み、または銀行振込の入金待ち注文があれば初回特典の対象外とする。
  // カード決済途中のドラフト・失敗・キャンセル済み注文は含めない。
  const { data: existingOrder, error } = await db
    .from('orders')
    .select('id')
    .eq('auth_user_id', userId)
    .or('payment_status.eq.paid,and(payment_status.eq.pending,payment_method.eq.bank_transfer)')
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    eligible: !existingOrder,
    reason: existingOrder ? 'purchase_history_found' : 'no_purchase_history',
  });
}
