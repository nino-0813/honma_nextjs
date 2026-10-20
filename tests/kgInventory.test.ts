import { describe, expect, it } from "vitest";
import {
  summarize,
  unresolvedOrders,
  type Movement,
  type Order,
  type Snapshot,
} from "../lib/kgInventory";
const movement = (fields: Partial<Movement>): Movement => ({
  id: "m",
  season_id: "2026",
  variety_key: "koshihikari",
  kind: "ec",
  incoming_kg: 0,
  used_kg: 0,
  held_kg: 0,
  reason: "",
  created_at: "",
  ...fields,
});
const order: Order = {
  id: "o",
  order_number: "old",
  payment_status: "paid",
  order_status: "processing",
  order_items: [
    {
      id: "i",
      order_id: "o",
      product_title: "コシヒカリ 5kg",
      quantity: 2,
      selected_options: {},
    },
  ],
};
describe("kg accounting presentation", () => {
  it("uses integer grams and preserves shortage", () => {
    const rows = summarize(
      "2026",
      [
        movement({ incoming_kg: 0.3 }),
        movement({ used_kg: 0.1 }),
        movement({ held_kg: 0.2 }),
        movement({ used_kg: 0.001 }),
      ],
      [],
      [],
    );
    expect(rows[0].available).toBe(-0.001);
  });
  it("keeps old data and separates ambiguous manual reservations", () => {
    const row = summarize(
      "2026",
      [movement({ held_kg: 10 })],
      [
        {
          season_id: "2026",
          variety_key: "koshihikari",
          harvested_kg: 100,
          reserved_kg: 10,
        },
      ],
      [
        {
          id: "x",
          season_id: "2026",
          variety_key: "koshihikari",
          quantity_kg: 5,
          channel: "gift",
          note: "",
          sold_on: "",
        },
      ],
    )[0];
    expect(row).toMatchObject({
      incoming: 100,
      used: 5,
      held: 10,
      legacyHeld: 10,
      available: 85,
    });
  });
  it("separates harvest years regardless of order dates", () => {
    expect(summarize("2025", [movement({ used_kg: 10 })], [], [])[0].used).toBe(
      0,
    );
  });
  it("never infers legacy varieties or weight from titles", () => {
    expect(unresolvedOrders([order], [])).toHaveLength(1);
  });
  it("explicitly excluded bags do not become unresolved", () => {
    const snap: Snapshot = {
      item_id: "i",
      components: [],
      excluded: true,
      quantity: 2,
      reason: "Ricekeep verified",
    };
    expect(unresolvedOrders([order], [snap])).toHaveLength(0);
    expect(
      unresolvedOrders([order], [{ ...snap, reason: "REVIEW: changed" }]),
    ).toHaveLength(1);
  });
  it("shows missing order lines as unresolved", () => {
    expect(
      unresolvedOrders([{ ...order, order_items: [] }], [])[0].item,
    ).toBeNull();
  });
});
