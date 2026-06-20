// Brevo（旧Sendinblue）トランザクションメール送信ユーティリティ
// - 環境変数 BREVO_API_KEY が必要
// - 送信元は BREVO_FROM_EMAIL / BREVO_FROM_NAME（Brevoで認証済みの送信者であること）
//   ※ Brevoのテンプレートを使う場合、送信元はテンプレート側の設定が優先される

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

type BrevoRecipient = { email: string; name?: string };

export interface SendBrevoEmailParams {
  to: BrevoRecipient[];
  /** Brevoのテンプレートを使う場合はテンプレートID（指定時は subject/htmlContent は不要） */
  templateId?: number;
  /** テンプレートに差し込むパラメータ（{{ params.xxx }} に対応） */
  params?: Record<string, unknown>;
  /** テンプレートを使わない場合の件名 */
  subject?: string;
  /** テンプレートを使わない場合のHTML本文 */
  htmlContent?: string;
  /** 任意：プレーンテキスト版 */
  textContent?: string;
}

/**
 * Brevo のトランザクションメールAPIでメールを送信する。
 * - templateId を渡すと、Brevo側のテンプレートで送信する（params が差し込まれる）。
 * - templateId を渡さない場合は subject + htmlContent で送信する。
 * - 失敗時は例外を投げるので、呼び出し側で try/catch すること。
 */
export async function sendBrevoEmail({
  to,
  templateId,
  params,
  subject,
  htmlContent,
  textContent,
}: SendBrevoEmailParams): Promise<{ messageId?: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error('BREVO_API_KEY が設定されていません。');
  }

  const body: Record<string, unknown> = { to };

  if (templateId) {
    // テンプレート送信：送信元・件名・本文はテンプレート側を使用
    body.templateId = templateId;
    if (params) body.params = params;
  } else {
    // 直接送信：送信元アドレスが必要
    const fromEmail = process.env.BREVO_FROM_EMAIL;
    if (!fromEmail) {
      throw new Error('BREVO_FROM_EMAIL が設定されていません（Brevoで認証済みの送信者アドレス）。');
    }
    const fromName = process.env.BREVO_FROM_NAME || 'イケベジ';
    body.sender = { email: fromEmail, name: fromName };
    if (subject) body.subject = subject;
    if (htmlContent) body.htmlContent = htmlContent;
    if (textContent) body.textContent = textContent;
  }

  const res = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Brevo送信失敗 (HTTP ${res.status}): ${text}`);
  }

  const data = await res.json().catch(() => ({}));
  return { messageId: data?.messageId };
}
