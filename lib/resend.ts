import { Resend } from 'resend';

// Resend APIクライアントを初期化
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('Resend APIキーが設定されていません。.env.localにRESEND_API_KEYを設定してください。');
  }
  return new Resend(apiKey);
};

// メール送信関数
export const sendEmail = async (
  recipients: string[],
  subject: string,
  body: string
): Promise<{ successful: number; failed: number; failedEmails: string[] }> => {
  const resend = getResendClient();
  
  // 送信元メールアドレス（Resendで設定したドメインを使用）
  // カスタムドメインの場合は .env.local で RESEND_FROM_EMAIL を設定
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';

  // 各受信者にメールを送信
  const emailPromises = recipients.map((email: string) =>
    resend.emails.send({
      from: fromEmail,
      to: email,
      subject: subject,
      html: body.replace(/\n/g, '<br>'), // 改行を<br>に変換
    })
  );

  const results = await Promise.allSettled(emailPromises);

  // 成功と失敗をカウント
  const successful = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  // 失敗したメールアドレスを取得
  const failedEmails = recipients.filter((email: string, index: number) => 
    results[index].status === 'rejected'
  );

  return {
    successful,
    failed,
    failedEmails,
  };
};

