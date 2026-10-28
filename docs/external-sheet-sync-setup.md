# 外部シート連携の準備・確認手順

## 現在の段階

ローカルコードのみ。GASの登録・トリガー作成、SQLの本番適用、Vercel環境変数の登録、デプロイは未実施。
この段階の「保存」は取込保留データを保存する意味であり、在庫数や顧客台帳への反映ではない。
椎茸の開始在庫は2026-10-20営業前18個と確認済み。管理画面で基準日・棚卸し時点・数量を保存するには、別の `migration_add_shiitake_stock_baseline.sql` も必要（本番未適用）。推定在庫は引き続きサンプル表示で、売上減算・実補充台帳はまだ未接続。

## 実装時の検証（2026/10/28）

- API/変換/GASのテスト24件（うち新規13件）成功。認証・dry-run・取消・重複・サイズ上限・個人情報列除外・ロック解放を確認。
- 全体テスト、TypeScript型チェック、Next.js本番ビルド成功。
- 使い捨てローカルPostgreSQLでSQLを実行し、同一内容の再送、取消への更新、古いスナップショット拒否、履歴件数、RPC権限、管理者/非管理者のRLSを確認。テストサーバーは停止済み。
- 本物のGAS実行環境→公開API→Supabaseの通し試験は未実施。

## 1. テストDB

本番ではなくテスト用Supabaseプロジェクトに `migration_add_external_sheet_staging.sql` を適用。
`profiles(id,is_admin)` と `auth.uid()` が既存どおり存在する前提。
新規2テーブルと受付関数のみで、既存注文・入出庫・クーポン等は更新しない。
RLSで管理者だけ参照、一般利用者は書込不可。APIだけがservice_roleで受付関数を実行する。

## 2. テストデプロイのサーバー設定

- `EXTERNAL_SHEET_SYNC_ENABLED=true`（未設定は停止）
- `SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`：**テストDB**の値。既存のPreview接続を確認。
- `EXTERNAL_SHEET_TOKEN_RICE_TABECHOKU`
- `EXTERNAL_SHEET_TOKEN_RICE_SATOFURU`
- `EXTERNAL_SHEET_TOKEN_RICE_FURUSATODO`
- `EXTERNAL_SHEET_TOKEN_SHIITAKE_YORANKASHA`
- `EXTERNAL_SHEET_TOKEN_SHIITAKE_OTHER`

各キーは別々のランダム値（32文字以上）を使用。接続するソースだけ設定する。
`NEXT_PUBLIC_`を付けない。キーはチャット・シート・Gitに書かない。
シート1の販売元は未確認なので、当面OTHERのキーは設定しない。

## 3. GAS（独立プロジェクト）

1. 既存のメール取込GASとは別プロジェクトを作り、`scripts/gas/external-sheet-sync.gs` を貼る。
2. 実行アカウントに両シートの閲覧権限を付ける。
3. プロジェクトのスクリプトプロパティに以下を設定。
   - `IKEVEGE_SYNC_ORIGIN`：テストデプロイのHTTPS origin（パス・末尾スラッシュなし）。
   - `IKEVEGE_SYNC_MODE=dry_run`（未設定でもdry-run）。
   - `IKEVEGE_SYNC_TOKEN_<SOURCE_ID大文字>`：対応するサーバー秘密キーと同じ値。
4. `syncIkevegeExternalSheets` を手動実行。最初は自動トリガーを作らない。
5. ログはタブ別の明細数・要確認数のみ。住所・顧客名・メールID・秘密キーは出さない。

GASはシートの全明細を一括読取し、許可列だけ送る。Date型はJSTの日付へ変換する。
原シートに書かないため、追加列が空欄でも有効や年産を推測して埋めない。
失敗時は次の手動実行で再送。成功タブは保持し、同一内容を再送しても変更履歴は重複しない。
HTTPリダイレクトには追従しない（認証キーの別ホスト転送を防止）。保護されたPreviewへは承認されたアクセス手段が別途必要。

参照：[Google公式 UrlFetchApp](https://developers.google.com/apps-script/reference/url-fetch/url-fetch-app)、[PropertiesService](https://developers.google.com/apps-script/reference/properties/properties-service)。

## 4. テスト環境で保存確認

1. dry-runで想定した明細数と要確認数になることを確認。
2. GASの `IKEVEGE_SYNC_MODE=save` に変更して手動実行。
3. 管理者として最新取込と履歴を参照。同じ内容を再実行してrevisionが増えないことを確認。
4. **テスト用シート／テストデータ**で有効→キャンセル、数量変更、重複、年産未登録、行削除を検証。本番の顧客行は試験用に編集しない。
5. 古い読取結果が新しいものを上書きしないこと、未認証・非管理者が参照／書込できないことを確認。

ソース全体を保存するため、行削除・明細ID変更・仮キー変更は監査履歴との照合対象。削除を自動取消にしない。
在庫への接続は、不変の明細ID・年産・精米区分・取消の意味・棚卸基準・既存EC/手動記録との重複照合を確認した次工程。
「inventoryReady」は入力上必要項目が揃った意味だけで、在庫計上済みという意味ではない。

## 停止

`EXTERNAL_SHEET_SYNC_ENABLED`をfalseにして再デプロイ、GASのトリガーがあれば停止する。
保存済みデータを削除したり、EC注文・在庫を巻き戻す操作は不要（この処理では変更しない）。
漏えい時は該当ソースのキーをサーバーとGASの両方で交換する。
