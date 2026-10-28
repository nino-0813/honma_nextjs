import type { ExternalSheetLine } from "./externalOrderSheets";
import {
  shiitakeSaleAfterBaseline,
  type ShiitakeBaseline,
} from "./shiitakeBaseline";
export type ExternalOrderRecord = {
  source_key: string;
  source: string;
  revision: number;
  payload: ExternalSheetLine;
  accountable: ExternalSheetLine | null;
  source_missing: boolean;
  inventory_enabled: boolean;
  customer_id: string | null;
  merchandise_yen: number | null;
  finance_payload: ExternalSheetLine | null;
};
export function externalRecordNeedsReview(r: ExternalOrderRecord) {
  return (
    r.source_missing ||
    !r.payload.inventoryReady ||
    r.payload.sourceKeyBasis !== "explicit_line_id" ||
    !r.inventory_enabled
  );
}
export function externalRiceUsage(
  records: ExternalOrderRecord[],
  year: number,
) {
  const totals: Record<string, number> = {
    koshihikari: 0,
    kamenoo: 0,
    nikomaru: 0,
  };
  for (const r of records) {
    const line = r.accountable;
    if (
      !r.inventory_enabled ||
      !r.source.startsWith("rice_") ||
      !line?.inventoryReady ||
      line.status !== "active" ||
      line.harvestYear !== year ||
      !line.variety ||
      !line.unitKg ||
      !line.quantity
    )
      continue;
    const rate =
      line.milling === "white" ? 1.1 : line.milling === "partial" ? 1.05 : 1;
    totals[line.variety] += Math.round(
      line.unitKg * line.quantity * rate * 1e6,
    );
  }
  return Object.fromEntries(
    Object.entries(totals).map(([key, value]) => [key, value / 1e6]),
  );
}
export function shiitakeLiveStock(
  baseline: ShiitakeBaseline | null,
  records: ExternalOrderRecord[],
  entries: { entry_date: string; quantity: number }[],
) {
  if (!baseline) return null;
  let sold = 0,
    added = 0;
  for (const r of records) {
    const line = r.accountable;
    if (
      r.source !== "shiitake_yorankasha" ||
      !r.inventory_enabled ||
      line?.status !== "active" ||
      !line.date ||
      !line.quantity ||
      !shiitakeSaleAfterBaseline(line.date, baseline)
    )
      continue;
    sold += line.quantity;
  }
  // A same-day replenishment happens after the opening count; closing counts already include it.
  for (const entry of entries)
    if (shiitakeSaleAfterBaseline(entry.entry_date, baseline))
      added += entry.quantity;
  return {
    stock: baseline.quantity + added - sold,
    sold,
    added,
    target: 18,
    needed: Math.max(0, 18 - (baseline.quantity + added - sold)),
  };
}
export function externalFinanceUnchanged(r: ExternalOrderRecord) {
  const keys: (keyof ExternalSheetLine)[] = [
    "date",
    "product",
    "quantity",
    "unitKg",
    "variety",
    "milling",
    "reportedSales",
    "productSales",
    "shippingAmount",
    "productDiscount",
  ];
  return (
    !r.source_missing &&
    r.payload.status === "active" &&
    r.payload.inventoryReady &&
    r.finance_payload &&
    keys.every((key) => r.payload[key] === r.finance_payload![key])
  );
}
