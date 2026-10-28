/** Use the charged subscription line's billing period, never webhook arrival/payment day.
 * Missing, paginated, prorated or conflicting periods remain unassigned for review.
 */
export function invoiceShipmentDate(
  invoice: any,
  interval: string | undefined,
): string | null {
  if (
    invoice.billing_reason !== "subscription_cycle" ||
    invoice.currency !== "jpy" ||
    invoice.lines?.has_more ||
    !Array.isArray(invoice.lines?.data)
  )
    return null;
  const periods = invoice.lines.data
    .filter(
      (line: any) =>
        (line.type === "subscription" ||
          line.parent?.type === "subscription_item_details") &&
        !line.proration &&
        !line.parent?.subscription_item_details?.proration,
    )
    .map((line: any) => line.period?.start);
  if (
    !periods.length ||
    periods.some((s: any) => !Number.isSafeInteger(s) || s <= 0) ||
    new Set(periods).size !== 1
  )
    return null;
  const day = new Date(periods[0] * 1000 + 9 * 3600000)
    .toISOString()
    .slice(0, 10);
  if (["weekly", "biweekly"].includes(interval || "")) return day;
  if (
    !["monthly", "bimonthly", "quarterly", "semiannual", "annual"].includes(
      interval || "",
    )
  )
    return null;
  return `${day.slice(0, 7)}-15`;
}
