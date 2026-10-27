// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
import { enrichCustomers, customerFullName, purchaseCategories, registeredAddress } from '../lib/adminCustomerData';
import { bankTransferAllowed } from '../lib/bankTransferAvailability';
import { couponUsageAudit } from '../lib/couponUsageAudit';
import { recordCouponUsage } from '../lib/recordCouponUsage';
import { shipmentDay, shipmentOrders, shipmentHasShipped, csvText } from '../lib/adminShipmentData';
import { annualShipmentSummary } from '../lib/subscriptionAnnualSummary';
afterEach(() => vi.useRealTimers());
const customer = { id: 'c', last_name: '山田', first_name: null, email: 'A@example.invalid', referred_by_customer_id: 'r', latest_purchase_rice_date: '2026-09-01' };
it('uses controlled categories, not misleading product titles', () => {
  expect(purchaseCategories({ title: 'お米', category: '雑貨' })).toEqual([]);
  expect(purchaseCategories({ category: '原木しいたけ' })).toEqual(['shiitake']);
  expect(purchaseCategories({ category: 'お米', categories: ['椎茸'] })).toEqual(['rice', 'shiitake']);
});
it('fills an available given name, resolves referrer ID and only recognizes current active contracts', () => {
  const [row] = enrichCustomers([customer, { id: 'r', last_name: '佐藤', first_name: '花子' }], [{ id: 'u', email: 'a@example.invalid', first_name: '太郎' }], [{ auth_user_id: 'u', status: 'active' }], [], []);
  expect(customerFullName(row)).toBe('山田 太郎'); expect(row.referrer_name).toBe('佐藤 花子'); expect(row.activeSubscription).toBe(true);
  expect(enrichCustomers([customer], [], [{ email: 'a@example.invalid', status: 'trialing' }], [], [])[0].activeSubscription).toBe(false);
  expect(customerFullName({})).toBe('（氏名未登録）');
});
it('updates independent latest dates with JST order day and never moves a legacy date backwards', () => {
  const orders = [
    { email: 'a@example.invalid', created_at: '2026-10-01T16:00:00Z', payment_status: 'paid', order_items: [{ product_id: 'rice' }, { product_id: 'shiitake' }] },
    { email: 'a@example.invalid', created_at: '2026-11-01', payment_status: 'paid', order_status: 'cancelled', order_items: [{ product_id: 'rice' }] },
    { email: 'a@example.invalid', created_at: '2026-08-01', payment_status: 'paid', order_items: [{ product_id: 'rice' }] },
  ];
  const [row] = enrichCustomers([customer], [], [], orders, [{ id: 'rice', category: 'お米' }, { id: 'shiitake', category: '原木しいたけ' }]);
  expect(row.latest_purchase_rice_date).toBe('2026-10-02'); expect(row.latest_purchase_shiitake_date).toBe('2026-10-02');
});
it('does not substitute a delivery address for the registered address', () => {
  expect(registeredAddress(null)).toBeNull();
  expect(registeredAddress({ shipping_address: '贈答先' })).toBeNull();
  expect(registeredAddress({ postal_code: '1234567', address: '登録住所' })).toBe('〒1234567 登録住所');
});
const bankDb = (data: any[], error: any = null) => ({ from: () => ({ select: () => ({ in: async () => ({ data, error }) }) }) });
it('restricts a mixed cart based on fresh server-side product data', async () => {
  const items = [{ product_id: 'a' }, { product_id: 'b' }];
  expect(await bankTransferAllowed(bankDb([{ id: 'a', bank_transfer_disabled: false }, { id: 'b', bank_transfer_disabled: true }]), items, {})).toBe(false);
  expect(await bankTransferAllowed(bankDb([{ id: 'a', bank_transfer_disabled: false }, { id: 'b', bank_transfer_disabled: false }]), items, {})).toBe(true);
});
it('fails closed for missing migration, unknown products, empty carts, subscriptions and missing IDs', async () => {
  const db = bankDb([{ id: 'a', bank_transfer_disabled: false }]);
  expect(await bankTransferAllowed(db, [], {})).toBe(false);
  expect(await bankTransferAllowed(db, [{ handle: 'fake' }], {})).toBe(false);
  expect(await bankTransferAllowed(db, [{ product_id: 'a' }], { type: 'subscription_init' })).toBe(false);
  expect(await bankTransferAllowed(db, [{ product_id: 'a', is_subscription: true }], {})).toBe(false);
  expect(await bankTransferAllowed(bankDb([], { code: '42703' }), [{ product_id: 'a' }], {})).toBe(false);
  expect(await bankTransferAllowed(bankDb([{ id: 'a' }]), [{ product_id: 'a' }], {})).toBe(false);
});
it('coupon audit counts each paid order once and retains cancelled/refunded past uses', () => {
  expect(couponUsageAudit([
    { id: 'a', coupon_id: 'c', payment_status: 'paid' }, { id: 'a', coupon_id: 'c', payment_status: 'paid' },
    { id: 'b', coupon_id: 'c', payment_status: 'refunded' },
    { id: 'd', coupon_id: 'c', payment_status: 'failed', order_status: 'cancelled', paid_at: '2026-10-01' },
    { id: 'e', coupon_id: 'c', payment_status: 'pending' },
  ])).toEqual({ c: 3 });
});
it('uses the order-aware coupon guard and only falls back when the function is absent', async () => {
  const db = { rpc: vi.fn().mockResolvedValueOnce({ error: { code: 'PGRST202' } }).mockResolvedValue({ error: null }) };
  await recordCouponUsage(db, { id: 'o', coupon_id: 'c' });
  expect(db.rpc.mock.calls).toEqual([['record_order_coupon_usage', { p_order_id: 'o' }], ['increment_coupon_usage', { p_coupon_id: 'c' }]]);
  db.rpc.mockClear().mockResolvedValue({ error: { code: '42501' } });
  await recordCouponUsage(db, { id: 'o', coupon_id: 'c' }); expect(db.rpc).toHaveBeenCalledTimes(1);
});
const sub = { stripe_subscription_id: 's', status: 'trialing', interval: 'bimonthly', created_at: '2026-07-26', next_billing_at: '2027-01-09T20:00:00Z', metadata: { first_shipping_override: '2026-11-15' } };
it('matches the prepaid first shipment, not a different recurring order', () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-27'));
  const orders = [{ id: 'a', stripe_subscription_id: 's', created_at: '2026-07-26', order_status: 'processing' }, { id: 'b', stripe_subscription_id: 's', created_at: '2026-10-23', order_status: 'processing' }];
  expect(shipmentDay(sub)).toBe('2026-11-15'); expect(shipmentOrders(sub, orders).map(o => o.id)).toEqual(['a']);
  orders[0].order_status = 'shipped'; expect(shipmentHasShipped(sub, orders)).toBe(true);
  expect(shipmentOrders(sub, orders)).toEqual([]);
  expect(shipmentDay({ ...sub, status: 'canceled' })).toBeNull();
});
it('does not substitute a past order when an upcoming cycle has no order', () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-12-27'));
  expect(shipmentOrders(sub, [{ id: 'a', stripe_subscription_id: 's', created_at: '2026-07-26', order_status: 'shipped' }])).toEqual([]);
});
it('CSV escapes quotes, line breaks and spreadsheet formulas', () => {
  expect(csvText([{ 氏名: '=HYPERLINK(1)', 商品: 'a"b\nc' }])).toContain("'=HYPERLINK");
  expect(csvText([{ 商品: 'a"b\nc' }])).toContain('a""b\nc');
});
it('annual summary keeps shipment history, removes canceled future slots and avoids double counting', () => {
  const c = { season_id: 'season', variety_key: 'koshihikari', unit_kg: 5 };
  const report = { snapshots: [{ item_id: 'i', accounting_version: 2, components: [c], quantity: 1 }],
    plans: [{ id: 'p', subscription_id: 's', issue: null }], subscriptions: [{ id: 's', status: 'active' }],
    harvest_rules: [{ season_id: 'season', variety_key: 'koshihikari', end_month: '2027-09-01' }],
    slots: [{ plan_id: 'p', item_id: 'i', components: [c], quantity: 1, shipping_date: '2026-11-15' },
      { plan_id: 'p', components: [c], quantity: 2, shipping_date: '2027-01-15' },
      { plan_id: 'p', components: [c], quantity: 3, shipping_date: '2027-03-15', canceled: true }] };
  const orders = [{ order_status: 'shipped', order_items: [{ id: 'i', is_subscription: true }] }];
  const result = annualShipmentSummary(report, 'season', orders).rows[0];
  expect(result.shipped).toBe(5); expect(result.planned).toBe(10);
  report.subscriptions[0].status = 'canceled';
  expect(annualShipmentSummary(report, 'season', orders).rows[0]).toMatchObject({ shipped: 5, planned: 0 });
});
