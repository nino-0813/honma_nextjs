import {
  externalFinanceUnchanged,
  type ExternalOrderRecord,
} from "./externalOrderAccounting";
export const referralCategories = {
  web_single: { label: "自社単品", rate: 15 },
  web_subscription: { label: "自社定期便", rate: 5 },
  satofuru: { label: "さとふる", rate: 20 },
  furusatodo: { label: "ふるさとdo", rate: 20 },
  direct: { label: "直接注文", rate: 20 },
} as const;
export type ReferralCategory = keyof typeof referralCategories;
export type ReferralSale = {
  key: string;
  date: string;
  customerId: string;
  referrerId: string;
  category: ReferralCategory;
  amount: number;
  label: string;
};
export type ReferralRefund = {
  id: string;
  sale_key: string;
  refunded_on: string;
  merchandise_yen: number;
  external_reference: string;
};
export type ReferralIssue = { key: string; reason: string };
const yen = (value: unknown) =>
  value !== null &&
  value !== undefined &&
  value !== "" &&
  Number.isSafeInteger(Number(value)) &&
  Number(value) >= 0 &&
  Number(value) <= 1e9
    ? Number(value)
    : null;
export const referralJstDay = (iso: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(iso)
    ? iso
    : Number.isFinite(Date.parse(iso))
      ? new Date(Date.parse(iso) + 9 * 3600_000).toISOString().slice(0, 10)
      : "";
export function buildReferralSales(
  customers: any[],
  orders: any[],
  external: ExternalOrderRecord[],
  direct: any[],
) {
  const sales: ReferralSale[] = [],
    issues: ReferralIssue[] = [];
  const customersById = new Map(customers.map((c) => [c.id, c]));
  const customerEmails = new Map<string, any[]>();
  for (const c of customers)
    if (c.email) {
      const email = c.email.trim().toLowerCase();
      customerEmails.set(email, [...(customerEmails.get(email) || []), c]);
    }
  function linked(customer: any) {
    return (
      customer &&
      customer.referred_by_customer_id &&
      customersById.has(customer.referred_by_customer_id)
    );
  }
  const paymentCounts = new Map<string, number>();
  for (const o of orders)
    if (o.payment_intent_id)
      paymentCounts.set(
        o.payment_intent_id,
        (paymentCounts.get(o.payment_intent_id) || 0) + 1,
      );
  for (const order of orders) {
    if (!["paid", "refunded"].includes(order.payment_status)) continue;
    const candidates =
      customerEmails.get(
        String(order.email || "")
          .trim()
          .toLowerCase(),
      ) || [];
    if (candidates.length !== 1) {
      if (candidates.some(linked))
        issues.push({
          key: order.id,
          reason: "顧客のメールが複数件に一致するため要確認",
        });
      continue;
    }
    const customer = candidates[0];
    if (!linked(customer)) continue;
    const fail = (reason: string) => issues.push({ key: order.id, reason });
    if (
      order.payment_intent_id &&
      paymentCounts.get(order.payment_intent_id)! > 1
    ) {
      fail("同じ決済に複数注文があります");
      continue;
    }
    const date = referralJstDay(order.created_at),
      subtotal = yen(order.subtotal),
      shipping = yen(order.shipping_cost),
      total = yen(order.total);
    const discount =
      order.discount_amount == null ? 0 : yen(order.discount_amount);
    const items = order.order_items || [];
    if (
      order.stripe_subscription_id &&
      items.some((i: any) => typeof i.is_subscription !== "boolean")
    ) {
      fail("定期便と単品の明細区分が未確認です");
      continue;
    }
    if (
      !date ||
      subtotal == null ||
      shipping == null ||
      total == null ||
      discount == null ||
      discount > subtotal ||
      subtotal + shipping - discount !== total ||
      !items.length ||
      items.some((i: any) => yen(i.line_total) == null) ||
      items.reduce((n: number, i: any) => n + Number(i.line_total), 0) !==
        subtotal
    ) {
      fail("商品代金・送料・値引き・合計または明細が一致しません");
      continue;
    }
    const groups: Record<string, number> = {};
    for (const item of items) {
      const category =
        item.is_subscription === true ? "web_subscription" : "web_single";
      groups[category] = (groups[category] || 0) + Number(item.line_total);
    }
    // Largest-remainder allocation of merchandise-only discounts; sum is exactly the order discount.
    const portions = Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([category, gross]) => ({
        category,
        gross,
        discount: subtotal ? Math.floor((discount * gross) / subtotal) : 0,
        remainder: subtotal ? (discount * gross) % subtotal : 0,
      }));
    let left = discount - portions.reduce((n, p) => n + p.discount, 0);
    for (const p of portions
      .slice()
      .sort(
        (a, b) =>
          b.remainder - a.remainder || a.category.localeCompare(b.category),
      )) {
      if (left <= 0) break;
      p.discount++;
      left--;
    }
    for (const p of portions)
      sales.push({
        key: `ec:${order.id}:${p.category}`,
        date,
        customerId: customer.id,
        referrerId: customer.referred_by_customer_id,
        category: p.category as ReferralCategory,
        amount: p.gross - p.discount,
        label: order.order_number || order.id,
      });
    if (order.payment_status === "refunded")
      issues.push({
        key: `refund:${order.id}`,
        reason: "返金済み注文です。返金日・商品返金額の記録を照合してください",
      });
  }
  for (const r of external) {
    const category =
      r.source === "rice_satofuru"
        ? "satofuru"
        : r.source === "rice_furusatodo"
          ? "furusatodo"
          : null;
    if (!category) continue; // 食べチョク・直売所売上メール are never referral-eligible portal sales.
    const customer = customersById.get(r.customer_id || "");
    if (!linked(customer)) continue;
    if (
      r.payload.status === "cancelled" &&
      r.finance_payload?.status === "active" &&
      yen(r.merchandise_yen) != null &&
      r.finance_payload.date
    ) {
      sales.push({
        key: `external:${r.source_key}`,
        date: r.finance_payload.date,
        customerId: customer.id,
        referrerId: customer.referred_by_customer_id,
        category,
        amount: Number(r.merchandise_yen),
        label: r.finance_payload.externalOrderId || r.finance_payload.product,
      });
      issues.push({
        key: r.source_key,
        reason:
          "取消外部注文：返金済みなら商品返金を記録、未入金取消なら商品代金の承認を解除してください",
      });
      continue;
    }
    if (
      !externalFinanceUnchanged(r) ||
      yen(r.merchandise_yen) == null ||
      !r.payload.date
    ) {
      issues.push({
        key: r.source_key,
        reason: "外部注文の商品代金・顧客紐付けを再確認してください",
      });
      continue;
    }
    sales.push({
      key: `external:${r.source_key}`,
      date: r.payload.date,
      customerId: customer.id,
      referrerId: customer.referred_by_customer_id,
      category,
      amount: Number(r.merchandise_yen),
      label: r.payload.externalOrderId || r.payload.product,
    });
  }
  for (const d of direct) {
    const customer = customersById.get(d.customer_id);
    if (!linked(customer)) continue;
    if (yen(d.merchandise_yen) == null || !d.sold_on) {
      issues.push({
        key: d.id,
        reason: "直接注文の商品代金または日付が不正です",
      });
      continue;
    }
    sales.push({
      key: `direct:${d.id}`,
      date: d.sold_on,
      customerId: customer.id,
      referrerId: customer.referred_by_customer_id,
      category: "direct",
      amount: Number(d.merchandise_yen),
      label: d.reference,
    });
  }
  return { sales, issues };
}
export function referralMonthly(
  month: string,
  sales: ReferralSale[],
  refunds: ReferralRefund[],
  referrerId = "",
) {
  if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month))
    throw new Error("対象年月を確認してください");
  const rows = Object.entries(referralCategories).map(([category, c]) => ({
    category: category as ReferralCategory,
    ...c,
    sales: 0,
    refunds: 0,
    net: 0,
    commission: 0,
    refundCommission: 0,
    netCommission: 0,
  }));
  const byKey = new Map(sales.map((s) => [s.key, s]));
  const totals = new Map<string, number>();
  const issues: ReferralIssue[] = [];
  const seen = new Set<string>();
  const unique = refunds.filter((r) => {
    if (seen.has(r.external_reference)) return false;
    seen.add(r.external_reference);
    return true;
  });
  for (const r of unique)
    totals.set(
      r.sale_key,
      (totals.get(r.sale_key) || 0) + Number(r.merchandise_yen),
    );
  const included = sales.filter(
    (s) => !referrerId || s.referrerId === referrerId,
  );
  for (const sale of included)
    if (sale.date.startsWith(month))
      rows.find((r) => r.category === sale.category)!.sales += sale.amount;
  const refundDetails: { refund: ReferralRefund; sale: ReferralSale }[] = [];
  for (const refund of unique) {
    const sale = byKey.get(refund.sale_key);
    if (!sale) {
      if (refund.refunded_on.startsWith(month))
        issues.push({ key: refund.id, reason: "返金元の売上を確認できません" });
      continue;
    }
    if (referrerId && sale.referrerId !== referrerId) continue;
    if (
      yen(refund.merchandise_yen) == null ||
      totals.get(sale.key)! > sale.amount
    ) {
      issues.push({
        key: refund.id,
        reason: "商品返金累計が元の商品売上を超えています",
      });
      continue;
    }
    if (refund.refunded_on.startsWith(month)) {
      rows.find((r) => r.category === sale.category)!.refunds += Number(
        refund.merchandise_yen,
      );
      refundDetails.push({ refund, sale });
    }
  }
  const round = (n: number, rate: number) =>
    Math.sign(n) * Math.floor((Math.abs(n) * rate + 50) / 100);
  const referrers = [...new Set(included.map((s) => s.referrerId))];
  for (const r of rows) {
    r.net = r.sales - r.refunds;
    // All-referrer totals sum each person's rounded monthly category amount, never round across people.
    for (const id of referrers) {
      const gross = included
        .filter(
          (s) =>
            s.referrerId === id &&
            s.category === r.category &&
            s.date.startsWith(month),
        )
        .reduce((n, s) => n + s.amount, 0);
      const refunded = refundDetails
        .filter(
          (d) => d.sale.referrerId === id && d.sale.category === r.category,
        )
        .reduce((n, d) => n + Number(d.refund.merchandise_yen), 0);
      r.commission += round(gross, r.rate);
      r.netCommission += round(gross - refunded, r.rate);
    }
    r.refundCommission = r.netCommission - r.commission;
  }
  return {
    rows,
    details: included.filter((s) => s.date.startsWith(month)),
    refundDetails,
    issues,
    totalSales: rows.reduce((n, r) => n + r.sales, 0),
    totalRefunds: rows.reduce((n, r) => n + r.refunds, 0),
    netSales: rows.reduce((n, r) => n + r.net, 0),
    totalCommission: rows.reduce((n, r) => n + r.netCommission, 0),
  };
}
