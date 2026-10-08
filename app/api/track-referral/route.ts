// 紹介URL経由の会員登録を検知し、紹介された人のcustomers行にreferrer_nameを自動登録するAPI
// サインアップ直後にクライアントから呼ばれる想定（customersテーブルは管理者専用RLSのためservice roleで書き込む）
import { NextResponse } from 'next/server';
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
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabaseが設定されていません' }, { status: 500 });
    }

    const body = (await request.json()) as { userId?: string; referralCode?: string };
    const userId = body?.userId?.trim();
    const referralCode = body?.referralCode?.trim().toLowerCase();
    if (!userId || !referralCode) {
      return NextResponse.json({ ok: false, error: 'userId/referralCodeが必要です' }, { status: 400 });
    }

    // クライアントから渡されたメールアドレスは信用せず、Supabase Authの本人情報を使う。
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (accessToken) {
      const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
      if (error || !data.user || data.user.id !== userId) {
        return NextResponse.json({ ok: false, error: '認証情報が一致しません' }, { status: 401 });
      }
    }
    const { data: authUserData, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
    const email = authUserData?.user?.email?.trim().toLowerCase();
    if (authUserError || !email) {
      return NextResponse.json({ ok: false, error: '登録ユーザーを確認できません' }, { status: 404 });
    }

    const { data: referrer, error: referrerErr } = await supabaseAdmin
      .from('customers')
      .select('id, last_name, first_name, email')
      .ilike('referral_code', referralCode)
      .maybeSingle();
    if (referrerErr) throw referrerErr;
    if (!referrer) {
      return NextResponse.json({ ok: false, reason: 'invalid_code' });
    }
    if (referrer.email?.trim().toLowerCase() === email) {
      return NextResponse.json({ ok: false, reason: 'self_referral' }, { status: 400 });
    }

    const referrerName = `${referrer.last_name ?? ''}${referrer.first_name ? ` ${referrer.first_name}` : ''}`.trim();

    const { data: existing, error: existingErr } = await supabaseAdmin
      .from('customers')
      .select('id, referrer_name, referred_by_customer_id')
      .eq('email', email)
      .limit(1)
      .maybeSingle();
    if (existingErr) throw existingErr;

    if (existing) {
      if (!existing.referred_by_customer_id) {
        const { error: updErr } = await supabaseAdmin
          .from('customers')
          .update({ referrer_name: referrerName, referred_by_customer_id: referrer.id })
          .eq('id', existing.id);
        if (updErr) throw updErr;
      }
    } else {
      const { error: insErr } = await supabaseAdmin.from('customers').insert([
        {
          last_name: email,
          email,
          platform: 'website',
          referrer_name: referrerName,
          referred_by_customer_id: referrer.id,
        },
      ]);
      if (insErr) throw insErr;
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[TrackReferral] failed:', error);
    return NextResponse.json({ ok: false, error: error?.message || '紹介の記録に失敗しました' }, { status: 500 });
  }
}
