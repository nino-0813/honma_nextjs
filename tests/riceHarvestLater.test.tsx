import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import InventorySystem from "../admin/InventorySystem";
const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ supabase: mocks }));
vi.mock("../admin/InventoryMapping", () => ({
  default: () => <div>商品設定</div>,
}));
vi.mock("../admin/LegacyInventorySystem", () => ({
  default: () => <div>旧在庫</div>,
}));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
const movement = {
  season_id: "2026",
  variety_key: "koshihikari",
  incoming_kg: 0,
  used_kg: 0,
  held_kg: 0,
  accounting_version: 2,
  reason: "confirmed",
  created_at: "2026-10-22",
};
const baseline = (variety_key: string, incoming_kg = 0) => ({
  season_id: "2026",
  variety_key,
  incoming_kg,
  external_used_kg: 0,
  external_held_kg: 0,
});
function report(raw_baselines: ReturnType<typeof baseline>[] = []) {
  return {
    accounting_version: 2,
    accounting_paused: false,
    seasons: [{ id: "2026", label: "2026年産", harvest_year: 2026 }],
    products: [],
    specs: [],
    orders: [],
    snapshots: [],
    reviews: [],
    stocks: [],
    sales: [],
    subscriptions: [],
    plans: [],
    slots: [],
    raw_baselines,
    movements: [
      { ...movement, id: "sale", kind: "ec", used_kg: 55 },
      { ...movement, id: "order", kind: "ec", held_kg: 22 },
      { ...movement, id: "future", kind: "forecast", held_kg: 27.5 },
    ],
  };
}
it("displays a negative reference balance before harvest is registered without writing a zero baseline", async () => {
  mocks.rpc.mockResolvedValue({ data: report(), error: null });
  render(<InventorySystem />);
  await screen.findByRole("region", { name: "収穫量は後から登録できます" });
  expect(
    screen.getByText("差引き（参考値）").parentElement?.textContent,
  ).toContain("-104.5 kg");
  expect(screen.getByText(/マイナスは実際の在庫不足ではなく/)).toBeTruthy();
  expect(screen.queryByText(/^不足 /)).toBeNull();
  expect(mocks.rpc.mock.calls.every(([name]) => name === "kg_report")).toBe(
    true,
  );
  fireEvent.click(screen.getByRole("button", { name: "収穫量をあとから登録" }));
  expect(
    (screen.getByLabelText("玄米総入庫 kg") as HTMLInputElement).value,
  ).toBe("");
  expect(mocks.rpc.mock.calls.every(([name]) => name === "kg_report")).toBe(
    true,
  );
});
it("recalculates after real harvest is registered without double subtracting orders or forecast", async () => {
  mocks.rpc.mockResolvedValue({ data: report(), error: null });
  render(<InventorySystem />);
  await screen.findByRole("region", { name: "収穫量は後から登録できます" });
  mocks.rpc.mockResolvedValue({
    data: report([
      baseline("koshihikari", 1000),
      baseline("kamenoo"),
      baseline("nikomaru"),
    ]),
    error: null,
  });
  fireEvent.click(screen.getByRole("button", { name: /^更新$/ }));
  await waitFor(() =>
    expect(
      screen.queryByRole("region", { name: "収穫量は後から登録できます" }),
    ).toBeNull(),
  );
  expect(
    screen.getByText("あと販売できる量").parentElement?.textContent,
  ).toContain("895.5 kg");
});
it("still distinguishes a confirmed shortage from a missing harvest", async () => {
  mocks.rpc.mockResolvedValue({
    data: report([
      baseline("koshihikari", 10),
      baseline("kamenoo"),
      baseline("nikomaru"),
    ]),
    error: null,
  });
  render(<InventorySystem />);
  await screen.findByText("不足 94.5 kg");
  expect(
    screen.queryByRole("region", { name: "収穫量は後から登録できます" }),
  ).toBeNull();
});
