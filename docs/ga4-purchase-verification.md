# GA4 purchase 修正・検証

対象ブランチ: `fix/ga4-purchase-retry`
開始時の HEAD / fetch 後の origin/main: `e1f4fe88e7f1ff7900ecdbd9111142adf42a5393`
開始時に未コミット変更なし。

## 挙動

- 注文番号は pending でも表示する。注文確認は最大10回、応答後1秒間隔で継続し、paid と注文番号が揃った場合だけ purchase を試みる。
- タグの不在・例外は最大10回、1秒間隔で再試行する。注文取得を含む全体の上限は30秒。離脱時はタイマーとリクエストを中止し、遅れて戻る応答を無視する。
- タグへの引き渡し結果を `handed_off` / `unavailable` / `error` として区別する。`handed_off` のみ記録する。これは GA4 受信確認ではない。
- transaction_id は従来どおり注文番号。value / shipping の定義も変更していない。
- 既存の `ga4_purchase_${paymentIntentId}` を尊重し、削除・移行・過去注文の一括再送は行わない。以前の不具合で誤って記録されたフラグも維持する。
- メモリで StrictMode / 再マウントを抑止し、localStorage で再読み込みを抑止。localStorage 書き込み失敗時は sessionStorage を補助として使う。

## 検証

`npm test`（Vitest / jsdom / React Testing Library）、`npx tsc --noEmit --incremental false`、`git diff --check`、`npm run build`。23件のモックテストと型チェックに成功。

注文API、gtag、タイマー、ストレージをモックし、pending→paid、pending 継続、タグ遅延・不在・例外と回復、ストレージ読み書き例外、StrictMode・再レンダー・再マウント・再読み込み相当、既存フラグ、離脱後応答、タグ待機中の離脱、30秒上限、取得失敗、payment_intent 切替を検証する。実決済・本番GA4送信は行わない。

## 制約

- タグ呼び出しが正常終了しても広告ブロックや通信失敗等による GA4 未受信は検出できない。タグが処理後に例外を投げるケースも受信状態は不明であり、再試行は同じ transaction_id を使う。
- localStorage の読み取りができない場合も、sessionStorage の読める既存フラグは尊重する。両方の記録が不明な場合は、初回送信の欠落を避けるため同じ transaction_id で送信を継続する。メモリ内では正常な引き渡し後の再呼び出しを抑止する。
- localStorage / sessionStorage の両方に保存できなければ、同一ドキュメント内のみ抑止できる。保存データ消去や複数タブ同時実行を含む厳密な exactly-once は保証しない。
- 上限後の paid 化やタグ準備完了は、この表示中には計測しない。永続的なサーバー側購入計測は対象外。
- Apps Script、銀行振込・継続課金のサーバー計測、認証・環境変数は未変更。push / PR / マージ / デプロイなし。

## 最終レビュー

以前の「読み取り不能なら送信しない」方式は重複リスクを下げる一方、初回購入も確実に欠落する。このため今回は計測漏れの軽減を優先し、保存状態が不明でも送信を試みる方式に変更した。読める既存フラグは引き続き尊重し、過去フラグの削除や過去注文の一括送信は行わない。

[Google の公式説明](https://support.google.com/analytics/answer/12313109?hl=en)では、transaction_id による purchase 重複排除は Web ストリームの同一ユーザーについて説明されており、アプリストリームは対象外。注文ごとに一意で空でない ID が必要。したがってユーザー識別が変わる別ブラウザーや Cookie 消去等をまたぐ重複排除を保証とは扱わない。保存不能で再読み込みした場合は再度タグを呼ぶ可能性があり、同じ注文番号を維持することで Google 側の重複排除を補助的に利用する。これは受信保証や厳密な exactly-once ではない。

同一ドキュメントの同時マウントは共有 Set と同期的な引き渡し・記録で正常な引き渡しを1回に抑止する。タグが遅れるケースとストレージが全て使用不能なケースをテスト済み。各 effect は独立して最大10回の取得・タグ試行を持つため、同時マウント時の取得や失敗したタグ試行の総数は増え得る。別タブ間の排他制御はない。

追加した開発用依存は @testing-library/react 16.3.0、jsdom 26.1.0、vitest 3.2.4（package.json は ^ 指定）。本番 dependencies は変更なし。lockfile の既存パッケージについてバージョン変更・削除がないことを比較確認済み。

最終変更後の `npm run build` は終了コード0で成功（53ページ生成）。build は Google Fonts の取得失敗によるフォント最適化スキップと Browserslist データの古さを警告する。環境変数や認証情報は変更していない。
