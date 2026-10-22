import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import InventoryWorkspace from "../admin/InventoryWorkspace";
afterEach(cleanup);
function mount() {
  render(
    <InventoryWorkspace
      initialCategory="shiitake"
      ricePanel={<p>既存のお米画面</p>}
    />,
  );
}
it("shows a clearly marked, disconnected preview without network or storage writes", () => {
  const fetch = vi.spyOn(globalThis, "fetch");
  const storage = vi.spyOn(Storage.prototype, "setItem");
  mount();
  expect(screen.getByText("デザイン案・サンプルデータ")).toBeTruthy();
  expect(
    screen.getByText("GAS・スプレッドシート連携は未設定です。"),
  ).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "試しに保存する" }));
  expect(screen.getByRole("status").textContent).toContain(
    "サンプル在庫を18個",
  );
  expect(fetch).not.toHaveBeenCalled();
  expect(storage).not.toHaveBeenCalled();
  fetch.mockRestore();
  storage.mockRestore();
});
it("previews quantity changes and records the sample restock", () => {
  mount();
  fireEvent.click(screen.getByRole("button", { name: "数量を1個増やす" }));
  expect((screen.getByLabelText("数量") as HTMLInputElement).value).toBe("2");
  fireEvent.change(screen.getByLabelText("メモ（任意）"), {
    target: { value: "2個補充の試し操作" },
  });
  fireEvent.click(screen.getByRole("button", { name: "試しに保存する" }));
  expect(screen.getByRole("status").textContent).toContain("19個");
  expect(screen.getByText("+2個")).toBeTruthy();
  expect(
    screen.getByText("目標の18個に達しています。必要に応じて補充できます。"),
  ).toBeTruthy();
});
it("requires a reason for a count correction, including zero stock", () => {
  mount();
  fireEvent.click(screen.getByRole("button", { name: "実数を調整" }));
  fireEvent.change(screen.getByLabelText("店頭の実数"), {
    target: { value: "0" },
  });
  fireEvent.click(screen.getByRole("button", { name: "試しに保存する" }));
  expect(screen.getByRole("alert").textContent).toContain("調整する理由");
  fireEvent.change(screen.getByLabelText("メモ（調整理由・必須）"), {
    target: { value: "全量回収" },
  });
  fireEvent.click(screen.getByRole("button", { name: "試しに保存する" }));
  expect(screen.getByRole("status").textContent).toContain("0個");
  expect(screen.getByText("-17個")).toBeTruthy();
});
it.each(["", "-1", "1.5", "10000"])(
  "rejects invalid restock quantity %s",
  (value) => {
    mount();
    fireEvent.change(screen.getByLabelText("数量"), { target: { value } });
    fireEvent.click(screen.getByRole("button", { name: "試しに保存する" }));
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.queryByRole("status")).toBeNull();
  },
);
it("opens history and settings, and switches back to the unchanged rice panel", () => {
  mount();
  fireEvent.click(screen.getByRole("button", { name: "取込履歴を見る" }));
  expect(
    within(
      screen.getByRole("region", { name: "売上メールの取込履歴" }),
    ).getByText(/まだメールは取り込まれていません/),
  ).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "詳細を閉じる" }));
  fireEvent.click(screen.getByRole("button", { name: "設定を見る" }));
  expect(screen.getByRole("region", { name: "連携設定の準備" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: /^お米$/ }));
  expect(screen.getByText("既存のお米画面").closest("[hidden]")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "椎茸・直売所" }));
  expect(
    screen
      .getByRole("button", { name: "椎茸・直売所" })
      .getAttribute("aria-pressed"),
  ).toBe("true");
});
