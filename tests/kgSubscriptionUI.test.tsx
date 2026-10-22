import React from "react";
import { afterEach, expect, it, vi } from "vitest";
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
const report = {
  accounting_version: 2,
  accounting_paused: false,
  seasons: [{ id: "s", label: "fixture year", harvest_year: 2090 }],
  products: [],
  specs: [],
  snapshots: [],
  movements: [],
  orders: [],
  stocks: [],
  sales: [],
  reviews: [],
  raw_baselines: [],
  plans: [],
  slots: [],
  subscriptions: [],
  harvest_rules: [],
};
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
it("keeps v1 recording in its original units without exposing v2 settings", async () => {
  const { accounting_version, ...v1 } = report;
  rpc.mockResolvedValue({ data: v1, error: null });
  render(<InventorySystem />);
  await screen.findByText("初期kg版を使用中（玄米換算・定期将来確保は未導入）");
  expect(screen.queryByText("契約の発送アンカーを確認")).toBeNull();
  expect(screen.queryByLabelText("販売・使用の精米区分")).toBeNull();
  fireEvent.change(screen.getByLabelText("区分"), {
    target: { value: "direct" },
  });
  fireEvent.change(screen.getByLabelText("重量 kg（調整のみ負数可）"), {
    target: { value: "5" },
  });
  fireEvent.change(screen.getByLabelText("理由・販売先"), {
    target: { value: "v1 fixture" },
  });
  fireEvent.click(screen.getByText("履歴に追加"));
  await waitFor(() =>
    expect(rpc).toHaveBeenCalledWith(
      "kg_record_movement",
      expect.objectContaining({ kg: 5, reason: "v1 fixture" }),
    ),
  );
});
it("does not assume a deadline year or convert old balances", async () => {
  rpc.mockResolvedValue({
    data: {
      ...report,
      stocks: [
        {
          season_id: "s",
          variety_key: "koshihikari",
          harvested_kg: 999,
          reserved_kg: 0,
        },
      ],
    },
    error: null,
  });
  render(<InventorySystem />);
  const month = await screen.findByLabelText(
    "この年産の最終発送月（未確定の値を入れない）",
  );
  expect((month as HTMLInputElement).value).toBe("");
  expect(screen.getAllByText("差引き（収穫量未登録・参考値）")).toHaveLength(3);
  expect(
    screen.getAllByText("収穫量は未登録です。あとから登録できます。"),
  ).toHaveLength(3);
});
it("hides stale numbers and edit controls when the accounting triggers are paused", async () => {
  rpc.mockResolvedValue({
    data: { ...report, accounting_paused: true },
    error: null,
  });
  render(<InventorySystem />);
  await screen.findByText("kg在庫連動を停止中");
  expect(screen.queryByLabelText("銘柄別在庫")).toBeNull();
  expect(screen.queryByText("履歴に追加")).toBeNull();
});
it("applies milling to direct sale quantities and preserves the factor in the audit reason", async () => {
  rpc.mockResolvedValue({ data: report, error: null });
  render(<InventorySystem />);
  await screen.findByRole("button", { name: "入出庫・販売履歴" });
  fireEvent.click(screen.getByRole("button", { name: "入出庫・販売履歴" }));
  fireEvent.change(screen.getByLabelText("区分"), {
    target: { value: "direct" },
  });
  fireEvent.change(screen.getByLabelText("販売・使用の精米区分"), {
    target: { value: "white" },
  });
  fireEvent.change(screen.getByLabelText("重量 kg（調整のみ負数可）"), {
    target: { value: "5" },
  });
  fireEvent.change(screen.getByLabelText("理由・販売先"), {
    target: { value: "fixture" },
  });
  fireEvent.click(screen.getByText("履歴に追加"));
  await waitFor(() =>
    expect(rpc).toHaveBeenCalledWith(
      "kg_record_movement",
      expect.objectContaining({
        kg: 5.5,
        reason: "fixture / 製品5kg・white×1.1",
      }),
    ),
  );
});
