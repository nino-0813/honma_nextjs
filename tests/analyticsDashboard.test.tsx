import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import AnalyticsDashboard from "../admin/AnalyticsDashboard";
import type { AnalyticsData } from "../lib/storeAnalytics";
afterEach(cleanup);
const now = new Date("2026-10-23T10:00:00+09:00");
const fixture: AnalyticsData = {
  orders: [
    {
      id: "o",
      total: 1000,
      payment_status: "paid",
      email: "sample@example.test",
      created_at: "2026-10-01",
      paid_at: "2026-10-02",
    },
  ],
  items: [],
  subscriptions: [],
  targets: [],
  targetsReady: true,
  inventory: null,
  productCount: 1,
  warnings: [],
};
it("shows unset goals and unavailable profit without fabricating performance", () => {
  render(
    <AnalyticsDashboard
      data={fixture}
      now={now}
      onRefresh={vi.fn()}
      onSaveTarget={vi.fn()}
    />,
  );
  expect(screen.getByText("目標未設定")).toBeTruthy();
  expect(screen.getByText("未集計")).toBeTruthy();
  expect(screen.queryByRole("progressbar")).toBeNull();
  expect(screen.getByText(/この年産の玄米換算データは未取得/)).toBeTruthy();
});
it("shows goal achievement and lets the period change without changing annual totals", () => {
  render(
    <AnalyticsDashboard
      data={{
        ...fixture,
        targets: [
          { year: 2026, revenue_target: 2000, gross_profit_target: null },
        ],
      }}
      now={now}
      onRefresh={vi.fn()}
      onSaveTarget={vi.fn()}
    />,
  );
  expect(screen.getByText("50.0% 達成")).toBeTruthy();
  fireEvent.change(screen.getByLabelText("期間"), { target: { value: "7" } });
  expect(screen.getByText("50.0% 達成")).toBeTruthy();
  expect(screen.getByText("過去7日間の売上")).toBeTruthy();
});
it("validates goal entries and preserves them on save failure for retry", async () => {
  const save = vi
    .fn()
    .mockRejectedValueOnce(new Error("保存失敗"))
    .mockResolvedValue(undefined);
  render(
    <AnalyticsDashboard
      data={fixture}
      now={now}
      onRefresh={vi.fn()}
      onSaveTarget={save}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "目標を設定" }));
  fireEvent.change(screen.getByLabelText("年間売上目標（円）"), {
    target: { value: "-1" },
  });
  fireEvent.click(screen.getByRole("button", { name: "目標を保存" }));
  expect(save).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("年間売上目標（円）"), {
    target: { value: "3000" },
  });
  fireEvent.click(screen.getByRole("button", { name: "目標を保存" }));
  await screen.findByRole("alert");
  await waitFor(() =>
    expect(
      (screen.getByLabelText("年間売上目標（円）") as HTMLInputElement).value,
    ).toBe("3000"),
  );
  await waitFor(() =>
    expect(
      (screen.getByRole("button", { name: "目標を保存" }) as HTMLButtonElement)
        .disabled,
    ).toBe(false),
  );
  fireEvent.click(screen.getByRole("button", { name: "目標を保存" }));
  await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
  expect(save).toHaveBeenLastCalledWith({
    year: 2026,
    revenue_target: 3000,
    gross_profit_target: null,
  });
});
it("blocks target saving if the settings table was not loaded", () => {
  render(
    <AnalyticsDashboard
      data={{ ...fixture, targetsReady: false, subscriptions: null }}
      now={now}
      onRefresh={vi.fn()}
      onSaveTarget={vi.fn()}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "目標を設定" }));
  expect(
    (screen.getByRole("button", { name: "目標を保存" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  expect(screen.getAllByText("未取得").length).toBeGreaterThan(0);
  expect(
    within(screen.getByRole("region", { name: "年間目標と進捗" })).getByText(
      "目標未取得",
    ),
  ).toBeTruthy();
});
