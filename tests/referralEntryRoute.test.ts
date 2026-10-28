// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({
  admin: true,
  user: true,
  rpc: vi.fn(),
  load: vi.fn(),
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({
        data: { user: mock.user ? { id: "verified-admin" } : null },
        error: null,
      }),
    },
    rpc: mock.rpc,
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data:
              table === "profiles"
                ? { is_admin: mock.admin }
                : { id: "customer" },
            error: null,
          }),
        }),
      }),
    }),
  }),
}));
vi.mock("../lib/loadReferralMonthly", () => ({
  loadReferralMonthly: mock.load,
}));
import { POST } from "../app/api/admin/referral-entry/route";
const input = {
  id: "00000000-0000-0000-0000-000000000001",
  kind: "refund",
  date: "2026-11-01",
  amount: 100,
  saleKey: "ec:o:web_single",
  reference: "re_fixture",
  reason: "商品分返金",
  actor: "untrusted",
};
const send = (body: unknown = input, token = "fixture") =>
  POST(
    new Request("https://example.invalid/api/admin/referral-entry", {
      method: "POST",
      headers: token ? { authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(body),
    }),
  );
beforeEach(() => {
  vi.stubEnv("SUPABASE_URL", "https://db.invalid");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "fixture");
  mock.admin = true;
  mock.user = true;
  mock.load.mockResolvedValue({
    sales: [{ key: input.saleKey, date: "2026-10-01", amount: 1000 }],
  });
  mock.rpc.mockResolvedValue({ error: null });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
it("requires administrator authentication and never accepts actor identity from the body", async () => {
  expect((await send(input, "")).status).toBe(401);
  mock.admin = false;
  expect((await send()).status).toBe(403);
  expect(mock.rpc).not.toHaveBeenCalled();
  mock.admin = true;
  expect((await send()).status).toBe(200);
  expect(mock.rpc.mock.calls[0][1]).toMatchObject({
    p_actor: "verified-admin",
    p_sale_basis: 1000,
    p_sale_key: input.saleKey,
  });
});
it("validates date, actual source basis and input types before a refund record can be saved", async () => {
  expect((await send({ ...input, date: "2026-02-30" })).status).toBe(400);
  expect((await send({ ...input, amount: "100" })).status).toBe(400);
  mock.load.mockResolvedValue({ sales: [] });
  expect((await send()).status).toBe(400);
  expect(mock.rpc).not.toHaveBeenCalled();
});
it("does not call payment/refund APIs and reports duplicate/cap conflicts", async () => {
  const r = await (await send()).json();
  expect(r).toMatchObject({
    saved: true,
    refundExecuted: false,
    inventoryChanged: false,
  });
  const spy = vi.spyOn(console, "error").mockImplementation(() => {});
  mock.rpc.mockResolvedValue({ error: { code: "23505" } });
  expect((await send()).status).toBe(409);
  spy.mockRestore();
});
