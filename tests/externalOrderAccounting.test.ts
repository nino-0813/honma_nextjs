// @vitest-environment node
import { expect, it } from "vitest";
import {
  externalRiceUsage,
  shiitakeLiveStock,
  externalFinanceUnchanged,
  type ExternalOrderRecord,
} from "../lib/externalOrderAccounting";
const line: any = {
  sourceKeyBasis: "explicit_line_id",
  inventoryReady: true,
  status: "active",
  date: "2026-10-20",
  quantity: 2,
  unitKg: 5,
  variety: "koshihikari",
  milling: "white",
  harvestYear: 2026,
};
const record: ExternalOrderRecord = {
  source: "rice_tabechoku",
  source_key: "fixture",
  revision: 1,
  payload: line,
  accountable: line,
  inventory_enabled: true,
  source_missing: false,
  customer_id: null,
  merchandise_yen: null,
  finance_payload: null,
};
it("accounts rice by confirmed harvest year and raw-rice factors without touching EC stock", () => {
  expect(externalRiceUsage([record], 2026).koshihikari).toBe(11);
  expect(externalRiceUsage([record], 2025).koshihikari).toBe(0);
  expect(
    externalRiceUsage(
      [{ ...record, accountable: { ...line, milling: "partial" } }],
      2026,
    ).koshihikari,
  ).toBe(10.5);
  expect(
    externalRiceUsage([{ ...record, inventory_enabled: false }], 2026)
      .koshihikari,
  ).toBe(0);
  expect(
    externalRiceUsage(
      [{ ...record, accountable: { ...line, status: "cancelled" } }],
      2026,
    ).koshihikari,
  ).toBe(0);
});
it("preserves last accountable value on source deletion and invalid edits pending manual review", () => {
  expect(
    externalRiceUsage(
      [
        {
          ...record,
          source_missing: true,
          payload: { ...line, inventoryReady: false, quantity: 999 },
        },
      ],
      2026,
    ).koshihikari,
  ).toBe(11);
});
it("starts at Oct20 opening stock, includes Oct20 sales, and does not automatically refill to target", () => {
  const r = { ...record, source: "shiitake_yorankasha" };
  const b: any = {
    baseline_date: "2026-10-20",
    phase: "before_open",
    quantity: 18,
  };
  expect(
    shiitakeLiveStock(b, [r], [{ entry_date: "2026-10-20", quantity: 3 }]),
  ).toMatchObject({ stock: 19, sold: 2, added: 3, target: 18 });
  expect(
    shiitakeLiveStock({ ...b, phase: "after_close" }, [r], []),
  ).toMatchObject({ stock: 18, sold: 0 });
  expect(shiitakeLiveStock(null, [r], [])).toBeNull();
});
it("requires financial reconfirmation when quantity or money changes", () => {
  const r = { ...record, finance_payload: line };
  expect(externalFinanceUnchanged(r)).toBeTruthy();
  expect(
    externalFinanceUnchanged({ ...r, payload: { ...line, quantity: 3 } }),
  ).toBe(false);
});
