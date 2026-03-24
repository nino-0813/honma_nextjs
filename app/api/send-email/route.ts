import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/resend';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { recipients, subject, body: emailBody } = body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: '送信先が必要です' }, { status: 400 });
    }

    if (!subject || !emailBody) {
      return NextResponse.json({ error: '件名と本文が必要です' }, { status: 400 });
    }

    const result = await sendEmail(recipients, subject, emailBody);
    return NextResponse.json({
      success: true,
      successful: result.successful,
      failed: result.failed,
      failedEmails: result.failedEmails,
    });
  } catch (error: any) {
    console.error('メール送信エラー:', error);
    return NextResponse.json(
      { error: error?.message || 'メール送信に失敗しました' },
      { status: 500 }
    );
  }
}
