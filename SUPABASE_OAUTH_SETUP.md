# Supabase OAuth設定ガイド

## 📋 承認済みのリダイレクトURI設定

### Google OAuth設定

SupabaseでGoogleログインを使用する場合、**Google Cloud Console**で以下のリダイレクトURIを設定する必要があります。

#### 1. SupabaseのコールバックURL（必須）

```
https://[your-project-ref].supabase.co/auth/v1/callback
```

**`[your-project-ref]` の確認方法:**
1. Supabaseダッシュボードにログイン
2. プロジェクトを選択
3. Settings > API に移動
4. `Project URL` のURLから `https://` と `.supabase.co` の間の部分がプロジェクト参照IDです

**例:**
```
https://wlyqannomdudlapsolwp.supabase.co/auth/v1/callback
```

### Google Cloud Consoleでの設定手順

1. **Google Cloud Console**にアクセス
   - https://console.cloud.google.com/

2. **プロジェクトを選択**（または新規作成）

3. **APIとサービス > 認証情報**に移動

4. **OAuth 2.0 クライアント ID**を選択（または作成）

5. **承認済みのリダイレクト URI**セクションで以下を追加：

```
https://[your-project-ref].supabase.co/auth/v1/callback
```

6. **保存**をクリック

### Supabaseでの設定

1. **Supabaseダッシュボード**にログイン

2. **Authentication > Providers**に移動

3. **Google**を選択

4. **Enable Google provider**を有効化

5. **Client ID (for OAuth)** と **Client Secret (for OAuth)** を入力
   - Google Cloud Consoleで作成したOAuth 2.0クライアントIDとシークレットを使用

6. **Save**をクリック

## 🔍 リダイレクトURIの確認

### アプリケーション側のリダイレクト設定

コード内（`components/AuthForm.tsx`）では、以下のように設定されています：

```typescript
const redirectUrl = window.location.origin;
// 本番環境: https://honma-ec.vercel.app
// ローカル: http://localhost:3009
```

**重要:** 
- Google側で設定するリダイレクトURIは **SupabaseのコールバックURL** です
- アプリケーション側の `redirectTo` は、Supabaseが認証後にリダイレクトする先のURLです
- これらは異なるURLです

## 📝 設定チェックリスト

### Google Cloud Console
- [ ] OAuth 2.0 クライアントIDを作成
- [ ] 承認済みのリダイレクトURIに以下を追加：
  ```
  https://[your-project-ref].supabase.co/auth/v1/callback
  ```
- [ ] Client IDとClient Secretをコピー

### Supabase
- [ ] Authentication > Providers > Google を有効化
- [ ] Client IDを入力
- [ ] Client Secretを入力
- [ ] Saveをクリック

### アプリケーション（Vercel）
- [ ] 環境変数 `VITE_SUPABASE_URL` が設定されている
- [ ] 環境変数 `VITE_SUPABASE_ANON_KEY` が設定されている

## ⚠️ よくある問題

### 問題1: "redirect_uri_mismatch" エラー

**原因:** Google Cloud Consoleで設定したリダイレクトURIがSupabaseのコールバックURLと一致していない

**解決方法:**
1. Supabaseのプロジェクト参照IDを確認
2. Google Cloud Consoleで正確なURLを設定：
   ```
   https://[your-project-ref].supabase.co/auth/v1/callback
   ```
3. 末尾のスラッシュ（`/`）は不要です

### 問題2: 認証後に正しいページにリダイレクトされない

**原因:** アプリケーション側の `redirectTo` 設定が正しくない

**解決方法:**
- `components/AuthForm.tsx` の90行目で `window.location.origin` を使用しているため、自動的に現在のドメインにリダイレクトされます
- カスタムリダイレクトが必要な場合は、`redirectTo` を変更してください

### 問題3: ローカル環境で動作しない

**原因:** ローカル環境（`http://localhost:3009`）がGoogle Cloud Consoleの承認済みリダイレクトURIに含まれていない

**解決方法:**
- 開発環境用に、Google Cloud Consoleで以下も追加できます：
  ```
  http://localhost:3009
  ```
- ただし、通常はSupabaseのコールバックURLのみで動作します

## 🔗 参考リンク

- [Supabase OAuth設定ドキュメント](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Supabase Authentication](https://supabase.com/docs/guides/auth)

