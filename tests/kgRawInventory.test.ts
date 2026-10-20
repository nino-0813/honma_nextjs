import { expect, it } from "vitest";
import {
  summarizeRaw,
  unresolvedOrders,
  type Movement,
} from "../lib/kgInventory";
it("never converts old balances or movements and preserves milligram precision", () => {
  const common = {
    id: "m",
    season_id: "s",
    variety_key: "koshihikari",
    kind: "forecast",
    incoming_kg: 0,
    used_kg: 0,
    reason: "fixture",
    created_at: "",
  };
  const rows = summarizeRaw(
    "s",
    [
      { ...common, held_kg: 100, accounting_version: 1 },
      { ...common, held_kg: 0.00105, accounting_version: 2 },
    ] as Movement[],
    [
      {
        season_id: "s",
        variety_key: "koshihikari",
        incoming_kg: 0.001,
        external_used_kg: 0,
        external_held_kg: 0,
      },
    ],
  );
  expect(rows[0].available).toBe(-0.00005);
  expect(rows[0].futureHeld).toBe(0.00105);
  expect(rows[0].basisMissing).toBe(false);
  expect(rows[1].basisMissing).toBe(true);
});
it("old snapshots are unresolved in raw-rice mode", () => {
  const orders = [
    {
      id: "o",
      order_number: "o",
      payment_status: "paid",
      order_status: "processing",
      order_items: [
        {
          id: "i",
          order_id: "o",
          product_title: "old",
          quantity: 1,
          selected_options: {},
        },
      ],
    },
  ];
  const snaps = [
    {
      item_id: "i",
      reason: "old verified",
      excluded: false,
      components: [],
      quantity: 1,
      accounting_version: 1,
    },
  ];
  expect(unresolvedOrders(orders, snaps, true)).toHaveLength(1);
});
