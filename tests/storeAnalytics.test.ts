import { expect, it, vi } from "vitest";
import {
  calculateAnalytics,
  fetchAllAnalyticsPages,
  inventoryForYear,
  periodRange,
  type AnalyticsData,
  type AnalyticsOrder,
} from "../lib/storeAnalytics";
const now = new Date("2026-10-23T10:00:00+09:00");
const order = (
  id: string,
  fields: Partial<AnalyticsOrder> = {},
): AnalyticsOrder => ({
  id,
  total: 1000,
  email: `${id}@example.test`,
  payment_status: "paid",
  order_status: "processing",
  created_at: "2026-10-01T00:00:00+09:00",
  paid_at: "2026-10-02T00:00:00+09:00",
  ...fields,
});
const data = (orders: AnalyticsOrder[] = []): AnalyticsData => ({
  orders,
  items: [],
  subscriptions: [],
  targets: [],
  targetsReady: true,
  inventory: null,
  productCount: 0,
  warnings: [],
});
it("uses JST month boundaries and the payment date, not order creation date", () => {
  const rows = data([
    order("a", { created_at: "2026-09-01", paid_at: "2026-09-30T15:00:00Z" }),
    order("b", { paid_at: "2026-09-30T14:59:59Z" }),
    order("c", { paid_at: null }),
  ]);
  expect(calculateAnalytics(rows, 2026, "month", now)).toMatchObject({
    revenue: 2000,
    annualRevenue: 3000,
    orderCount: 2,
    fallbackDates: 1,
  });
  expect(periodRange("7", now).start).toBe(
    new Date("2026-10-17T00:00:00+09:00").getTime(),
  );
});
it("excludes pending, refunds, canceled orders, future dates, and invalid dates", () => {
  const rows = data([
    order("a"),
    order("b", { payment_status: "pending" }),
    order("c", { payment_status: "refunded" }),
    order("d", { order_status: "cancelled" }),
    order("e", { paid_at: "2027-01-01" }),
    order("f", { paid_at: "invalid" }),
  ]);
  expect(calculateAnalytics(rows, 2026, "month", now).revenue).toBe(1000);
});
it("identifies first customers across all history, case-insensitively, without counting missing identities", () => {
  const rows = data([
    order("old", { email: " Old@Example.test ", paid_at: "2026-09-01" }),
    order("again", { email: "old@example.test" }),
    order("new"),
    order("missing", { email: null }),
    order("user", { email: null, auth_user_id: "user-id" }),
  ]);
  expect(calculateAnalytics(rows, 2026, "month", now)).toMatchObject({
    newCustomers: 2,
    customers: 3,
    unknownCustomers: 1,
  });
});
it("separates calendar years at Japanese midnight", () => {
  const rows = data([
    order("a", { paid_at: "2025-12-31T15:00:00Z" }),
    order("b", { paid_at: "2025-12-31T14:59:59Z" }),
  ]);
  expect(calculateAnalytics(rows, 2026, "365", now).annualRevenue).toBe(1000);
});
it("does not classify a previously refunded customer as new when they return", () => {
  const rows = data([
    order("old", {
      email: "return@example.test",
      payment_status: "refunded",
      paid_at: "2026-09-01",
    }),
    order("new", { email: "return@example.test" }),
  ]);
  expect(calculateAnalytics(rows, 2026, "month", now)).toMatchObject({
    customers: 1,
    newCustomers: 0,
    revenue: 1000,
  });
});
it("sums numeric strings and counts unique orders per product without merging deleted products", () => {
  const rows = data([order("a")]);
  rows.items = [
    {
      id: "1",
      order_id: "a",
      product_id: "rice",
      product_title: "米",
      line_total: "100",
    },
    {
      id: "2",
      order_id: "a",
      product_id: "rice",
      product_title: "米",
      line_total: "200",
    },
    {
      id: "3",
      order_id: "a",
      product_id: null,
      product_title: "柿",
      line_total: 50,
    },
    {
      id: "4",
      order_id: "a",
      product_id: null,
      product_title: "椎茸",
      line_total: 70,
    },
  ];
  const result = calculateAnalytics(rows, 2026, "month", now);
  expect(result.topProducts).toHaveLength(3);
  expect(result.topProducts[0]).toMatchObject({ sales: 300, orders: 1 });
});
it("counts cancellation request dates including reservations, without claiming completion dates", () => {
  const rows = data();
  rows.subscriptions = [
    {
      id: "a",
      created_at: "2026-10-01",
      status: "active",
      canceled_at: "2026-10-10",
      metadata: { cancel_at_period_end: true },
    },
    {
      id: "b",
      created_at: "2026-09-01",
      status: "canceled",
      canceled_at: "2026-10-10",
    },
    {
      id: "c",
      created_at: "2026-10-01",
      status: "incomplete",
      canceled_at: null,
    },
  ];
  expect(calculateAnalytics(rows, 2026, "month", now)).toMatchObject({
    newSubscriptions: 1,
    cancellationRequests: 2,
    active: 1,
    scheduled: 1,
  });
  rows.subscriptions = null;
  expect(
    calculateAnalytics(rows, 2026, "month", now).cancellationRequests,
  ).toBeNull();
});
it("loads over 1000 records even when the API caps each page below the requested size", async () => {
  const input = Array.from({ length: 1201 }, (_, id) => ({ id }));
  const load = vi.fn(async (from: number, to: number) => ({
    data: input.slice(from, Math.min(to + 1, from + 100)),
    count: input.length,
    error: null,
  }));
  const result = await fetchAllAnalyticsPages(load);
  expect(result).toEqual(input);
  expect(load).toHaveBeenCalledTimes(13);
});
it("fails rather than silently returning partial analytics", async () => {
  await expect(
    fetchAllAnalyticsPages(async () => ({ data: [], count: 2, error: null })),
  ).rejects.toThrow("全件");
  await expect(
    fetchAllAnalyticsPages(async () => ({
      data: [],
      count: null,
      error: null,
    })),
  ).rejects.toThrow("総件数");
  await expect(
    fetchAllAnalyticsPages(async () => ({
      data: null,
      count: null,
      error: { message: "denied" },
    })),
  ).rejects.toThrow("denied");
});
it("never presents paused or old-unit inventory as current raw rice", () => {
  expect(inventoryForYear(null, 2026)).toBeNull();
  expect(
    inventoryForYear(
      { accounting_version: 1, seasons: [], movements: [] },
      2026,
    ),
  ).toBeNull();
  expect(
    inventoryForYear(
      {
        accounting_version: 2,
        accounting_paused: true,
        seasons: [],
        movements: [],
      },
      2026,
    ),
  ).toBeNull();
});
