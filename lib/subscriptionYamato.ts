import { shipmentTargets } from './shipmentHandoff';
import type { YamatoOrder } from './yamatoExport';

/** Export only orders matched to the selected shipment cycles, not old addresses/items. */
export function subscriptionYamatoOrders(subscriptions: any[], orders: any[], month = ''): YamatoOrder[] {
  const result = new Map<string, YamatoOrder>();
  let unresolved = 0;
  for (const sub of subscriptions) {
    for (const target of shipmentTargets(sub, orders, month)) {
      const order = target.orderId && orders.find(order => order.id === target.orderId);
      if (!order) unresolved++;
      else result.set(order.id, order);
    }
  }
  if (unresolved) throw new Error(`${unresolved}発送回は注文未作成または対象注文を特定できません。「選択した定期便の注文を確認」で確認してください。`);
  if (!result.size) throw new Error('出力する発送対象がありません。');
  return [...result.values()];
}
