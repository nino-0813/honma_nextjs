import { expect, it, vi } from "vitest";
import { applySubscriptionProductChange } from "../lib/subscriptionChanges";
it("keeps existing pricing/cadence and changes no historical order", async () => {
  const updates: any[] = [];
  const fixtures: any = {
    subscriptions: {
      id: "subrow",
      metadata: { pending_changes: { shipping: { city: "keep" } } },
    },
    orders: { id: "oldorder" },
    order_items: {
      product_title: "5kg rice",
      quantity: 2,
      selected_options: { milling: "brown" },
    },
    products: {
      id: "newproduct",
      title: "5kg replacement",
      price: 2000,
      subscription_discount_percent: 10,
      status: "active",
      is_active: true,
      subscription_enabled: true,
      variants_config: [
        {
          id: "milling",
          name: "精米",
          options: [{ id: "white", label: "白米", priceAdjustment: 200 }],
        },
      ],
    },
  };
  const db = {
    from: (table: string) => {
      const b: any = {
        select: () => b,
        eq: () => b,
        order: () => b,
        limit: () => b,
        maybeSingle: async () => ({ data: fixtures[table], error: null }),
        update: (value: any) => {
          updates.push({ table, value });
          return b;
        },
        then: (fn: any) => Promise.resolve({ error: null }).then(fn),
      };
      return b;
    },
  };
  const stripe: any = {
    subscriptions: {
      retrieve: vi.fn().mockResolvedValue({
        items: {
          data: [
            {
              id: "stripeitem",
              quantity: 2,
              price: {
                id: "oldprice",
                product: {
                  name: "5kg rice",
                  metadata: { product_id: "oldproduct" },
                },
                recurring: { interval: "month", interval_count: 2 },
              },
            },
          ],
        },
      }),
      update: vi.fn().mockResolvedValue({}),
    },
    products: { create: vi.fn().mockResolvedValue({ id: "stripeproduct" }) },
    prices: { create: vi.fn().mockResolvedValue({ id: "newprice" }) },
  };
  const result = await applySubscriptionProductChange({
    db,
    stripe,
    subscriptionId: "sub_fixture",
    productId: "newproduct",
    millingOptionId: "white",
  });
  expect(result.currentProduct.product_title).toBe("5kg replacement");
  expect(result.currentProduct.quantity).toBe(2);
  expect(result.unitAmount).toBe(1980);
  expect(stripe.prices.create.mock.calls[0][0].recurring).toEqual({
    interval: "month",
    interval_count: 2,
  });
  expect(stripe.subscriptions.update.mock.calls[0][1].proration_behavior).toBe(
    "none",
  );
  expect(updates.map((x) => x.table)).toEqual(["subscriptions"]);
  expect(updates[0].value.metadata.pending_changes.shipping.city).toBe("keep");
});

it("keeps the existing weight-change restriction until shipping charges are defined", async () => {
  const rows: any = {
    subscriptions: { id: "s", metadata: {} },
    orders: { id: "o" },
    order_items: { product_title: "5kg rice", quantity: 1 },
    products: {
      id: "p",
      title: "10kg rice",
      status: "active",
      is_active: true,
      subscription_enabled: true,
    },
  };
  const db = {
    from: (table: string) => {
      const q: any = {
        select: () => q,
        eq: () => q,
        order: () => q,
        limit: () => q,
        maybeSingle: async () => ({ data: rows[table], error: null }),
      };
      return q;
    },
  };
  const stripe: any = {
    subscriptions: {
      retrieve: vi
        .fn()
        .mockResolvedValue({
          items: {
            data: [
              {
                id: "i",
                price: {
                  product: {
                    metadata: { product_id: "old" },
                    name: "5kg rice",
                  },
                },
              },
            ],
          },
        }),
      update: vi.fn(),
    },
  };
  await expect(
    applySubscriptionProductChange({
      db,
      stripe,
      subscriptionId: "sub",
      productId: "p",
      millingOptionId: "white",
    }),
  ).rejects.toThrow("重量変更は現在準備中");
  expect(stripe.subscriptions.update).not.toHaveBeenCalled();
});
