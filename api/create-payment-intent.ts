// Vercel Serverless Function for creating Stripe PaymentIntent
// このファイルはVercel Serverless Functionとして自動的にデプロイされます

// Vercel Request/Response型定義（@vercel/nodeが利用できない場合の代替）
type VercelRequest = {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (data: any) => void;
  setHeader: (name: string, value: string) => void;
  end: () => void;
};

export default async function handler(req: VercelRequest, res?: VercelResponse) {
  // CORSヘッダーを設定
  if (res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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

  try {
    // Stripe SDKを動的にインポート（Vercel Serverless Functionsで使用可能）
    const Stripe = (await import('stripe')).default;
    
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      const error = { error: 'Stripe Secret Keyが設定されていません' };
      if (res) {
        return res.status(500).json(error);
      }
      return {
        statusCode: 500,
        body: JSON.stringify(error),
      };
    }

    // apiVersionは固定せず、Stripeアカウント側のAPIバージョンに従う
    const stripe = new Stripe(stripeSecretKey);

    // リクエストボディを取得（Vercel Serverless Functions形式に対応）
    let body: any;
    if (req.body) {
      // 既にパースされている場合
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } else if ((req as any).body) {
      body = typeof (req as any).body === 'string' ? JSON.parse((req as any).body) : (req as any).body;
    } else {
      // リクエスト全体がボディの場合（Vercel Edge Functions形式）
      body = req;
    }

    const { amount, currency = 'jpy', metadata = {} } = body;

    if (!amount || amount <= 0) {
      const error = { error: '金額が無効です' };
      if (res) {
        return res.status(400).json(error);
      }
      return {
        statusCode: 400,
        body: JSON.stringify(error),
      };
    }

    // PaymentIntentを作成
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // 金額（円単位、Stripeは最小通貨単位を使用）
      currency: currency.toLowerCase(),
      metadata: metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    if (res) {
      return res.status(200).json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        livemode: paymentIntent.livemode,
        secretKeyPrefix: stripeSecretKey.startsWith('sk_test')
          ? 'sk_test'
          : stripeSecretKey.startsWith('sk_live')
            ? 'sk_live'
            : 'unknown',
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        livemode: paymentIntent.livemode,
        secretKeyPrefix: stripeSecretKey.startsWith('sk_test')
          ? 'sk_test'
          : stripeSecretKey.startsWith('sk_live')
            ? 'sk_live'
            : 'unknown',
      }),
    };
  } catch (error: any) {
    console.error('PaymentIntent作成エラー:', error);
    const errorMessage = error.message || 'PaymentIntentの作成に失敗しました';
    const errorResponse = { error: errorMessage };

    if (res) {
      return res.status(500).json(errorResponse);
    }

    return {
      statusCode: 500,
      body: JSON.stringify(errorResponse),
    };
  }
}

