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

    const body = (await request.json()) as { userId?: string; email?: string; referralCode?: string };
    const { email, referralCode } = body ?? {};
    if (!email || !referralCode) {
      return NextResponse.json({ ok: false, error: 'email/referralCodeが必要です' }, { status: 400 });
    }

    const { data: referrer, error: referrerErr } = await supabaseAdmin
      .from('customers')
      .select('id, last_name, first_name')
      .eq('referral_code', referralCode)
      .maybeSingle();
    if (referrerErr) throw referrerErr;
    if (!referrer) {
      return NextResponse.json({ ok: false, reason: 'invalid_code' });
    }

    const referrerName = `${referrer.last_name ?? ''}${referrer.first_name ? ` ${referrer.first_name}` : ''}`.trim();

    const { data: existing, error: existingErr } = await supabaseAdmin
      .from('customers')
      .select('id, referrer_name, referred_by_customer_id')
      .eq('email', email)
      .maybeSingle();
    if (existingErr) throw existingErr;

    if (existing) {
      if (!existing.referrer_name && !existing.referred_by_customer_id) {
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
