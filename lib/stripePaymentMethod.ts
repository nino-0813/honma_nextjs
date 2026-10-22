import type Stripe from 'stripe';

type PaymentIntentMethod = {
  id: string;
  latest_charge?: string | { payment_method_details?: { type?: string } | null } | null;
  payment_method?: string | { type?: string } | null;
};

/** Resolve the method actually used, never the list of methods offered at checkout. */
export async function resolveStripePaymentMethod(
  stripe: Pick<Stripe, 'charges' | 'paymentMethods'>,
  intent: PaymentIntentMethod,
): Promise<string> {
  const charge = typeof intent.latest_charge === 'string'
    ? await stripe.charges.retrieve(intent.latest_charge)
    : intent.latest_charge;
  let method = charge?.payment_method_details?.type;

  if (!method) {
    const paymentMethod = typeof intent.payment_method === 'string'
      ? await stripe.paymentMethods.retrieve(intent.payment_method)
      : intent.payment_method;
    method = paymentMethod?.type;
  }

  if (!method) throw new Error('Actual Stripe payment method could not be resolved');
  // This checkout uses customer_balance with jp_bank_transfer funding.
  return method === 'customer_balance' ? 'bank_transfer' : method;
}
