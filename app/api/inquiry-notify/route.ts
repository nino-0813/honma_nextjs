// お問い合わせフォーム送信時に管理者へ通知メール（Brevoテンプレート #6）を送るAPI
import { NextResponse } from 'next/server';
import { sendBrevoEmail } from '@/lib/brevo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const INQUIRY_TEMPLATE_ID = Number(process.env.BREVO_INQUIRY_TEMPLATE_ID || 6);
const ADMIN_NOTIFY_EMAIL = process.env.BREVO_ADMIN_EMAIL || 'info@ikevege.com';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      phone?: string;
      company?: string;
      message?: string;
    };
    const { name, email, phone, company, message } = body ?? {};
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'name/email/messageが必要です' }, { status: 400 });
    }

    const result = await sendBrevoEmail({
      to: [{ email: ADMIN_NOTIFY_EMAIL, name: 'イケベジ' }],
      templateId: INQUIRY_TEMPLATE_ID,
      params: {
        name,
        address: email,
        phone: phone || '',
        companyname: company || '',
        content: message,
      },
    });

    return NextResponse.json({ ok: true, messageId: result.messageId });
  } catch (error: any) {
    console.error('[InquiryMail] send failed:', error);
    return NextResponse.json({ error: error?.message || '問合せ通知メールの送信に失敗しました' }, { status: 500 });
  }
}
