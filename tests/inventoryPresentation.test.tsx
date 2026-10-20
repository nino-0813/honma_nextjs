import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import InventoryMapping from "../admin/InventoryMapping";
import KgSubscriptionSettings from "../admin/KgSubscriptionSettings";
import { confirmedHarvestMonth } from "../lib/inventoryPresentation";
const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  upsert: vi.fn(),
  rpc: vi.fn(),
}));
vi.mock("@/lib/supabase", () => ({ supabase: mocks }));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
const base = {
  season: "season",
  seasons: [{ id: "season", label: "2026年産" }],
  products: [{ id: "product", title: "コシヒカリ5kg" }],
  specs: [],
  unknown: [],
  rawMode: true,
  busy: false,
  save: async (action: () => PromiseLike<unknown>) => {
    await action();
  },
};
function mockProduct(fail = false) {
  mocks.upsert.mockResolvedValue({ error: null });
  mocks.from.mockImplementation((table: string) =>
    table === "products"
      ? {
          select: () => ({
            eq: () => ({
              single: async () =>
                fail
                  ? { error: { message: "読込失敗" } }
                  : {
                      error: null,
                      data: {
                        variants_config: [
                          {
                            id: "milling",
                            name: "商品の精米",
                            options: [
                              { id: "white-id", value: "白米" },
                              { id: "brown-id", value: "玄米" },
                            ],
                          },
                        ],
                      },
                    },
            }),
          }),
        }
      : { upsert: mocks.upsert },
  );
}
function fillWeight() {
  fireEvent.change(screen.getByLabelText("商品重量（kg／個）"), {
    target: { value: "5" },
  });
  fireEvent.change(screen.getByLabelText("精米方法"), {
    target: { value: "white" },
  });
  fireEvent.change(screen.getByLabelText("確認根拠・理由"), {
    target: { value: "当時の記録確認済み" },
  });
}
it("uses the confirmed cutoff only for the confirmed harvest year", () => {
  expect(confirmedHarvestMonth(2026, "koshihikari")).toBe("2027-09");
  expect(confirmedHarvestMonth(2026, "kamenoo")).toBe("2027-09");
  expect(confirmedHarvestMonth(2026, "nikomaru")).toBe("2027-10");
  expect(confirmedHarvestMonth(2025, "nikomaru")).toBe("");
});
it("prefills approved deadlines without writing until the administrator saves", async () => {
  mocks.rpc.mockResolvedValue({ error: null });
  render(
    <KgSubscriptionSettings
      mode="settings"
      harvestYear={2026}
      season="season"
      baselines={[]}
      rules={[]}
      plans={[]}
      slots={[]}
      subscriptions={[]}
      products={[]}
      orders={[]}
      save={base.save}
      busy={false}
    />,
  );
  const month = screen.getByLabelText(
    "この年産の最終発送月（未確定の値を入れない）",
  ) as HTMLInputElement;
  expect(month.value).toBe("2027-09");
  fireEvent.change(screen.getByLabelText("設定する銘柄"), {
    target: { value: "nikomaru" },
  });
  expect(month.value).toBe("2027-10");
  expect(mocks.rpc).not.toHaveBeenCalled();
  fireEvent.change(
    screen.getByRole("textbox", { name: "確認根拠" }),
    { target: { value: "年産と締切確認済み" } },
  );
  fireEvent.click(screen.getByText("期限月を保存・予測再計算"));
  await waitFor(() =>
    expect(mocks.rpc).toHaveBeenCalledWith(
      "kg_save_harvest_rule",
      expect.objectContaining({
        season: "season",
        variety: "nikomaru",
        last_month: "2027-10-01",
      }),
    ),
  );
});
it("saves product kg and milling once in v2, with real selected option IDs", async () => {
  mockProduct();
  render(<InventoryMapping {...base} />);
  fireEvent.change(screen.getByLabelText("商品"), {
    target: { value: "product" },
  });
  fireEvent.change(await screen.findByLabelText("商品の精米"), {
    target: { value: "white-id" },
  });
  fillWeight();
  expect(screen.getByText("必要な玄米：5.5 kg／個")).toBeTruthy();
  fireEvent.click(screen.getByText("確認して保存"));
  await waitFor(() =>
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        options: { milling: "white-id" },
        components: [
          {
            season_id: "season",
            variety_key: "koshihikari",
            unit_kg: 5,
            milling: "white",
          },
        ],
      }),
      expect.anything(),
    ),
  );
});
it("converts product kg to original v1 units when the extension is not installed", async () => {
  mockProduct();
  render(<InventoryMapping {...base} rawMode={false} />);
  fireEvent.change(screen.getByLabelText("商品"), {
    target: { value: "product" },
  });
  fireEvent.change(await screen.findByLabelText("商品の精米"), {
    target: { value: "white-id" },
  });
  fillWeight();
  fireEvent.click(screen.getByText("確認して保存"));
  await waitFor(() =>
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        components: [
          { season_id: "season", variety_key: "koshihikari", unit_kg: 5.5 },
        ],
      }),
      expect.anything(),
    ),
  );
});
it("does not save an empty option mapping when product options fail to load", async () => {
  mockProduct(true);
  render(<InventoryMapping {...base} />);
  fireEvent.change(screen.getByLabelText("商品"), {
    target: { value: "product" },
  });
  await screen.findByText("読込失敗");
  expect((screen.getByText("確認して保存") as HTMLButtonElement).disabled).toBe(
    true,
  );
  expect(mocks.upsert).not.toHaveBeenCalled();
});
it("keeps quantity on the historical item and submits only per-item kg", async () => {
  mocks.rpc.mockResolvedValue({ error: null });
  render(
    <InventoryMapping
      {...base}
      unknown={[
        {
          id: "item",
          order: "ORD-test",
          title: "5kg × 2",
          reason: "未紐付け",
          item: {
            id: "item",
            order_id: "order",
            product_title: "5kg",
            quantity: 2,
            selected_options: { legacy_migration: "old" },
          },
        },
      ]}
    />,
  );
  fireEvent.change(screen.getByLabelText("対象"), {
    target: { value: "item" },
  });
  fireEvent.change(screen.getByLabelText("注文明細"), {
    target: { value: "item" },
  });
  fillWeight();
  fireEvent.click(screen.getByText("確認して保存"));
  await waitFor(() =>
    expect(mocks.rpc).toHaveBeenCalledWith(
      "kg_resolve_item",
      expect.objectContaining({
        item: "item",
        components: [
          {
            season_id: "season",
            variety_key: "koshihikari",
            unit_kg: 5,
            milling: "white",
          },
        ],
      }),
    ),
  );
});
