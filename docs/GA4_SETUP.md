# GA4 設定一覧

## 現在の構成

- 測定ID: `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- 本番・リニューアル環境で確認できた測定ID: `G-4QB23KJPWK`
- タグ方式: Google tag (`gtag.js`)
- 読み込み元: `app/layout.tsx`
- イベント送信の共通処理: `lib/analytics.ts`
- ページ遷移の監視: `components/RootClientEffects.tsx`
- Vercel Analytics: GA4とは別サービスとして併用
- Google Tag Manager (`GTM-...`): 未使用

測定IDが未設定の環境ではGA4タグを読み込まず、イベント関数は何も送信しません。

## 計測イベント

| イベント | 発火条件 | 実装箇所 |
| --- | --- | --- |
| `page_view` | 初回表示、Next.js内のページ遷移 | `components/RootClientEffects.tsx` |
| `view_item` | 商品詳細を表示 | `app/(main)/products/[handle]/ProductDetailView.tsx` |
| `add_to_cart` | 通常商品・定期商品をカートへ追加 | `app/(main)/products/[handle]/ProductDetailView.tsx` |
| `view_cart` | 商品が入ったカートを開く | `components/Drawers.tsx` |
| `remove_from_cart` | カートから商品を削除 | `components/Drawers.tsx` |
| `begin_checkout` | レジに進む | `components/Drawers.tsx` |
| `purchase` | カード決済の支払い完了を注文データで確認 | `app/(main)/checkout/success/CheckoutSuccessClient.tsx` |

ECイベントの通貨は `JPY` です。商品には `item_id`、`item_name`、`price`、`quantity` を送り、取得できる場合はカテゴリ・バリエーション・通常購入/定期購入も付与します。

## 重複計測対策

- Google tag の自動 `page_view` は `send_page_view: false` で停止しています。
- `page_view` は共通処理から手動送信し、クライアント遷移も計測します。
- `purchase` は画面内の参照値と `localStorage` の決済IDで再送を防止します。
- 同じGA4測定IDをGoogle Tag Managerなどから追加しないでください。

## Vercelで必要な環境変数

```text
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-4QB23KJPWK
```

ProductionとPreviewの両方に設定します。値を変更した場合は再デプロイが必要です。

## 動作確認

1. GA4の「管理」→「DebugView」を開く。
2. ChromeのTag Assistantで対象サイトへ接続する。
3. トップ、商品詳細、カート、チェックアウトの順に操作する。
4. 上記イベントが各操作につき1回だけ表示されることを確認する。
5. 購入テストでは `purchase` の `transaction_id`、`value`、`items` を確認する。

銀行振込は注文受付時点では入金完了ではないため、現在は `purchase` を送信しません。入金確認時の購入計測を行う場合は、管理画面またはサーバー側からGA4 Measurement Protocolで送信する設計が必要です。
