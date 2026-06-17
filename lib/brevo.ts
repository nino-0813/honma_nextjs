// Brevo（旧Sendinblue）トランザクションメール送信ユーティリティ
// - 環境変数 BREVO_API_KEY が必要
// - 送信元は BREVO_FROM_EMAIL / BREVO_FROM_NAME（Brevoで認証済みの送信者であること）

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

type BrevoRecipient = { email: string; name?: string };

export interface SendBrevoEmailParams {
  to: BrevoRecipient[];
  subject: string;
  htmlContent: string;
  /** 任意：プレーンテキスト版 */
  textContent?: string;
}

/**
 * Brevo のトランザクションメールAPIでメールを送信する。
 * - 失敗時は例外を投げるので、呼び出し側で try/catch すること。
 */
export async function sendBrevoEmail({
  to,
  subject,
  htmlContent,
  textContent,
}: SendBrevoEmailParams): Promise<{ messageId?: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error('BREVO_API_KEY が設定されていません。');
  }

  const fromEmail = process.env.BREVO_FROM_EMAIL;
  if (!fromEmail) {
    throw new Error('BREVO_FROM_EMAIL が設定されていません（Brevoで認証済みの送信者アドレス）。');
  }
  const fromName = process.env.BREVO_FROM_NAME || 'イケベジ';

  const res = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { email: fromEmail, name: fromName },
      to,
      subject,
      htmlContent,
      ...(textContent ? { textContent } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Brevo送信失敗 (HTTP ${res.status}): ${text}`);
  }

  const data = await res.json().catch(() => ({}));
  return { messageId: data?.messageId };
}
