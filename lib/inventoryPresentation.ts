import type { Component } from "./kgInventory";

export const millingLabels = {
  white: "白米",
  partial: "分づき",
  brown: "玄米",
} as const;
export const millingFactors = { white: 1.1, partial: 1.05, brown: 1 } as const;

export function confirmedHarvestMonth(
  year: number | undefined,
  variety: string,
) {
  if (year !== 2026) return "";
  return variety === "nikomaru" ? "2027-10" : "2027-09";
}

export function componentRawKg(c: Component, quantity = 1) {
  if (c.raw_unit_kg != null) return Number(c.raw_unit_kg) * quantity;
  if (!c.milling || !millingFactors[c.milling]) return null;
  return (
    Math.round(Number(c.unit_kg) * millingFactors[c.milling] * quantity * 1e6) /
    1e6
  );
}

export function readableInterval(value: string) {
  return (
    (
      {
        monthly: "毎月",
        bimonthly: "2か月おき",
        quarterly: "3か月おき",
        semiannual: "6か月おき",
        yearly: "毎年",
      } as Record<string, string>
    )[value] || value
  );
}
