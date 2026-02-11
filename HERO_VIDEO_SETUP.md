# ヒーロー動画の設定

ヒーロー動画は **Supabase Storage の MP4 のみ**を使用します（YouTube は使用しません）。初回表示が速く・スムーズになります。

## 1. Supabase Storage に MP4 をアップロード

### Step 1: バケットを確認・作成

1. [Supabase ダッシュボード](https://supabase.com/dashboard) にログイン
2. プロジェクトを選択
3. 左メニュー **Storage** をクリック
4. **site-images** バケットがあるか確認
   - なければ **New bucket** で作成（名前: `site-images`、**Public bucket** にチェック）

### Step 2: フォルダとファイルをアップロード

1. **site-images** をクリック
2. **New folder** で `hero` フォルダを作成
3. `hero` フォルダを開く
4. **Upload file** をクリック
5. ダウンロードした MP4 を選択してアップロード
6. アップロード後、ファイルをクリック
7. **Copy URL** で公開URLをコピー

URL の例:
```
https://xxxxx.supabase.co/storage/v1/object/public/site-images/hero/hero-video.mp4
```

## 2. 環境変数を設定

`.env.local` に以下を追加（または `Vercel` の環境変数に設定）:

```env
VITE_HERO_VIDEO_URL=https://xxxxx.supabase.co/storage/v1/object/public/site-images/hero/hero-video.mp4
```

※ `xxxxx` は Supabase プロジェクトIDに置き換え、ファイル名は実際の名前に合わせてください。

## 3. 反映を確認

- ローカル: 開発サーバーを再起動（`npm run dev`）
- 本番: Vercel に再デプロイ

ヒーロー部分が MP4 で表示されれば完了です。

**補足**: `VITE_HERO_VIDEO_URL` が未設定の場合、または MP4 の読み込みに失敗した場合は、プレースホルダー画像（田園風景）が表示されます。

## 動画の最適化のコツ

- **ファイルサイズ**: 5〜15MB 程度に圧縮すると読み込みが速くなります
- **解像度**: 1920×1080 程度で十分な場合が多いです
- **形式**: MP4（H.264）がブラウザで広く再生できます
