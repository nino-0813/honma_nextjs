// @vitest-environment node
import { expect, it } from "vitest";
import {
  buildReferralSales,
  referralMonthly,
  type ReferralSale,
} from "../lib/referralMonthly";
const customers = [
  { id: "c", email: "a@example.invalid", referred_by_customer_id: "r" },
  { id: "r", email: "r@example.invalid" },
];
const order = {
  id: "o",
  order_number: "ORD-fixture",
  email: "a@example.invalid",
  created_at: "2026-09-30T16:00:00Z",
  payment_status: "paid",
  subtotal: 1000,
  shipping_cost: 100,
  total: 1000,
  discount_amount: 100,
  order_items: [
    { line_total: 600, is_subscription: false },
    { line_total: 400, is_subscription: true },
  ],
};
it("excludes shipping and allocates merchandise discount exactly across mixed single/subscription rates", () => {
  const { sales, issues } = buildReferralSales(customers, [order], [], []);
  expect(issues).toHaveLength(0);
  expect(sales.map((s) => [s.category, s.amount])).toEqual([
    ["web_single", 540],
    ["web_subscription", 360],
  ]);
  const result = referralMonthly("2026-10", sales, []);
  expect(result.totalSales).toBe(900);
  expect(result.totalCommission).toBe(99);
  expect(referralMonthly("2026-09", sales, []).totalSales).toBe(0);
});
it("retains original sales month, subtracts merchandise refund only in refund month, and ignores repeated refund IDs", () => {
  const { sales } = buildReferralSales(customers, [order], [], []);
  const refunds = [
    {
      id: "re1",
      sale_key: sales[0].key,
      refunded_on: "2026-11-02",
      merchandise_yen: 100,
      external_reference: "re_fixture",
    },
  ];
  expect(referralMonthly("2026-10", sales, refunds).netSales).toBe(900);
  const result = referralMonthly("2026-11", sales, [...refunds, ...refunds]);
  expect(result.netSales).toBe(-100);
  expect(result.totalCommission).toBe(-15);
});
it("does not use a mismatched recurring invoice total or ambiguous customer identity", () => {
  expect(
    buildReferralSales(customers, [{ ...order, total: 2000 }], [], []).sales,
  ).toEqual([]);
  expect(
    buildReferralSales(
      [...customers, { id: "other", email: "a@example.invalid" }],
      [order],
      [],
      [],
    ).issues.length,
  ).toBe(1);
});
it("rounds monthly by category, not per order, and sums each referrer separately", () => {
  const sales: ReferralSale[] = [1, 2].map((n) => ({
    key: String(n),
    date: "2026-10-01",
    customerId: "c",
    referrerId: "r",
    category: "web_single",
    amount: 3,
    label: "fixture",
  }));
  expect(referralMonthly("2026-10", sales, []).totalCommission).toBe(1);
  sales[1].referrerId = "r2";
  expect(referralMonthly("2026-10", sales, []).totalCommission).toBe(0);
});
it("excludes tabechoku and unresolved portal financial basis, includes verified direct orders", () => {
  const record: any = {
    source: "rice_tabechoku",
    customer_id: "c",
    merchandise_yen: 1000,
    payload: { status: "active" },
  };
  expect(buildReferralSales(customers, [], [record], []).sales).toEqual([]);
  record.source = "rice_satofuru";
  record.source_key = "fixture";
  expect(buildReferralSales(customers, [], [record], []).issues).toHaveLength(
    1,
  );
  expect(
    referralMonthly(
      "2026-10",
      buildReferralSales(
        customers,
        [],
        [],
        [
          {
            id: "d",
            customer_id: "c",
            sold_on: "2026-10-01",
            merchandise_yen: 1000,
            reference: "direct",
          },
        ],
      ).sales,
      [],
    ).totalCommission,
  ).toBe(200);
});
it("detects duplicate payment orders and over-refunds instead of silently counting them", () => {
  expect(
    buildReferralSales(
      customers,
      [
        { ...order, payment_intent_id: "pi_a" },
        { ...order, id: "o2", payment_intent_id: "pi_a" },
      ],
      [],
      [],
    ).sales,
  ).toEqual([]);
  const { sales } = buildReferralSales(customers, [order], [], []);
  const result = referralMonthly("2026-10", sales, [
    {
      id: "x",
      sale_key: sales[0].key,
      refunded_on: "2026-10-02",
      merchandise_yen: 1000,
      external_reference: "re_x",
    },
  ]);
  expect(result.totalRefunds).toBe(0);
  expect(result.issues).toHaveLength(1);
});
