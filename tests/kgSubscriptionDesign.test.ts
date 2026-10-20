import { describe, expect, it } from "vitest";
import {
  balance,
  monthlySlots,
  rawMg,
  type ComponentSnapshot,
  type Slot,
} from "./fixtures/kgSubscriptionPrototype";
const white: ComponentSnapshot = {
  variety: "koshihikari",
  rawMg: rawMg(5000, 1, "white"),
  milling: "white",
};
const brown: ComponentSnapshot = {
  variety: "nikomaru",
  rawMg: rawMg(10000, 1, "brown"),
  milling: "brown",
};
describe("design-only future raw-rice reservations (cutoffs are test inputs)", () => {
  it("counts two-month deliveries Dec to September as five", () => {
    const dates = monthlySlots("2026-12-15", 2, "2027-09");
    expect(dates).toEqual([
      "2026-12-15",
      "2027-02-15",
      "2027-04-15",
      "2027-06-15",
      "2027-08-15",
    ]);
    expect(dates.length * rawMg(5000, 1, "white")).toBe(27_500_000);
  });
  it("includes October for quarterly November start", () => {
    const dates = monthlySlots("2026-11-15", 3, "2027-10");
    expect(dates).toEqual([
      "2026-11-15",
      "2027-02-15",
      "2027-05-15",
      "2027-08-15",
    ]);
    expect(dates.length * rawMg(10000, 1, "white")).toBe(44_000_000);
    expect(monthlySlots("2026-10-15", 3, "2027-10")).toHaveLength(5);
  });
  it("applies all milling factors and quantity without rounding each gram", () => {
    expect(rawMg(5000, 2, "partial")).toBe(10_500_000);
    expect(rawMg(5000, 2, "brown")).toBe(10_000_000);
    expect(rawMg(1, 1, "partial")).toBe(1050);
    expect(() => rawMg(5000, 0, "white")).toThrow();
  });
  it("holds a paid/unshipped order once, then moves the same amount to shipped", () => {
    const slot: Slot = {
      key: "sub:item:delivery1",
      forecast: white,
      order: { id: "order1", canceled: false, snapshot: white },
    };
    expect(balance([slot])).toEqual({
      koshihikari: { usedMg: 0, heldMg: 5_500_000 },
    });
    expect(balance([{ ...slot, shipped: white }])).toEqual({
      koshihikari: { usedMg: 5_500_000, heldMg: 0 },
    });
  });
  it("changes only future predictions, retaining shipped and already-created order snapshots", () => {
    const slots: Slot[] = [
      { key: "past", forecast: brown, shipped: white },
      {
        key: "created",
        forecast: brown,
        order: { id: "o", canceled: false, snapshot: white },
      },
      { key: "future", forecast: brown },
    ];
    expect(balance(slots)).toEqual({
      koshihikari: { usedMg: 5_500_000, heldMg: 5_500_000 },
      nikomaru: { usedMg: 0, heldMg: 10_000_000 },
    });
    expect(balance(slots, true)).toEqual({
      koshihikari: { usedMg: 5_500_000, heldMg: 5_500_000 },
    });
  });
  it("releases a canceled unshipped order without resurrecting its forecast, but retains shipped returns", () => {
    const slot: Slot = {
      key: "d",
      forecast: white,
      order: { id: "o", canceled: true, snapshot: white },
    };
    expect(balance([slot])).toEqual({});
    expect(
      balance([{ ...slot, shipped: white }], true).koshihikari.usedMg,
    ).toBe(5_500_000);
  });
  it("rejects duplicate delivery identities rather than guessing which order to subtract", () => {
    expect(() =>
      balance([
        { key: "d", forecast: white },
        { key: "d", forecast: white },
      ]),
    ).toThrow("ambiguous");
  });
  it("reanchors after one-month skip, includes deadline month and clamps month ends", () => {
    expect(monthlySlots("2027-01-15", 2, "2027-09")).toEqual([
      "2027-01-15",
      "2027-03-15",
      "2027-05-15",
      "2027-07-15",
      "2027-09-15",
    ]);
    expect(monthlySlots("2027-01-31", 1, "2027-03")).toEqual([
      "2027-01-31",
      "2027-02-28",
      "2027-03-31",
    ]);
    expect(() => monthlySlots("2027-02-31", 1, "2027-10")).toThrow();
  });
});
