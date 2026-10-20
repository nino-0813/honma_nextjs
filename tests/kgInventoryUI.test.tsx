import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
const rpc = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase", () => ({ supabase: { rpc } }));
import InventorySystem from "../admin/InventorySystem";
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
const report = {
  seasons: [{ id: "2026", label: "2026年産", harvest_year: 2026 }],
  products: [],
  specs: [],
  snapshots: [],
  movements: [],
  orders: [],
  stocks: [
    {
      season_id: "2026",
      variety_key: "koshihikari",
      harvested_kg: 5,
      reserved_kg: 0,
    },
  ],
  sales: [],
};
describe("admin kg screen", () => {
  it("shows deficits and does not claim uncertain stock as available", async () => {
    rpc.mockResolvedValue({
      data: {
        ...report,
        orders: [{ id: "o", order_number: "TEST", order_items: [] }],
        movements: [
          {
            id: "m",
            season_id: "2026",
            variety_key: "koshihikari",
            used_kg: 10,
            incoming_kg: 0,
            held_kg: 0,
            created_at: "2026-01-01",
            kind: "ec",
            reason: "paid",
          },
        ],
      },
      error: null,
    });
    render(<InventorySystem />);
    await screen.findByText("不足 5 kg");
    expect(screen.getAllByText("販売可能: 未確定")).toHaveLength(3);
    expect(screen.getByText(/未判定 1件/)).toBeTruthy();
  });
  it("never renders zero stock on a failed report fetch", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "offline" } });
    render(<InventorySystem />);
    expect((await screen.findByRole("alert")).textContent).toContain("offline");
    expect(screen.queryByLabelText("銘柄別在庫")).toBeNull();
  });
  it("keeps the form available after a save failure for a safe retry", async () => {
    rpc
      .mockResolvedValueOnce({ data: report, error: null })
      .mockResolvedValue({ error: { message: "retry me" } });
    render(<InventorySystem />);
    await screen.findByLabelText("重量 kg（調整のみ負数可）");
    fireEvent.change(screen.getByLabelText("重量 kg（調整のみ負数可）"), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getByLabelText("理由・販売先"), {
      target: { value: "harvest" },
    });
    fireEvent.click(screen.getByText("履歴に追加"));
    await screen.findByRole("alert");
    expect(screen.getByLabelText("重量 kg（調整のみ負数可）")).toBeTruthy();
    fireEvent.click(screen.getByText("履歴に追加"));
    await waitFor(() => expect(rpc).toHaveBeenCalledTimes(3));
    expect(rpc.mock.calls[1][1].request).toBe(rpc.mock.calls[2][1].request);
  });
});
