// 管理者用: 発送通知メール（Brevoテンプレート #2）を手動送信するAPI
// 管理画面で伝票番号を保存した際、または伝票番号CSVインポート時に呼ばれる
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendBrevoEmail } from '@/lib/brevo';

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

const SHIPPING_TEMPLATE_ID = Number(getEnv('BREVO_SHIPPING_TEMPLATE_ID') || 2); // 発送メール（お客様向け）
const numJa = (n: number) => Number(n || 0).toLocaleString('ja-JP');

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabaseが設定されていません' }, { status: 500 });
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

    const body = (await request.json()) as { orderId?: string };
    const orderId = body?.orderId;
    if (!orderId) {
      return NextResponse.json({ error: 'orderIdが必要です' }, { status: 400 });
    }

    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('*, order_items (product_title, quantity, variant, selected_options)')
      .eq('id', orderId)
      .maybeSingle();
    if (orderErr) throw orderErr;
    if (!order) {
      return NextResponse.json({ error: '注文が見つかりません' }, { status: 404 });
    }
    if (!order.email) {
      return NextResponse.json({ error: 'この注文にはメールアドレスが登録されていません' }, { status: 400 });
    }

    const customerName = `${order.last_name ?? ''}${order.first_name ? ` ${order.first_name}` : ''}`.trim() || 'お客様';

    const optionsLabel = (it: any): string => {
      if (it.variant) return `（${it.variant}）`;
      const opts = it.selected_options;
      if (opts && typeof opts === 'object') {
        const parts = Object.values(opts).filter(Boolean);
        if (parts.length) return `（${parts.join(' / ')}）`;
      }
      return '';
    };

    const items = (order.order_items || []).map((it: any) => ({
      product_name: `${it.product_title ?? '商品'}${optionsLabel(it)}`,
      quantity: Number(it.quantity || 0),
    }));

    const result = await sendBrevoEmail({
      to: [{ email: order.email, name: customerName }],
      templateId: SHIPPING_TEMPLATE_ID,
      params: {
        name: customerName,
        order_number: order.order_number || orderId,
        shipping_company: order.shipping_carrier || '',
        shipping_number: order.tracking_number || '',
        items,
        subtotal: numJa(order.subtotal),
        shipping_cost: numJa(order.shipping_cost),
        total: numJa(order.total),
      },
    });

    return NextResponse.json({ ok: true, messageId: result.messageId });
  } catch (error: any) {
    console.error('[ShippingMail] send failed:', error);
    return NextResponse.json({ error: error?.message || '発送メールの送信に失敗しました' }, { status: 500 });
  }
}
