import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
const mock = vi.hoisted(() => ({
  rpc: vi.fn(),
  from: vi.fn(),
  upsert: vi.fn(),
  insert: vi.fn(),
  remove: vi.fn(),
}));
vi.mock("@/lib/supabase", () => ({
  supabase: { rpc: mock.rpc, from: mock.from },
}));
import InventorySystem from "../admin/InventorySystem";
import { isKgReportUnavailable } from "../lib/kgInventoryAvailability";
const missing = {
  code: "PGRST202",
  message:
    "Could not find the function public.kg_report without parameters in the schema cache",
};
const fixtures: Record<string, unknown[]> = {
  inventory_seasons: [
    {
      id: "season",
      harvest_year: 2026,
      label: "2026年産",
      starts_on: "2026-10-01",
      ends_on: "2027-09-30",
      capacity_unit_kg: 5,
    },
  ],
  inventory_varieties: [
    {
      season_id: "season",
      variety_key: "koshihikari",
      harvested_kg: 100,
      reserved_kg: 10,
    },
  ],
  inventory_external_sales: [
    {
      id: "sale",
      season_id: "season",
      variety_key: "koshihikari",
      channel: "gift",
      quantity_kg: 2,
      sold_on: "2026-10-20",
      note: "旧記録",
      sales_destination: "テスト先",
    },
  ],
  orders: [],
};
beforeEach(() => {
  mock.from.mockImplementation((table: string) => {
    const builder: any = {
      select: () => builder,
      order: () => builder,
      eq: () => builder,
      upsert: (...args: unknown[]) => {
        mock.upsert(table, ...args);
        return builder;
      },
      insert: (...args: unknown[]) => {
        mock.insert(table, ...args);
        return builder;
      },
      delete: () => {
        mock.remove(table);
        return builder;
      },
      then: (resolve: (v: unknown) => unknown) =>
        Promise.resolve({ data: fixtures[table] || [], error: null }).then(
          resolve,
        ),
    };
    return builder;
  });
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
describe("legacy inventory fallback", () => {
  it("restores actual old data and harvest, manual sale, and deletion controls only when RPC is absent", async () => {
    mock.rpc.mockResolvedValue({ data: null, error: missing });
    render(<InventorySystem />);
    await screen.findByText("従来の在庫管理（参考集計）");
    await screen.findByText("テスト先");
    const harvest = screen.getAllByLabelText(
      "収穫量（kg）",
    )[0] as HTMLInputElement;
    expect(harvest.value).toBe("100");
    fireEvent.change(harvest, { target: { value: "120" } });
    fireEvent.click(screen.getByText("収穫量を保存"));
    await waitFor(() =>
      expect(mock.upsert).toHaveBeenCalledWith(
        "inventory_varieties",
        expect.arrayContaining([
          expect.objectContaining({ harvested_kg: 120 }),
        ]),
        { onConflict: "season_id,variety_key" },
      ),
    );
    await screen.findByText("年間収穫量を保存しました");
    fireEvent.change(screen.getByLabelText("販売重量（kg）"), {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByText("販売実績を追加"));
    await waitFor(() =>
      expect(mock.insert).toHaveBeenCalledWith(
        "inventory_external_sales",
        expect.objectContaining({ quantity_kg: 3, season_id: "season" }),
      ),
    );
    vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getByLabelText("販売・使用実績を削除"));
    await waitFor(() =>
      expect(mock.remove).toHaveBeenCalledWith("inventory_external_sales"),
    );
    expect(mock.rpc).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("在庫システム · kg管理")).toBeNull();
  });
  it("uses the new screen when migration is present", async () => {
    mock.rpc.mockResolvedValue({
      data: {
        seasons: [],
        products: [],
        specs: [],
        movements: [],
        snapshots: [],
        orders: [],
        stocks: [],
        sales: [],
        reviews: [],
      },
      error: null,
    });
    render(<InventorySystem />);
    await screen.findByText("未判定 0件（全年度）");
    expect(screen.queryByText("従来の在庫管理（参考集計）")).toBeNull();
    expect(mock.from).not.toHaveBeenCalled();
  });
  it.each([
    { code: "42501", message: "permission denied for function kg_report" },
    { code: "PGRST301", message: "JWT expired" },
    { code: "", message: "Failed to fetch" },
    { code: "42P01", message: "relation kg_movements does not exist" },
    {
      code: "PGRST202",
      message:
        "Could not find the function public.other_report without parameters in the schema cache",
    },
  ])("does not fall back for $code / $message", async (error) => {
    mock.rpc.mockResolvedValue({ data: null, error });
    render(<InventorySystem />);
    expect((await screen.findByRole("alert")).textContent).toContain(
      error.message,
    );
    expect(mock.from).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("従来の在庫管理を表示中")).toBeNull();
  });
  it("does not fall back for a rejected network request or denied report", async () => {
    mock.rpc
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue({ data: null, error: null });
    render(<InventorySystem />);
    await screen.findByRole("alert");
    fireEvent.click(screen.getByText("更新"));
    await screen.findByText(/管理者権限を確認してください/);
    expect(mock.from).not.toHaveBeenCalled();
  });
  it("rechecks migration availability from the legacy banner", async () => {
    mock.rpc
      .mockResolvedValueOnce({ data: null, error: missing })
      .mockResolvedValue({
        data: null,
        error: { code: "42501", message: "permission denied" },
      });
    render(<InventorySystem />);
    await screen.findByText("従来の在庫管理（参考集計）");
    fireEvent.click(screen.getByText("新しいkg管理の準備状況を再確認"));
    await screen.findByRole("alert");
    expect(screen.queryByLabelText("従来の在庫管理を表示中")).toBeNull();
  });
  it("recognizes only the exact missing PostgreSQL function", () => {
    expect(
      isKgReportUnavailable({
        code: "42883",
        message: "function public.kg_report() does not exist",
      }),
    ).toBe(true);
    expect(
      isKgReportUnavailable({
        code: "42883",
        message: "function public.internal_kg_report() does not exist",
      }),
    ).toBe(false);
  });
});
