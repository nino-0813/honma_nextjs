# ローカル用 `.env.local` テンプレ

このプロジェクトは **Vite** なので、フロントで使う環境変数は **`VITE_` プレフィックス必須**です。

## 1) `.env.local` を作成

プロジェクト直下に `.env.local` を作成して、以下を貼り付けてください。

```bash
# Supabase（必須）
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe（フロント側・任意）
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 2) 値の取得場所

`ENV_VARIABLES.md` の「Supabase設定」を参照してください（Supabase Dashboard → Settings → API）。

## 3) 開発サーバーを再起動

`.env.local` を追加/変更したら、Vite を **再起動**してください（起動中のターミナルで停止して再実行）。


