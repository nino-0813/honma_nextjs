// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ disabled: false, lookupError: false, create: vi.fn(), customers: vi.fn() }));
vi.mock('stripe', () => ({ default: class {
  paymentIntents = { create: mock.create };
  customers = { list: mock.customers, create: mock.customers };
} }));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({ from: () => ({ select: (columns: string) => ({ in: async () => ({
  data: [{ id: 'p', handle: 'rice', price: 100, bank_transfer_disabled: mock.disabled }],
  error: columns.includes('bank_transfer_disabled') && mock.lookupError ? { code: '42703' } : null,
}) }) }) }) }));
import { POST } from '../app/api/create-payment-intent/route';
beforeEach(() => {
  vi.stubEnv('STRIPE_SECRET_KEY', 'fixture'); vi.stubEnv('SUPABASE_URL', 'http://localhost:1');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'fixture'); vi.stubEnv('ENABLE_STRIPE_BANK_TRANSFER', 'true');
  mock.disabled = false; mock.lookupError = false;
  mock.create.mockResolvedValue({ id: 'pi_fixture', client_secret: 'fixture', livemode: false });
  mock.customers.mockResolvedValue({ data: [{ id: 'cus_fixture' }] });
});
afterEach(() => { vi.resetAllMocks(); vi.unstubAllEnvs(); });
const checkout = () => POST(new Request('http://localhost/api/create-payment-intent', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
  amount: 100, email: 'fixture@example.invalid', idempotency_key: 'test_fixture_key', items: [{ product_id: 'p', unit_price: 100, quantity: 1 }],
}) }));
it('only offers cards for a product restricted in fresh database data', async () => {
  mock.disabled = true;
  expect((await checkout()).status).toBe(200);
  expect(mock.create.mock.calls[0][0].payment_method_types).toEqual(['card']);
  expect(mock.customers).not.toHaveBeenCalled();
});
it('still offers bank transfer for an eligible product', async () => {
  expect((await checkout()).status).toBe(200);
  expect(mock.create.mock.calls[0][0].payment_method_types).toEqual(['card', 'customer_balance']);
});
it('keeps card checkout available but does not offer bank transfer on a restriction lookup failure', async () => {
  mock.lookupError = true;
  const response = await checkout(); expect(response.status).toBe(200);
  expect((await response.json()).bankTransferEnabled).toBe(false);
  expect(mock.create.mock.calls[0][0].payment_method_types).toEqual(['card']);
});
