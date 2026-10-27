// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn(), charge: vi.fn(), method: vi.fn(), mail: vi.fn(), retrieve: vi.fn(), event: {} as any }));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({ from: mock.from, rpc: mock.rpc }) }));
vi.mock('@/lib/brevo', () => ({ sendBrevoEmail: mock.mail }));
vi.mock('stripe', () => ({ default: class {
  webhooks = { constructEvent: () => mock.event };
  charges = { retrieve: mock.charge };
  paymentMethods = { retrieve: mock.method };
  paymentIntents = { retrieve: mock.retrieve };
} }));
import { POST } from '../app/api/stripe-webhook/route';

let order: Record<string, any>;
let updates: Record<string, any>[];
let eventIds: Set<string>;
beforeEach(() => {
  vi.stubEnv('STRIPE_SECRET_KEY', 'fixture');
  vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'fixture');
  vi.stubEnv('SUPABASE_URL', 'http://127.0.0.1:1');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'fixture');
  vi.stubEnv('GAS_URL', '');
  vi.stubEnv('BREVO_ORDER_TEMPLATE_ID', '1');
  vi.stubEnv('BREVO_BANK_TRANSFER_PAID_TEMPLATE_ID', '9');
  vi.stubEnv('BREVO_FROM_EMAIL', 'sender@example.invalid');
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('External requests forbidden'); }));
  order = { id: 'order', order_number: 'ORD-fixture', total: 2340, subtotal: 2340, shipping_cost: 0, payment_status: 'pending', payment_method: 'card', auth_user_id: null, email: 'customer@example.invalid', created_at: '2026-10-22T00:00:00Z' };
  updates = []; eventIds = new Set();
  mock.mail.mockResolvedValue({ messageId: 'fixture' });
  mock.rpc.mockResolvedValue({ error: null });
  mock.charge.mockResolvedValue({ payment_method_details: { type: 'card' } });
  mock.event = { id: 'evt_payment', type: 'payment_intent.succeeded', data: { object: { id: 'pi_fixture', latest_charge: 'ch_fixture', payment_method: 'pm_fixture', payment_method_types: ['card', 'customer_balance'], amount_received: 2340 } } };
  mock.from.mockImplementation((table: string) => {
    let deleting = false;
    const q: any = {
      select: () => q, eq: (_: string, value: string) => { if (deleting && table === 'stripe_webhook_events') eventIds.delete(value); return q; }, in: () => q,
      delete: () => { deleting = true; return q; },
      maybeSingle: async () => ({ data: table === 'orders' ? { ...order } : null, error: null }),
      single: async () => ({ data: table === 'orders' ? { ...order } : null, error: null }),
      insert: async (rows: any[]) => {
        const id = rows[0].event_id;
        const exists = eventIds.has(id); eventIds.add(id);
        return { error: exists ? { code: '23505' } : null };
      },
      update: (row: any) => { if (table === 'orders') { updates.push(row); order = { ...order, ...row }; } return q; },
      then: (resolve: (v: unknown) => unknown) => Promise.resolve({ data: table === 'order_items' ? [] : null, error: null }).then(resolve),
    };
    return q;
  });
});

