import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: any, res: any) {
  // CORSヘッダーを設定
  if (res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
  }

  if (req.method === 'OPTIONS') {
    if (res) {
      res.status(200).end();
    }
    return { statusCode: 200 };
  }

  if (req.method !== 'POST') {
    const error = { error: 'Method not allowed' };
    if (res) {
      return res.status(405).json(error);
    }
    return {
      statusCode: 405,
      body: JSON.stringify(error),
    };
  }

  // --- Guard: APIキー必須（使う時だけ有効化できる） ---
  const requiredApiKey = process.env.SEND_EMAIL_API_KEY;
  if (!requiredApiKey) {
    const error = { error: 'send-email endpoint is disabled' };
    if (res) return res.status(403).json(error);
    return { statusCode: 403, body: JSON.stringify(error) };
  }

  const headerApiKey =
    (req?.headers?.['x-api-key'] as string | undefined) ||
    (req?.headers?.['X-API-Key'] as string | undefined);

  if (!headerApiKey || headerApiKey !== requiredApiKey) {
    const error = { error: 'Unauthorized' };
    if (res) return res.status(401).json(error);
    return { statusCode: 401, body: JSON.stringify(error) };
  }

  try {
    // Vercel Serverless Functionsとローカル開発の両方に対応
    const body = req.body || (req as any);
    const { recipients, subject, body: emailBody } = body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      const error = { error: '送信先が必要です' };
      if (res) {
        return res.status(400).json(error);
      }
      return {
        statusCode: 400,
        body: JSON.stringify(error),
      };
    }

    if (!subject || !emailBody) {
      const error = { error: '件名と本文が必要です' };
      if (res) {
        return res.status(400).json(error);
      }
      return {
        statusCode: 400,
        body: JSON.stringify(error),
      };
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      const error = { error: 'Resend APIキーが設定されていません' };
      if (res) {
        return res.status(500).json(error);
      }
      return {
        statusCode: 500,
        body: JSON.stringify(error),
      };
    }

    // Resendインスタンスを再作成（環境変数が動的に変更される場合に対応）
    const resendClient = new Resend(apiKey);

    // 送信元メールアドレス（Resendで設定したドメインを使用）
    // 注意: Resendでドメインを設定する必要があります
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    // 各受信者にメールを送信
    const emailPromises = recipients.map((email: string) =>
      resendClient.emails.send({
        from: fromEmail,
        to: email,
        subject: subject,
        html: emailBody.replace(/\n/g, '<br>'), // 改行を<br>に変換
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

    const response = {
      success: true,
      message: `${successful}件のメールを送信しました${failed > 0 ? `（${failed}件失敗）` : ''}`,
      successful,
      failed,
      failedEmails,
    };

    if (res) {
      return res.status(200).json(response);
    }
    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (error: any) {
    console.error('メール送信エラー:', error);
    const errorResponse = {
      error: 'メール送信に失敗しました',
      details: error.message,
    };
    if (res) {
      return res.status(500).json(errorResponse);
    }
    return {
      statusCode: 500,
      body: JSON.stringify(errorResponse),
    };
  }
}

