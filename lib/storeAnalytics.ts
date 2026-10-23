import { summarizeRaw, type Movement } from "./kgInventory";

export type AnalyticsOrder = {
  id: string;
  total: number | string;
  payment_status: string;
  order_status?: string;
  email: string | null;
  auth_user_id?: string | null;
  created_at: string;
  paid_at?: string | null;
};
export type AnalyticsItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_title: string;
  line_total: number | string;
};
export type AnalyticsSubscription = {
  id: string;
  created_at: string;
  canceled_at: string | null;
  status: string;
  metadata?: { cancel_at_period_end?: boolean } | null;
};
export type AnalyticsTarget = {
  year: number;
  revenue_target: number | null;
  gross_profit_target: number | null;
};
export type AnalyticsInventory = {
  accounting_version?: number;
  accounting_paused?: boolean;
  seasons: { id: string; label: string; harvest_year: number }[];
  movements: Movement[];
  raw_baselines?: Parameters<typeof summarizeRaw>[2];
};
export type AnalyticsData = {
  orders: AnalyticsOrder[];
  items: AnalyticsItem[] | null;
  subscriptions: AnalyticsSubscription[] | null;
  targets: AnalyticsTarget[];
  targetsReady: boolean;
  inventory: AnalyticsInventory | null;
  productCount: number | null;
  warnings: string[];
};
export const yen = (value: number) =>
  `¥${Math.round(value).toLocaleString("ja-JP")}`;
export const jstDay = (date: Date) =>
  new Date(date.getTime() + 9 * 3600000).toISOString().slice(0, 10);
export function paidDate(order: AnalyticsOrder) {
  const date = new Date(order.paid_at || order.created_at).getTime();
  return Number.isFinite(date) ? date : NaN;
}
function identity(order: AnalyticsOrder) {
  const email = order.email?.trim().toLowerCase();
  if (email && email.includes("@") && email !== "unknown@example.com")
    return `email:${email}`;
  return order.auth_user_id ? `user:${order.auth_user_id}` : null;
}
export function periodRange(period: string, now: Date) {
  const today = jstDay(now);
  const start =
    period === "month"
      ? new Date(`${today.slice(0, 7)}-01T00:00:00+09:00`).getTime()
      : new Date(`${today}T00:00:00+09:00`).getTime() -
        (Number(period) - 1) * 86400000;
  return { start, end: now.getTime() };
}
export function calculateAnalytics(
  data: AnalyticsData,
  year: number,
  period: string,
  now: Date,
) {
  const { start, end } = periodRange(period, now);
  const paid = data.orders.filter(
    (order) =>
      order.payment_status === "paid" &&
      order.order_status !== "cancelled" &&
      Number.isFinite(paidDate(order)) &&
      paidDate(order) <= end,
  );
  const current = paid.filter((order) => paidDate(order) >= start);
  const annual = paid.filter((order) =>
    jstDay(new Date(paidDate(order))).startsWith(`${year}-`),
  );
  const sum = (orders: AnalyticsOrder[]) =>
    orders.reduce((total, order) => total + (Number(order.total) || 0), 0);
  const firstPaid = new Map<string, number>();
  // Refunded purchases still establish that this is an existing customer.
  for (const order of data.orders.filter(
    (row) =>
      ["paid", "refunded"].includes(row.payment_status) &&
      Number.isFinite(paidDate(row)) &&
      paidDate(row) <= end,
  )) {
    const key = identity(order);
    if (key)
      firstPaid.set(
        key,
        Math.min(firstPaid.get(key) ?? Infinity, paidDate(order)),
      );
  }
  const currentCustomers = new Set(
    current.map(identity).filter((key): key is string => key !== null),
  );
  const newCustomers = [...currentCustomers].filter(
    (key) => (firstPaid.get(key) ?? -Infinity) >= start,
  ).length;
  const months = Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    revenue: 0,
    orders: 0,
  }));
  for (const order of annual) {
    const month = Number(jstDay(new Date(paidDate(order))).slice(5, 7)) - 1;
    months[month].revenue += Number(order.total) || 0;
    months[month].orders += 1;
  }
  const paidIds = new Set(current.map((order) => order.id));
  const products = new Map<
    string,
    { key: string; name: string; sales: number; orderIds: Set<string> }
  >();
  for (const item of data.items || []) {
    if (!paidIds.has(item.order_id)) continue;
    const key = item.product_id || `title:${item.product_title}`;
    const product = products.get(key) || {
      key,
      name: item.product_title,
      sales: 0,
      orderIds: new Set<string>(),
    };
    product.sales += Number(item.line_total) || 0;
    product.orderIds.add(item.order_id);
    products.set(key, product);
  }
  const inPeriod = (date: string | null) =>
    !!date &&
    new Date(date).getTime() >= start &&
    new Date(date).getTime() <= end;
  const subscriptions = data.subscriptions;
  const newSubscriptions =
    subscriptions?.filter(
      (subscription) =>
        !["incomplete", "incomplete_expired"].includes(subscription.status) &&
        inPeriod(subscription.created_at),
    ).length ?? null;
  const cancellationRequests =
    subscriptions?.filter((subscription) => inPeriod(subscription.canceled_at))
      .length ?? null;
  const active =
    subscriptions?.filter((subscription) =>
      ["active", "trialing", "past_due", "paused"].includes(
        subscription.status,
      ),
    ).length ?? null;
  const scheduled =
    subscriptions?.filter(
      (subscription) =>
        subscription.status !== "canceled" &&
        subscription.metadata?.cancel_at_period_end,
    ).length ?? null;
  return {
    revenue: sum(current),
    annualRevenue: sum(annual),
    orderCount: current.length,
    avgOrder: current.length ? Math.round(sum(current) / current.length) : 0,
    customers: currentCustomers.size,
    newCustomers,
    unknownCustomers: current.filter((order) => !identity(order)).length,
    fallbackDates: paid.filter((order) => !order.paid_at).length,
    newSubscriptions,
    cancellationRequests,
    active,
    scheduled,
    undatedCancellations:
      subscriptions?.filter(
        (subscription) =>
          subscription.status === "canceled" && !subscription.canceled_at,
      ).length ?? 0,
    months,
    topProducts: [...products.values()]
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5)
      .map((product) => ({
        key: product.key,
        name: product.name,
        sales: product.sales,
        orders: product.orderIds.size,
      })),
  };
}

export async function fetchAllAnalyticsPages<T>(
  load: (
    from: number,
    to: number,
  ) => PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
    count: number | null;
  }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (;;) {
    const result = await load(rows.length, rows.length + 499);
    if (result.error) throw new Error(result.error.message);
    if (result.count === null)
      throw new Error("集計対象の総件数を確認できませんでした");
    const page = result.data || [];
    rows.push(...page);
    if (rows.length >= result.count) return rows;
    if (!page.length || rows.length > 200000)
      throw new Error("全件を取得できませんでした。集計方法の見直しが必要です");
  }
}

export function inventoryForYear(
  report: AnalyticsInventory | null,
  year: number,
) {
  if (!report || report.accounting_version !== 2 || report.accounting_paused)
    return null;
  const season = report.seasons.find((row) => row.harvest_year === year);
  return season
    ? summarizeRaw(season.id, report.movements, report.raw_baselines || [])
    : null;
}