const bankInstructions = () => ({
  type: 'jp_bank_transfer', currency: 'jpy', reference: null,
  hosted_instructions_url: 'https://payments.stripe.com/instructions/fixture',
  financial_addresses: [{ type: 'zengin', zengin: {
    account_holder_name: 'テスト名義', account_number: '0012345', bank_name: 'テスト銀行',
    branch_name: 'テスト支店', account_type: 'futsu',
  } }],
});
function pendingBank() {
  mock.event = { id: 'evt_bank', type: 'payment_intent.requires_action', data: { object: {
    id: 'pi_fixture', next_action: { type: 'display_bank_transfer_instructions', display_bank_transfer_instructions: bankInstructions() },
  } } };
}
it('sends actual bank details and Stripe link in the generated email, without relying on template variables', async () => {
  pendingBank();
  expect((await deliver()).status).toBe(200);
  expect(mock.mail).toHaveBeenCalledWith(expect.objectContaining({
    htmlContent: expect.stringContaining('0012345'), textContent: expect.stringContaining('テスト銀行'),
  }));
  const message = mock.mail.mock.calls[0][0];
  expect(message.templateId).toBeUndefined();
  expect(message.htmlContent).toContain('振込先を確認する');
  expect(message.textContent).toContain('普通');
  expect(mock.retrieve).not.toHaveBeenCalled();
  expect((await deliver()).status).toBe(200);
  expect(mock.mail).toHaveBeenCalledTimes(1);
});
it('retrieves missing bank data from Stripe before sending', async () => {
  pendingBank();
  mock.event.data.object.next_action.display_bank_transfer_instructions.financial_addresses = [];
  mock.retrieve.mockResolvedValue({ status: 'requires_action', next_action: { type: 'display_bank_transfer_instructions', display_bank_transfer_instructions: bankInstructions() } });
  expect((await deliver()).status).toBe(200);
  expect(mock.retrieve).toHaveBeenCalledWith('pi_fixture');
  expect(mock.mail.mock.calls[0][0].textContent).toContain('テスト支店');
});
it('does not send an empty bank email and retries after instructions become available', async () => {
  pendingBank();
  mock.event.data.object.next_action.display_bank_transfer_instructions = {};
  mock.retrieve.mockRejectedValueOnce(new Error('temporary Stripe failure'));
  expect((await deliver()).status).toBe(503);
  expect(mock.mail).not.toHaveBeenCalled();
  expect(eventIds.has('evt_bank')).toBe(false);
  order.inventory_reserved_at = '2026-10-27T00:00:00Z';
  mock.retrieve.mockResolvedValue({ status: 'requires_action', next_action: { type: 'display_bank_transfer_instructions', display_bank_transfer_instructions: bankInstructions() } });
  expect((await deliver()).status).toBe(200);
  expect(mock.mail).toHaveBeenCalledTimes(1);
  expect(mock.rpc).toHaveBeenCalledTimes(1);
});
it('allows retry on mail delivery failure rather than acknowledging success', async () => {
  pendingBank();
  mock.mail.mockRejectedValueOnce(new Error('Brevo temporary failure'));
  expect((await deliver()).status).toBe(503);
  expect(eventIds.has('evt_bank')).toBe(false);
  expect((await deliver()).status).toBe(200);
  expect(mock.mail).toHaveBeenCalledTimes(2);
});
it('never falls back to the old empty template if refreshed instructions are missing', async () => {
  pendingBank();
  mock.event.data.object.next_action.display_bank_transfer_instructions = undefined;
  mock.retrieve.mockResolvedValue({ status: 'requires_action', next_action: { type: 'display_bank_transfer_instructions' } });
  expect((await deliver()).status).toBe(503);
  expect(mock.mail).not.toHaveBeenCalled();
  expect(eventIds.has('evt_bank')).toBe(false);
});
it('does not reopen a paid order on a delayed bank instructions event', async () => {
  pendingBank(); order.payment_status = 'paid';
  expect((await deliver()).status).toBe(200);
  expect(updates).toHaveLength(0);
  expect(mock.rpc).not.toHaveBeenCalled();
  expect(mock.mail).not.toHaveBeenCalled();
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetAllMocks(); });
const deliver = () => POST(new Request('http://localhost/api/stripe-webhook', { method: 'POST', headers: { 'stripe-signature': 'fixture' }, body: '{}' }));

it('saves card and sends the card email when both card and bank transfer were offered', async () => {
  expect((await deliver()).status).toBe(200);
  expect(updates[0]).toMatchObject({ payment_method: 'card', payment_status: 'paid' });
  expect(mock.mail).toHaveBeenCalledWith(expect.objectContaining({ to: [expect.objectContaining({ email: 'customer@example.invalid' })], templateId: 1 }));
  expect(mock.mail).not.toHaveBeenCalledWith(expect.objectContaining({ templateId: 9 }));
  expect(fetch).not.toHaveBeenCalled();
});
it('saves bank transfer and sends the bank paid email only for actual customer_balance payment', async () => {
  mock.charge.mockResolvedValue({ payment_method_details: { type: 'customer_balance' } });
  expect((await deliver()).status).toBe(200);
  expect(updates[0]).toMatchObject({ payment_method: 'bank_transfer', payment_status: 'paid' });
  expect(mock.mail).toHaveBeenCalledWith(expect.objectContaining({ templateId: 9 }));
  expect(mock.mail).not.toHaveBeenCalledWith(expect.objectContaining({ templateId: 1 }));
});
it('uses actual card evidence even if the order previously said bank transfer', async () => {
  order.payment_method = 'bank_transfer';
  expect((await deliver()).status).toBe(200);
  expect(updates[0].payment_method).toBe('card');
  expect(mock.mail).toHaveBeenCalledWith(expect.objectContaining({ templateId: 1 }));
});
it('does not resend emails or repeat stock effects for a replayed paid event', async () => {
  await deliver();
  const sent = mock.mail.mock.calls.length;
  const updated = updates.length;
  expect((await deliver()).status).toBe(200);
  expect(mock.mail).toHaveBeenCalledTimes(sent);
  expect(updates).toHaveLength(updated);
  expect(mock.charge).toHaveBeenCalledTimes(1);
});
it('leaves the order unchanged on a Stripe lookup failure, then retries successfully', async () => {
  mock.charge.mockRejectedValueOnce(new Error('Stripe unavailable'));
  expect((await deliver()).status).toBe(500);
  expect(updates).toHaveLength(0);
  expect(mock.mail).not.toHaveBeenCalled();
  expect(order.payment_status).toBe('pending');
  expect((await deliver()).status).toBe(200);
  expect(order.payment_method).toBe('card');
  expect(order.payment_status).toBe('paid');
  expect(mock.mail).toHaveBeenCalledWith(expect.objectContaining({ templateId: 1 }));
});
it('leaves the order unchanged rather than treating an unknown payment as card', async () => {
  mock.event.data.object.latest_charge = null;
  mock.event.data.object.payment_method = null;
  expect((await deliver()).status).toBe(500);
  expect(updates).toHaveLength(0);
  expect(mock.mail).not.toHaveBeenCalled();
});
