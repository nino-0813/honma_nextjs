// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import {
  buildShipmentHandoff,
  parseShipmentHandoff,
  resolveShipmentHandoff,
} from "../lib/shipmentHandoff";
afterEach(() => vi.useRealTimers());
const sub = {
  stripe_subscription_id: "sub_fixture",
  status: "active",
  interval: "monthly",
  created_at: "2026-10-01",
  next_billing_at: "2026-11-10",
  metadata: { first_shipping_override: "2026-11-15" },
};
const orders = [
  {
    id: "first",
    stripe_subscription_id: "sub_fixture",
    created_at: "2026-10-01",
    order_status: "processing",
    payment_status: "pending",
  },
];
it("passes only the exact shipment cycle including unpaid orders, with ID-only session data", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-28"));
  const selection = buildShipmentHandoff([sub], orders);
  expect(selection.rows).toEqual([
    { subscriptionId: "sub_fixture", day: "2026-11-15", orderId: "first" },
  ]);
  expect(
    resolveShipmentHandoff(
      parseShipmentHandoff(JSON.stringify(selection)),
      [sub],
      orders,
    ).orders,
  ).toEqual(orders);
});
it("revalidates changed statuses and reports uncreated cycles without using past orders", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-28"));
  const selection = buildShipmentHandoff([sub], orders);
  expect(
    resolveShipmentHandoff(
      selection,
      [sub],
      [{ ...orders[0], order_status: "delivered" }],
    ).orders,
  ).toEqual([]);
  expect(
    resolveShipmentHandoff(selection, [{ ...sub, status: "canceled" }], orders)
      .review,
  ).toHaveLength(1);
  const unresolved = {
    ...selection,
    rows: [{ ...selection.rows[0], orderId: null }],
  };
  expect(resolveShipmentHandoff(unresolved, [sub], orders).review).toHaveLength(
    1,
  );
});
it("rejects missing, expired or duplicate selection data instead of falling back to all orders", () => {
  expect(() => parseShipmentHandoff(null)).toThrow();
  const s = buildShipmentHandoff([], []);
  expect(() =>
    parseShipmentHandoff(
      JSON.stringify({
        ...s,
        rows: [{ subscriptionId: "s", day: "2026-11-15", orderId: null }],
        createdAt: "2000-01-01",
      }),
    ),
  ).toThrow();
});
it("includes all outstanding cycles in a selected month even after the next bill moves forward", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-28"));
  const contract = {
    ...sub,
    created_at: "2026-01-01",
    next_billing_at: "2026-11-10",
    metadata: {},
  };
  const history = [
    {
      ...orders[0],
      id: "original",
      created_at: "2026-01-01",
      order_status: "shipped",
    },
    {
      ...orders[0],
      id: "oct1",
      created_at: "2026-10-01",
      subscription_shipping_date: "2026-10-15",
    },
    {
      ...orders[0],
      id: "oct2",
      created_at: "2026-10-18",
      subscription_shipping_date: "2026-10-29",
    },
  ];
  const selection = buildShipmentHandoff([contract], history, "2026-10");
  expect(selection.rows.map((r) => r.orderId)).toEqual(["oct1", "oct2"]);
  expect(parseShipmentHandoff(JSON.stringify(selection)).rows).toHaveLength(2);
  expect(
    resolveShipmentHandoff(selection, [contract], history).orders,
  ).toHaveLength(2);
});
