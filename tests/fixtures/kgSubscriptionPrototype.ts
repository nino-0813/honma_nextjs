/** Design-only fixture: not imported by production code. Cutoffs are explicit
 * test inputs, not confirmed harvest-year settings. All weights use integer mg. */
export type Milling = "white" | "partial" | "brown";
export function rawMg(unitGrams: number, quantity: number, milling: Milling) {
  if (
    !Number.isSafeInteger(unitGrams) ||
    unitGrams <= 0 ||
    !Number.isSafeInteger(quantity) ||
    quantity <= 0
  )
    throw new Error("invalid weight or quantity");
  const percent = { white: 110, partial: 105, brown: 100 }[milling];
  if (!percent) throw new Error("unknown milling");
  const mg = unitGrams * quantity * percent * 10;
  if (!Number.isSafeInteger(mg)) throw new Error("overflow");
  return mg;
}
export function monthlySlots(
  first: string,
  intervalMonths: number,
  endMonth: string,
) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(first) ||
    !/^\d{4}-\d{2}$/.test(endMonth) ||
    ![1, 2, 3, 6, 12].includes(intervalMonths)
  )
    throw new Error("invalid schedule");
  const [y, m, d] = first.split("-").map(Number),
    [ey, em] = endMonth.split("-").map(Number);
  const firstDate = new Date(Date.UTC(y, m - 1, d));
  if (firstDate.toISOString().slice(0, 10) !== first || em < 1 || em > 12)
    throw new Error("invalid date");
  const slots: string[] = [];
  for (
    let month = y * 12 + m - 1;
    month <= ey * 12 + em - 1;
    month += intervalMonths
  ) {
    if (slots.length > 240) throw new Error("unbounded horizon");
    const year = Math.floor(month / 12),
      mo = month % 12;
    const day = Math.min(d, new Date(Date.UTC(year, mo + 1, 0)).getUTCDate());
    slots.push(new Date(Date.UTC(year, mo, day)).toISOString().slice(0, 10));
  }
  return slots;
}
export type ComponentSnapshot = {
  variety: string;
  rawMg: number;
  milling: Milling;
};
export type Slot = {
  key: string;
  forecast?: ComponentSnapshot;
  order?: { id: string; canceled: boolean; snapshot: ComponentSnapshot };
  shipped?: ComponentSnapshot;
};
/** A confirmed materialized order replaces its forecast; shipment replaces its
 * order hold. Contract cancellation removes only unmaterialized predictions. */
export function balance(slots: Slot[], contractCanceled = false) {
  if (new Set(slots.map((s) => s.key)).size !== slots.length)
    throw new Error("ambiguous delivery identity");
  const result: Record<string, { usedMg: number; heldMg: number }> = {};
  for (const slot of slots) {
    const source =
      slot.shipped ||
      (slot.order
        ? slot.order.canceled
          ? undefined
          : slot.order.snapshot
        : contractCanceled
          ? undefined
          : slot.forecast);
    if (!source) continue;
    result[source.variety] ||= { usedMg: 0, heldMg: 0 };
    if (slot.shipped) result[source.variety].usedMg += source.rawMg;
    else result[source.variety].heldMg += source.rawMg;
  }
  return result;
}
