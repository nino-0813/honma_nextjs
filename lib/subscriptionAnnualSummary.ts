import { varieties } from './kgInventory';
export function annualShipmentSummary(report: any, seasonId: string, orders: any[]) {
  const values = Object.entries(varieties).map(([key, label]) => ({ key, label, shipped: 0, planned: 0 }));
  const items = new Map(orders.flatMap(o => (o.order_items || []).map((i: any) => [i.id, { ...i, order: o }])) as [string, any][]);
  const shipped = new Set<string>();
  let unclassified = 0;
  const add = (components: any[], quantity: number, kind: 'shipped' | 'planned') => {
    for (const c of components) {
      const row = values.find(r => r.key === c.variety_key);
      if (c.season_id !== seasonId) continue;
      if (!row || !Number.isFinite(Number(c.unit_kg)) || !Number.isFinite(quantity) || quantity <= 0) { unclassified++; continue; }
      row[kind] += Number(c.unit_kg) * quantity;
    }
  };
  for (const snapshot of report.snapshots || []) {
    const item = items.get(snapshot.item_id);
    if (!item?.is_subscription || snapshot.excluded || snapshot.accounting_version !== 2) continue;
    if (item.shipping_status !== 'shipped' && item.order.order_status !== 'shipped') continue;
    if (!Array.isArray(snapshot.components)) { unclassified++; continue; }
    shipped.add(snapshot.item_id);
    add(snapshot.components, Number(snapshot.quantity), 'shipped');
  }
  for (const slot of report.slots || []) {
    if (slot.canceled || shipped.has(slot.item_id)) continue;
    const plan = (report.plans || []).find((p: any) => p.id === slot.plan_id);
    if (!plan || plan.issue) { unclassified++; continue; }
    const sub = (report.subscriptions || []).find((s: any) => s.id === plan.subscription_id);
    if (!sub || !['active', 'trialing', 'past_due', 'unpaid'].includes(sub.status)) continue;
    const item = items.get(slot.item_id);
    if (item?.order.order_status === 'cancelled') continue;
    if (!Array.isArray(slot.components)) { unclassified++; continue; }
    const components = slot.components.filter((c: any) => {
      const rule = (report.harvest_rules || []).find((r: any) => r.season_id === c.season_id && r.variety_key === c.variety_key);
      if (!rule) { if (c.season_id === seasonId) unclassified++; return false; }
      return slot.shipping_date.slice(0, 7) <= rule.end_month.slice(0, 7);
    });
    add(components, Number(slot.quantity), 'planned');
  }
  for (const order of orders) for (const item of order.order_items || []) {
    if (item.is_subscription && (item.shipping_status === 'shipped' || order.order_status === 'shipped') && !shipped.has(item.id)) unclassified++;
  }
  return { rows: values.map(r => ({ ...r, shipped: Math.round(r.shipped * 1000) / 1000, planned: Math.round(r.planned * 1000) / 1000 })), unclassified };
}
