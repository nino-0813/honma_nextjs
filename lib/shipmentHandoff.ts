import { shipmentDay, orderShipmentDay } from "./adminShipmentData";
export type ShipmentHandoff = {
  version: 1;
  createdAt: string;
  rows: { subscriptionId: string; day: string; orderId: string | null }[];
};
export function shipmentTargets(sub: any, orders: any[], month = "") {
  if (!["active", "trialing", "past_due", "unpaid"].includes(sub.status))
    return [];
  const related = orders
    .filter((o) => o.stripe_subscription_id === sub.stripe_subscription_id)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const completed = (o: any) =>
    ["shipped", "delivered"].includes(o.order_status) ||
    (o.order_items?.length &&
      o.order_items.every((i: any) => i.shipping_status === "shipped"));
  const dayOf = (o: any) => orderShipmentDay(o, sub, related[0]?.id);
  const days = new Set<string>();
  for (const order of related) {
    const day = dayOf(order);
    if (day && order.order_status !== "cancelled" && !completed(order))
      days.add(day);
  }
  const next = shipmentDay(sub);
  if (next && !related.some((o) => dayOf(o) === next && completed(o)))
    days.add(next);
  return [...days]
    .filter((day) => !month || day.startsWith(month))
    .sort()
    .map((day) => {
      const matches = related.filter(
        (o) =>
          dayOf(o) === day && o.order_status !== "cancelled" && !completed(o),
      );
      return {
        subscriptionId: sub.stripe_subscription_id as string,
        day,
        orderId: matches.length === 1 ? (matches[0].id as string) : null,
      };
    });
}
export function buildShipmentHandoff(
  subscriptions: any[],
  orders: any[],
  month = "",
): ShipmentHandoff {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    rows: subscriptions.flatMap((sub) => shipmentTargets(sub, orders, month)),
  };
}
export function parseShipmentHandoff(raw: string | null): ShipmentHandoff {
  if (!raw || raw.length > 2_000_000)
    throw new Error(
      "発送対象の選択情報がありません。定期購入から選び直してください。",
    );
  const value = JSON.parse(raw);
  if (
    value.version !== 1 ||
    !Array.isArray(value.rows) ||
    !value.rows.length ||
    value.rows.length > 10000 ||
    !Number.isFinite(Date.parse(value.createdAt)) ||
    Math.abs(Date.now() - Date.parse(value.createdAt)) > 24 * 3600_000 ||
    !value.rows.every(
      (r: any) =>
        typeof r.subscriptionId === "string" &&
        r.subscriptionId.length <= 200 &&
        /^\d{4}-\d{2}-\d{2}$/.test(r.day) &&
        (r.orderId === null ||
          (typeof r.orderId === "string" && r.orderId.length <= 100)),
    )
  )
    throw new Error(
      "発送対象の選択が無効または期限切れです。選び直してください。",
    );
  if (
    new Set(value.rows.map((r: any) => `${r.subscriptionId}:${r.day}`)).size !==
    value.rows.length
  )
    throw new Error("選択情報が重複しています");
  return value;
}
export function resolveShipmentHandoff(
  selection: ShipmentHandoff,
  subscriptions: any[],
  orders: any[],
) {
  const matched: any[] = [],
    review: { subscriptionId: string; day: string; reason: string }[] = [];
  for (const row of selection.rows) {
    const sub = subscriptions.find(
      (s) => s.stripe_subscription_id === row.subscriptionId,
    );
    const target =
      sub && shipmentTargets(sub, orders).find((t) => t.day === row.day);
    if (target?.orderId && row.orderId && target.orderId === row.orderId)
      matched.push(orders.find((o) => o.id === row.orderId));
    else
      review.push({
        subscriptionId: row.subscriptionId,
        day: row.day,
        reason: !sub
          ? "契約を取得できません"
          : !row.orderId
            ? "対象回未照合／注文未作成（発送CSV対象外）"
            : "選択後に日程・注文・発送状態が変わりました。再確認が必要です",
      });
  }
  return {
    orders: [...new Map(matched.map((o) => [o.id, o])).values()],
    review,
  };
}
