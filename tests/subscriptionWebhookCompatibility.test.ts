// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({
  from: vi.fn(), event: {} as any, mail: vi.fn(),
}));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ from: mock.from }) }));
vi.mock("@/lib/brevo", () => ({ sendBrevoEmail: mock.mail }));
vi.mock("stripe", () => ({
  default: class {
    webhooks = { constructEvent: () => mock.event };
  },
}));
import { POST } from "../app/api/stripe-webhook/route";

beforeEach(() => {
  vi.stubEnv("STRIPE_SECRET_KEY", "fixture");
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", "fixture");
  vi.stubEnv("SUPABASE_URL", "http://127.0.0.1:1");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "fixture");
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("External requests forbidden"); }));
  mock.event = {
    id: "evt_fixture",
    type: "customer.subscription.updated",
    data: { object: {
      id: "sub_fixture", customer: "cus_fixture", status: "active",
      metadata: { interval: "monthly", pending_changes: "stale" },
      current_period_end: 1800000000, cancel_at_period_end: false,
    } },
  };
});
afterEach(() => {
  vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetAllMocks();
});

it.each([null, { pending_changes: { product: { product_id: "confirmed" } }, shipping: { city: "fixture" } }])(
  "syncs duplicate subscription events on the existing schema and preserves local metadata %j",
  async (initial) => {
    let metadata: any = initial;
    let events = 0;
    const updates: any[] = [];
    const tables: string[] = [];
    mock.from.mockImplementation((table: string) => {
      tables.push(table);
      let writing = false;
      const q: any = {
        select: () => writing ? Promise.resolve({ data: [{ id: "s" }], error: null }) : q,
        eq: () => q, is: () => q, order: () => q, limit: () => q,
        maybeSingle: async () => ({ data: table === "orders"
          ? { auth_user_id: "u", email: "fixture@example.invalid", subscription_interval: "monthly" }
          : { id: "s", metadata }, error: null }),
        single: async () => ({ data: { metadata }, error: null }),
        insert: async () => ({ error: events++ ? { code: "23505" } : null }),
        update: (row: any) => { writing = true; metadata = row.metadata; updates.push(row); return q; },
      };
      return q;
    });
    for (let n = 0; n < 2; n++) {
      const result = await POST(new Request("http://localhost/api/stripe-webhook", {
        method: "POST", headers: { "stripe-signature": "fixture" }, body: "{}",
      }));
      expect(result.status).toBe(200);
    }
    expect(updates).toHaveLength(2);
    expect(metadata.pending_changes).toEqual(initial?.pending_changes);
    expect(metadata.shipping).toEqual(initial?.shipping);
    expect(metadata.interval).toBe("monthly");
    expect(updates[1].status).toBe("active");
    expect(new Set(tables)).toEqual(new Set(["stripe_webhook_events", "orders", "subscriptions"]));
    expect(mock.mail).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  },
);
