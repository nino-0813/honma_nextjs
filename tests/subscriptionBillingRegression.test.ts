// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({
  from: vi.fn(), rpc: vi.fn(), user: vi.fn(), retrieve: vi.fn(), update: vi.fn(),
  price: vi.fn(), invoice: vi.fn(), mail: vi.fn(), event: {} as any,
}));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({ from: mock.from, rpc: mock.rpc, auth: { getUser: mock.user } }) }));
vi.mock('@/lib/brevo', () => ({ sendBrevoEmail: mock.mail }));
vi.mock('stripe', () => ({ default: class {
  webhooks = { constructEvent: () => mock.event };
  subscriptions = { retrieve: mock.retrieve, update: mock.update };
  prices = { create: mock.price };
  invoices = { retrieve: mock.invoice };
} }));
import { POST as webhook } from '../app/api/stripe-webhook/route';
import { POST as changeInterval } from '../app/api/update-subscription-interval/route';

let subscription: any;
let stripeSubscription: any;
let writes: { table: string; value: any }[];
const original = { id: 'original', total: 8085, subtotal: 7425, shipping_cost: 660,
  order_number: 'ORD-original', email: 'fixture@example.invalid', auth_user_id: null,
  subscription_interval: 'monthly', stripe_subscription_id: 'sub_fixture' };
beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-23T05:50:00Z'));
  for (const [name, value] of Object.entries({ STRIPE_SECRET_KEY: 'fixture', STRIPE_WEBHOOK_SECRET: 'fixture', SUPABASE_URL: 'http://127.0.0.1:1', SUPABASE_SERVICE_ROLE_KEY: 'fixture', GAS_URL: '' })) vi.stubEnv(name, value);
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('External requests forbidden'); }));
  writes = [];
  subscription = { id: 'subrow', auth_user_id: 'user', status: 'trialing', interval: 'monthly',
    created_at: '2026-07-26T09:08:00Z', next_billing_at: '2026-12-09T20:00:00Z',
    metadata: { first_shipping_override: '2026-11-15', shipping: { city: 'keep' } } };
  stripeSubscription = { id: 'sub_fixture', status: 'trialing', created: 1785056880,
    trial_end: 1796846400, current_period_end: 1796846400,
    metadata: { first_shipping_override: '2026-11-15', interval: 'monthly' },
    items: { data: [
      { id: 'si_rice', quantity: 2, price: { product: { id: 'prod_rice' }, unit_amount: 7425, currency: 'jpy' } },
      { id: 'si_shipping', quantity: 1, price: { product: 'prod_shipping', unit_amount: 660, currency: 'jpy' } },
    ] } };
  mock.retrieve.mockImplementation(async () => stripeSubscription);
  mock.update.mockImplementation(async (_id, params) => ({ ...stripeSubscription, ...params }));
  mock.price.mockResolvedValue({ id: 'price_new' });
  mock.rpc.mockResolvedValue({ error: null });
  mock.mail.mockResolvedValue({ messageId: 'fixture' });
  mock.user.mockResolvedValue({ data: { user: { id: 'user' } }, error: null });
  mock.event = { id: 'evt_fixture', type: 'invoice.paid', data: { object: {
    id: 'in_fixture', subscription: 'sub_fixture', billing_reason: 'subscription_update',
    total: 0, amount_paid: 0, payment_intent: null,
  } } };
  mock.from.mockImplementation((table: string) => {
    const filters: Record<string, any> = {};
    let inserted: any = null;
    const q: any = {
      select: () => q, order: () => q, limit: () => q,
      eq: (key: string, value: any) => { filters[key] = value; return q; },
      insert: (value: any) => { inserted = value; writes.push({ table, value }); return q; },
      update: (value: any) => { writes.push({ table, value }); return q; },
      maybeSingle: async () => ({ data: table === 'subscriptions' ? subscription
        : table === 'orders' ? (filters.payment_intent_id ? null : original) : null, error: null }),
      single: async () => ({ data: table === 'orders' ? (inserted ? { id: 'renewal' } : original) : null, error: null }),
      then: (resolve: any) => Promise.resolve({ data: table === 'order_items' ? [{ id: 'item', product_id: 'rice', product_title: 'Rice', product_price: 7425, quantity: 1, line_total: 7425, is_subscription: true }] : null, error: null }).then(resolve),
    };
    return q;
  });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetAllMocks(); });
const deliver = () => webhook(new Request('http://localhost/api/stripe-webhook', { method: 'POST', headers: { 'stripe-signature': 'fixture' }, body: '{}' }));
const change = (interval = 'bimonthly') => changeInterval(new Request('http://localhost/api/update-subscription-interval', { method: 'POST', headers: { authorization: 'Bearer fixture', 'content-type': 'application/json' }, body: JSON.stringify({ subscription_id: 'sub_fixture', new_interval: interval }) }));

