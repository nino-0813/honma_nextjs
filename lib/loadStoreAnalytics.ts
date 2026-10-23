import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchAllAnalyticsPages,
  type AnalyticsData,
  type AnalyticsOrder,
  type AnalyticsItem,
  type AnalyticsSubscription,
  type AnalyticsTarget,
  type AnalyticsInventory,
} from "./storeAnalytics";
function readAll<T>(
  client: SupabaseClient,
  table: string,
  columns: string,
  key = "id",
) {
  return fetchAllAnalyticsPages<T>(async (from, to) => {
    const result = await client
      .from(table)
      .select(columns, { count: "exact" })
      .order(key, { ascending: true })
      .range(from, to);
    return {
      data: result.data as unknown as T[] | null,
      error: result.error,
      count: result.count,
    };
  });
}
export async function loadStoreAnalytics(
  client: SupabaseClient,
): Promise<AnalyticsData> {
  const [orders, items, subscriptions, targets, products, inventory] =
    await Promise.allSettled([
      readAll<AnalyticsOrder>(
        client,
        "orders",
        "id,total,payment_status,order_status,email,auth_user_id,created_at,paid_at",
      ),
      readAll<AnalyticsItem>(
        client,
        "order_items",
        "id,order_id,product_id,product_title,line_total",
      ),
      readAll<AnalyticsSubscription>(
        client,
        "subscriptions",
        "id,created_at,canceled_at,status,metadata",
      ),
      readAll<AnalyticsTarget>(
        client,
        "analytics_yearly_targets",
        "year,revenue_target,gross_profit_target",
        "year",
      ),
      client.from("products").select("id", { count: "exact", head: true }),
      client.rpc("kg_report"),
    ]);
  if (orders.status === "rejected")
    throw new Error(
      `注文を取得できませんでした：${orders.reason instanceof Error ? orders.reason.message : "通信エラー"}`,
    );
  const warnings: string[] = [];
  if (items.status === "rejected")
    warnings.push(
      "商品明細を取得できないため、人気商品の集計は表示できません。",
    );
  if (subscriptions.status === "rejected")
    warnings.push(
      "定期便データを取得できないため、契約数・解約数は未取得です。",
    );
  if (targets.status === "rejected")
    warnings.push(
      "目標設定を読み込めませんでした。未導入の場合は目標用SQLの適用が必要です。読み込み失敗中は保存できません。",
    );
  const inventoryData =
    inventory.status === "fulfilled" && !inventory.value.error
      ? (inventory.value.data as AnalyticsInventory | null)
      : null;
  if (!inventoryData)
    warnings.push("在庫データは未取得です。詳細は在庫管理で確認してください。");
  return {
    orders: orders.value,
    items: items.status === "fulfilled" ? items.value : null,
    subscriptions:
      subscriptions.status === "fulfilled" ? subscriptions.value : null,
    targets: targets.status === "fulfilled" ? targets.value : [],
    targetsReady: targets.status === "fulfilled",
    productCount:
      products.status === "fulfilled" && !products.value.error
        ? products.value.count
        : null,
    inventory: inventoryData,
    warnings,
  };
}
