export const config = {
  matcher: [
    '/admin/:path*',
  ],
};

// 環境変数を安全に取得する関数
function getEnvVar(key: string): string {
  try {
    // まずprocess.envを試す（Node.js環境）
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] || '';
    }
  } catch (e) {
    // process.envが利用できない場合は無視
  }
  
  // process.envが使えない場合は空文字列を返す（認証をスキップ）
  return '';
}

export default function middleware(request: Request) {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Basic認証を無効化（管理画面ログインフォームを使用）
    // すべてのリクエストをそのまま通過させる
    return;
  } catch (error) {
    // エラーが発生した場合、ログを出力してリクエストを通過させる
    console.error('Middleware error:', error);
    // エラー時もリクエストを通過（何も返さない = undefinedを返す）
    return;
  }
}

