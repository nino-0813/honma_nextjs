import { expect, it } from "vitest";
import {
  cloneRecurringItem,
  mergeSubscriptionMetadata,
} from "../lib/subscriptionSnapshots";
it("clears fulfillment evidence only on the new recurring item", () => {
  const old = {
    id: "old",
    created_at: "yesterday",
    shipping_status: "shipped",
    shipping_carrier: "carrier",
    tracking_number: "old-tracking",
    quantity: 2,
    selected_options: { milling: "white" },
  };
  const next = cloneRecurringItem(old);
  expect(next).toEqual({
    shipping_status: "before_shipping",
    shipping_carrier: null,
    tracking_number: null,
    quantity: 2,
    selected_options: { milling: "white" },
  });
  expect(old.shipping_status).toBe("shipped");
  expect(old.id).toBe("old");
});
it("preserves local changes while retaining Stripe skip and cancel state", () => {
  const existing = {
    current_product: { product_id: "p" },
    pending_changes: { product: { product_id: "next" } },
    shipping: { city: "fixture" },
  };
  expect(
    mergeSubscriptionMetadata(existing, {
      skipped_until: "123",
      cancel_at_period_end: true,
      pending_changes: "stale",
    }),
  ).toEqual({ ...existing, skipped_until: "123", cancel_at_period_end: true });
});

it("retries an intervening metadata change instead of losing a pending change", async () => {
  const { persistSubscriptionState } =
    await import("../lib/subscriptionSnapshots");
  let reads = 0,
    writes = 0;
  const written: any[] = [];
  const db = {
    from: () => {
      let update = false;
      const q: any = {
        select: () =>
          update
            ? Promise.resolve({
                data: ++writes === 1 ? [] : [{ id: "s" }],
                error: null,
              })
            : q,
        eq: () => q,
        is: () => q,
        single: async () => ({
          data: {
            metadata:
              ++reads === 1
                ? {}
                : {
                    pending_changes: {
                      product: { product_id: "just_requested" },
                    },
                  },
          },
          error: null,
        }),
        update: (value: any) => {
          update = true;
          written.push(value);
          return q;
        },
      };
      return q;
    },
  };
  await persistSubscriptionState(db, "s", {
    status: "active",
    metadata: { interval: "monthly" },
  });
  expect(writes).toBe(2);
  expect(written[1].metadata.pending_changes.product.product_id).toBe(
    "just_requested",
  );
});
