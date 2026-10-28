-- READ ONLY. No tables/functions are created and no inventory is changed.
-- Current product options are evidence for a CANDIDATE, not historical proof.
-- Mixed migration breakdowns, gou packs and subscriptions need separate logic.
WITH source AS (
 SELECT i.id, i.product_title, i.selected_options, i.quantity, i.is_subscription,
        o.stripe_subscription_id, o.payment_status, o.order_status,
        p.title AS current_title, p.variants_config
 FROM public.order_items i
 JOIN public.orders o ON o.id=i.order_id
 LEFT JOIN public.products p ON p.id=i.product_id
 WHERE NOT EXISTS(SELECT 1 FROM public.kg_item_snapshots s WHERE s.item_id=i.id)
), evidence AS (
 SELECT s.*,
   ARRAY(SELECT m[1] FROM regexp_matches(s.product_title,'令和([0-9]{1,2})年産','g') m) AS years,
   ARRAY(SELECT m[1] FROM regexp_matches(lower(s.product_title),'([0-9]+(?:\.[0-9]+)?)\s*kg','g') m) AS weights,
   ARRAY(SELECT v FROM unnest(ARRAY['コシヒカリ','亀の尾','にこまる']) v WHERE strpos(s.product_title,v)>0) AS varieties,
   ARRAY(
    SELECT opt->>'value'
    FROM jsonb_array_elements(CASE WHEN jsonb_typeof(s.variants_config)='array' THEN s.variants_config ELSE '[]'::jsonb END) g
    CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(g->'options')='array' THEN g->'options' ELSE '[]'::jsonb END) opt
    WHERE jsonb_typeof(s.selected_options)='object'
      AND s.selected_options->>(g->>'id')=opt->>'id'
   ) AS milling_values
 FROM source s
), classified AS (
 SELECT e.*,
 CASE
  WHEN cardinality(varieties)=0 AND product_title !~ '(お米|米|ごはん|ご飯|合|ライス|食べ比べ)'
    AND product_title ~* '(Crescentmoon|cookie|クッキー|野菜セット|チケット)'
    THEN 'お米以外・対象外候補'
  WHEN is_subscription IS DISTINCT FROM false OR stripe_subscription_id IS NOT NULL
    OR product_title ~ '(年間契約|定期|全[0-9０-９]+回発送)' THEN '要確認：定期便・年間契約の発送照合'
  WHEN selected_options ? 'legacy_variant_breakdown' THEN '要確認：移行時の数量・精米内訳'
  WHEN product_title ~ '(合|セット|食べ比べ)' THEN '要確認：セット構成・実重量'
  WHEN product_title IS DISTINCT FROM current_title THEN '要確認：商品名の変更・商品情報なし'
  WHEN cardinality(varieties)<>1 THEN '要確認：品種が一意でない'
  WHEN cardinality(years)<>1 THEN '要確認：年産が一意でない'
  WHEN cardinality(weights)<>1 THEN '要確認：kg重量が一意でない'
  WHEN cardinality(milling_values)<>1 OR milling_values[1] NOT IN ('白米','玄米','分づき')
    THEN '要確認：精米区分の対応なし・重複'
  WHEN quantity IS NULL OR quantity<=0 OR quantity>10000 THEN '要確認：数量'
  WHEN payment_status IS NULL OR order_status IS NULL OR payment_status IN ('refunded','failed') OR order_status='cancelled'
    THEN '要確認：取消・返金・注文状態'
  ELSE '通常米・自動紐付け候補（現在の対応表による）'
 END AS decision
 FROM evidence e
), prepared AS (
 SELECT c.*,
 CASE WHEN cardinality(years)=1 THEN 2018+years[1]::integer END AS harvest_year,
 CASE WHEN decision='通常米・自動紐付け候補（現在の対応表による）'
   THEN weights[1]::numeric*quantity*
    CASE milling_values[1] WHEN '白米' THEN 1.1 WHEN '分づき' THEN 1.05 WHEN '玄米' THEN 1 END
 END AS candidate_raw_kg
 FROM classified c
)
SELECT decision AS 判定, harvest_year AS 年産, product_title AS 購入時の商品名,
       selected_options AS 購入時の選択肢, count(*) AS 明細数,
       sum(candidate_raw_kg) AS 候補玄米kg
FROM prepared
GROUP BY decision,harvest_year,product_title,selected_options
ORDER BY decision,harvest_year DESC NULLS LAST,count(*) DESC;
