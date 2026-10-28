import React from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
const mock = vi.hoisted(() => ({
  read: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn(),
  monthly: vi.fn(),
}));
vi.mock("next/link", () => ({
  default: ({ children, ...p }: any) => <a {...p}>{children}</a>,
}));
vi.mock("../lib/supabase", () => ({
  supabase: {
    rpc: mock.rpc,
    from: mock.from,
    auth: {
      getSession: async () => ({
        data: { session: { access_token: "fixture" } },
      }),
    },
  },
}));
vi.mock("../lib/loadStoreAnalytics", () => ({ readAll: mock.read }));
vi.mock("../lib/loadReferralMonthly", () => ({
  loadReferralMonthly: mock.monthly,
}));
import ExternalOrderReview from "../admin/ExternalOrderReview";
import ShiitakeLiveInventory from "../admin/ShiitakeLiveInventory";
import ReferralMonthlyDashboard from "../admin/ReferralMonthlyDashboard";
const line = {
  sourceKeyBasis: "explicit_line_id",
  inventoryReady: true,
  status: "active",
  date: "2026-10-20",
  quantity: 2,
  product: "乾椎茸(原木)",
  issues: [],
};
const record = {
  source_key: "fixture-key",
  source: "shiitake_yorankasha",
  revision: 3,
  payload: line,
  accountable: line,
  inventory_enabled: true,
  source_missing: false,
  customer_id: null,
  merchandise_yen: null,
  finance_payload: null,
};
beforeEach(() => {
  mock.rpc.mockResolvedValue({ error: null });
  mock.read.mockImplementation(async (_db: any, table: string) =>
    table === "external_order_records"
      ? [record]
      : table === "external_sheet_snapshots"
        ? [
            {
              source: "shiitake_yorankasha",
              captured_at: "2026-10-28",
              payload: { lines: [line] },
            },
          ]
        : [],
  );
  mock.from.mockImplementation((table: string) => ({
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({
          data:
            table === "shiitake_stock_baselines"
              ? {
                  baseline_date: "2026-10-20",
                  phase: "before_open",
                  quantity: 18,
                }
              : { captured_at: "2026-10-28", payload: { lines: [line] } },
          error: null,
        }),
      }),
    }),
  }));
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it("shows persisted live shop stock, not sample 17 or automatic target refill", async () => {
  render(<ShiitakeLiveInventory />);
  await screen.findByText("確認済み分の推定在庫");
  expect(screen.getByText(/開始 18個.*売上 2個/)).toBeTruthy();
  fireEvent.change(screen.getByLabelText("理由"), {
    target: { value: "納品" },
  });
  fireEvent.click(screen.getByRole("button", { name: "入出庫を保存" }));
  await waitFor(() =>
    expect(mock.rpc).toHaveBeenCalledWith(
      "record_shiitake_stock_entry",
      expect.objectContaining({ p_quantity: 1, p_reason: "納品" }),
    ),
  );
});
it("saves explicit record reconciliation with revision, never matches customers by name", async () => {
  render(<ExternalOrderReview />);
  await screen.findByRole("button", { name: "照合・設定" });
  fireEvent.click(screen.getByRole("button", { name: "照合・設定" }));
  fireEvent.change(screen.getByLabelText("照合・変更理由"), {
    target: { value: "手動在庫と重複なし" },
  });
  fireEvent.click(screen.getByRole("button", { name: "照合結果を保存" }));
  await waitFor(() =>
    expect(mock.rpc).toHaveBeenCalledWith(
      "approve_external_order",
      expect.objectContaining({
        p_key: "fixture-key",
        p_revision: 3,
        p_customer: null,
        p_inventory: true,
      }),
    ),
  );
});
it("renders monthly rates and customer links with no all-time shipping-inclusive total", async () => {
  mock.monthly.mockResolvedValue({
    customers: [
      { id: "r", last_name: "紹介", first_name: "者" },
      {
        id: "c",
        last_name: "購入",
        first_name: "者",
        referred_by_customer_id: "r",
      },
    ],
    sales: [
      {
        key: "s",
        date: "2026-10-20",
        customerId: "c",
        referrerId: "r",
        category: "web_single",
        amount: 1000,
        label: "ORD-fixture",
      },
    ],
    refunds: [],
    issues: [],
  });
  render(<ReferralMonthlyDashboard />);
  await screen.findByText("15%");
  fireEvent.change(screen.getByLabelText("対象年月"), {
    target: { value: "2026-10" },
  });
  expect(screen.getByText("15%")).toBeTruthy();
  expect(screen.getByText("5%")).toBeTruthy();
  expect(screen.getAllByText("20%")).toHaveLength(3);
  expect(
    screen.getByRole("link", { name: "購入 者" }).getAttribute("href"),
  ).toBe("/admin/customer-list/c");
  expect(screen.queryByText(/送料込み・全期間/)).toBeNull();
});
