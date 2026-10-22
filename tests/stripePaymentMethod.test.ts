// @vitest-environment node
import { expect, it, vi } from 'vitest';
import type Stripe from 'stripe';
import { resolveStripePaymentMethod } from '../lib/stripePaymentMethod';

function client(charge?: unknown, method?: unknown) {
  const charges = { retrieve: vi.fn().mockResolvedValue(charge) };
  const paymentMethods = { retrieve: vi.fn().mockResolvedValue(method) };
  return { charges, paymentMethods, stripe: { charges, paymentMethods } as unknown as Pick<Stripe, 'charges' | 'paymentMethods'> };
}

it.each([['card', 'card'], ['customer_balance', 'bank_transfer']])('uses actual Charge details for %s', async (actual, expected) => {
  const c = client({ payment_method_details: { type: actual } });
  expect(await resolveStripePaymentMethod(c.stripe, { id: 'pi', latest_charge: 'ch' })).toBe(expected);
  expect(c.charges.retrieve).toHaveBeenCalledWith('ch');
  expect(c.paymentMethods.retrieve).not.toHaveBeenCalled();
});
it('accepts expanded charge details without another request', async () => {
  const c = client();
  expect(await resolveStripePaymentMethod(c.stripe, { id: 'pi', latest_charge: { payment_method_details: { type: 'card' } } })).toBe('card');
  expect(c.charges.retrieve).not.toHaveBeenCalled();
});
it('falls back to the actual PaymentMethod when Charge is unavailable', async () => {
  const c = client(null, { type: 'card' });
  expect(await resolveStripePaymentMethod(c.stripe, { id: 'pi', payment_method: 'pm' })).toBe('card');
  expect(c.paymentMethods.retrieve).toHaveBeenCalledWith('pm');
});
it('does not guess card or bank transfer when actual method is missing', async () => {
  const c = client();
  await expect(resolveStripePaymentMethod(c.stripe, { id: 'pi' })).rejects.toThrow('could not be resolved');
});
it('propagates lookup failures so the webhook can retry without misclassifying', async () => {
  const c = client();
  c.charges.retrieve.mockRejectedValue(new Error('Stripe unavailable'));
  await expect(resolveStripePaymentMethod(c.stripe, { id: 'pi', latest_charge: 'ch' })).rejects.toThrow('Stripe unavailable');
  expect(c.paymentMethods.retrieve).not.toHaveBeenCalled();
});