it.each([0, 8085])('does not turn an administrative subscription_update invoice (%i yen) into a shipment', async amount => {
  Object.assign(mock.event.data.object, { total: amount, amount_paid: amount });
  expect((await deliver()).status).toBe(200);
  expect(writes.filter(w => ['orders', 'order_items'].includes(w.table))).toHaveLength(0);
  expect(mock.rpc).not.toHaveBeenCalled(); expect(mock.mail).not.toHaveBeenCalled();
});
it('skips the initial trial invoice', async () => {
  mock.event.data.object.billing_reason = 'subscription_create';
  expect((await deliver()).status).toBe(200);
  expect(writes.filter(w => w.table === 'orders')).toHaveLength(0);
});
it.each([8085, 0])('uses the actual renewal invoice total (%i), never the original price', async total => {
  Object.assign(mock.event.data.object, { billing_reason: 'subscription_cycle', total, amount_paid: 0 });
  expect((await deliver()).status).toBe(200);
  const order = writes.find(w => w.table === 'orders')!.value[0];
  expect(order.total).toBe(total); expect(order.payment_intent_id).toBe('invoice:in_fixture');
  expect(mock.rpc).toHaveBeenCalled();
});
it('rejects an unknown invoice reason without creating an order', async () => {
  delete mock.event.data.object.billing_reason;
  expect((await deliver()).status).toBe(503);
  expect(writes.filter(w => w.table === 'orders')).toHaveLength(0);
});
it('rejects a renewal with no amount instead of copying the original amount', async () => {
  mock.event.data.object.billing_reason = 'subscription_cycle';
  delete mock.event.data.object.total;
  expect((await deliver()).status).toBe(503);
  expect(writes.filter(w => w.table === 'orders')).toHaveLength(0);
});
it('also ignores the new invoice_payment.paid API administrative invoice', async () => {
  const invoice = mock.event.data.object;
  mock.event.type = 'invoice_payment.paid'; mock.event.data.object = { invoice: 'in_fixture', payment: {} };
  mock.invoice.mockResolvedValue({ ...invoice, subscription: null, parent: { subscription_details: { subscription: 'sub_fixture' } } });
  expect((await deliver()).status).toBe(200);
  expect(mock.invoice).toHaveBeenCalled();
  expect(writes.filter(w => w.table === 'orders')).toHaveLength(0);
});
it('anchors a pre-first-shipment 1→2 month change to Jan 10, not the October change date', async () => {
  const response = await change(); expect(response.status).toBe(200);
  const params = mock.update.mock.calls[0][1];
  expect(new Date(params.trial_end * 1000).toISOString()).toBe('2027-01-09T20:00:00.000Z');
  expect(params.proration_behavior).toBe('none');
  expect(params.items.map((item: any) => item.quantity)).toEqual([2, 1]);
  expect(mock.price.mock.calls[0][0].recurring).toEqual({ interval: 'month', interval_count: 2 });
  expect((await response.json()).next_billing_at).toBe('2027-01-09T20:00:00.000Z');
  const db = writes.find(w => w.table === 'subscriptions')!.value;
  expect(db.next_billing_at).toBe('2027-01-09T20:00:00.000Z');
  expect(db.metadata.shipping.city).toBe('keep');
});
it('falls back to Stripe first-shipment metadata when local metadata is missing', async () => {
  subscription.metadata = {};
  expect((await change()).status).toBe(200);
  expect(new Date(mock.update.mock.calls[0][1].trial_end * 1000).toISOString()).toBe('2027-01-09T20:00:00.000Z');
});
it('recalculates shortening before the first shipment from that shipment too', async () => {
  subscription.interval = 'bimonthly';
  expect((await change('monthly')).status).toBe(200);
  expect(new Date(mock.update.mock.calls[0][1].trial_end * 1000).toISOString()).toBe('2026-12-09T20:00:00.000Z');
});
it('enforces the November 9 deadline without mutating Stripe', async () => {
  vi.setSystemTime(new Date('2026-11-10T00:00:00+09:00'));
  expect((await change()).status).toBe(400);
  expect(mock.price).not.toHaveBeenCalled(); expect(mock.update).not.toHaveBeenCalled();
});
it('rejects missing ownership instead of allowing another user to edit a legacy subscription', async () => {
  subscription.auth_user_id = null;
  expect((await change()).status).toBe(403);
  expect(mock.update).not.toHaveBeenCalled();
});
