import { expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadStoreAnalytics } from "../lib/loadStoreAnalytics";
function client(fail: string[] = []) {
  const fixture: Record<string, unknown[]> = {
    orders: [{ id: "order", total: 1000 }],
    order_items: [],
    subscriptions: [],
    analytics_yearly_targets: [],
  };
  return {
    from: (table: string) => ({
      select: (_columns: string, options: { head?: boolean }) =>
        options.head
          ? Promise.resolve({ count: 2, error: null })
          : {
              order: () => ({
                range: async () => ({
                  data: fail.includes(table) ? null : fixture[table],
                  count: fixture[table]?.length ?? 0,
                  error: fail.includes(table)
                    ? { message: `${table} unavailable` }
                    : null,
                }),
              }),
            },
    }),
    rpc: async () => ({ data: null, error: { message: "not installed" } }),
  } as unknown as SupabaseClient;
}
it("preserves order metrics when optional targets, subscriptions, items, or inventory cannot be loaded", async () => {
  const result = await loadStoreAnalytics(
    client(["analytics_yearly_targets", "subscriptions", "order_items"]),
  );
  expect(result.orders).toHaveLength(1);
  expect(result.targetsReady).toBe(false);
  expect(result.items).toBeNull();
  expect(result.subscriptions).toBeNull();
  expect(result.inventory).toBeNull();
  expect(result.warnings).toHaveLength(4);
});
it("never turns a failed orders query into a zero-sales dashboard", async () => {
  await expect(loadStoreAnalytics(client(["orders"]))).rejects.toThrow(
    "注文を取得できませんでした",
  );
});
