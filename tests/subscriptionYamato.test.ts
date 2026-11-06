// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
import { subscriptionYamatoOrders } from '../lib/subscriptionYamato';

afterEach(() => vi.useRealTimers());
const contract = {
  stripe_subscription_id: 'sub_fixture', status: 'active', interval: 'monthly',
  created_at: '2026-01-01', next_billing_at: '2026-11-10', metadata: {},
};
const history = [
  { id: 'past', stripe_subscription_id: 'sub_fixture', created_at: '2026-01-01', order_status: 'shipped' },
  { id: 'nov', stripe_subscription_id: 'sub_fixture', created_at: '2026-11-01', subscription_shipping_date: '2026-11-15', order_status: 'processing' },
  { id: 'oct', stripe_subscription_id: 'sub_fixture', created_at: '2026-10-01', subscription_shipping_date: '2026-10-15', order_status: 'processing' },
  { id: 'other', stripe_subscription_id: 'sub_other', created_at: '2026-11-01', order_status: 'processing' },
];
it('exports only actual orders for selected contracts and the selected shipment month', () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-06'));
  expect(subscriptionYamatoOrders([contract], history, '2026-11').map(o => o.id)).toEqual(['nov']);
  expect(subscriptionYamatoOrders([contract], history, '2026-10').map(o => o.id)).toEqual(['oct']);
});
it('does not substitute an old order for an uncreated or ambiguous shipment', () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-06'));
  expect(() => subscriptionYamatoOrders([contract], [history[0]], '2026-11')).toThrow('注文未作成');
  expect(() => subscriptionYamatoOrders([contract], [...history, { ...history[1], id: 'duplicate-cycle' }], '2026-11')).toThrow('特定できません');
  expect(() => subscriptionYamatoOrders([{ ...contract, status: 'canceled' }], history, '2026-11')).toThrow('対象がありません');
});
