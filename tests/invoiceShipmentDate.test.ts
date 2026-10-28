// @vitest-environment node
import { expect, it } from "vitest";
import { invoiceShipmentDate } from "../lib/invoiceShipmentDate";
const period = Math.floor(Date.parse("2027-01-09T20:00:00Z") / 1000);
const invoice = {
  billing_reason: "subscription_cycle",
  currency: "jpy",
  lines: {
    has_more: false,
    data: [
      { type: "subscription", period: { start: period }, proration: false },
    ],
  },
};
it("uses billed line period even when payment and webhook arrive months later", () => {
  expect(
    invoiceShipmentDate(
      { ...invoice, created: period + 90 * 86400 },
      "bimonthly",
    ),
  ).toBe("2027-01-15");
  expect(invoiceShipmentDate(invoice, "weekly")).toBe("2027-01-10");
});
it("does not invent shipping dates from missing, conflicting, prorated or paginated invoice data", () => {
  expect(
    invoiceShipmentDate(
      { ...invoice, lines: { has_more: true, data: invoice.lines.data } },
      "monthly",
    ),
  ).toBeNull();
  expect(
    invoiceShipmentDate(
      {
        ...invoice,
        lines: { data: [{ ...invoice.lines.data[0], proration: true }] },
      },
      "monthly",
    ),
  ).toBeNull();
  expect(
    invoiceShipmentDate(
      {
        ...invoice,
        lines: {
          data: [
            ...invoice.lines.data,
            { type: "subscription", period: { start: period + 86400 } },
          ],
        },
      },
      "monthly",
    ),
  ).toBeNull();
  expect(
    invoiceShipmentDate({ ...invoice, lines: undefined }, "monthly"),
  ).toBeNull();
  expect(invoiceShipmentDate(invoice, "unknown")).toBeNull();
});
