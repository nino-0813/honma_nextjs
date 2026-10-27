export const normalizedEmail = (value: unknown) => typeof value === 'string' ? value.trim().toLowerCase() : '';
export function customerFullName(person: { last_name?: string | null; first_name?: string | null }) {
  return [person.last_name?.trim(), person.first_name?.trim()].filter(Boolean).join(' ') || '（氏名未登録）';
}
// Classification is based on maintained categories, not free-form product titles.
export function purchaseCategories(product: any): ('rice' | 'shiitake')[] {
  const categories = new Set([product?.category, ...(Array.isArray(product?.categories) ? product.categories : [])]);
  const result: ('rice' | 'shiitake')[] = [];
  if (categories.has('お米') || categories.has('rice')) result.push('rice');
  if (['原木しいたけ', '椎茸', 'しいたけ', 'shiitake'].some(c => categories.has(c))) result.push('shiitake');
  return result;
}
export function enrichCustomers(customers: any[], profiles: any[], subscriptions: any[] | null, orders: any[], products: any[]) {
  const byEmail = new Map(profiles.filter(p => normalizedEmail(p.email)).map(p => [normalizedEmail(p.email), p]));
  const byProfileId = new Map(profiles.map(p => [p.id, p]));
  const byCustomer = new Map(customers.map(c => [c.id, c]));
  const byProduct = new Map(products.map(p => [p.id, p]));
  const latest = new Map<string, Record<string, string>>();
  for (const order of orders) {
    const email = normalizedEmail(order.email);
    if (!email || email === 'unknown@example.com' || order.payment_status !== 'paid' || order.order_status === 'cancelled') continue;
    const date = new Date(order.created_at);
    if (!Number.isFinite(date.getTime())) continue;
    const day = new Date(date.getTime() + 9 * 3600000).toISOString().slice(0, 10);
    const values = latest.get(email) || {};
    for (const item of order.order_items || []) {
      for (const category of purchaseCategories(byProduct.get(item.product_id))) {
        if (!values[category] || day > values[category]) values[category] = day;
      }
    }
    latest.set(email, values);
  }
  return customers.map(c => {
    const email = normalizedEmail(c.email);
    const profile = (c.id?.startsWith('profile-') ? byProfileId.get(c.id.slice(8)) : null) || byEmail.get(email);
    // Never invent missing names or substitute the email for a surname.
    const person = { ...c, last_name: c.last_name || profile?.last_name || '', first_name: c.first_name || profile?.first_name || null };
    const referrer = byCustomer.get(c.referred_by_customer_id);
    const dates = latest.get(email);
    const maxDate = (legacy: string | null, computed?: string) => [legacy, computed].filter(Boolean).sort().at(-1) || null;
    return { ...person,
      referrer_name: referrer ? customerFullName(referrer) : c.referrer_name,
      activeSubscription: subscriptions === null ? null : subscriptions.some(s => s.status === 'active' &&
        ((profile?.id && s.auth_user_id === profile.id) || (email && email !== 'unknown@example.com' && normalizedEmail(s.email) === email))),
      latest_purchase_rice_date: maxDate(c.latest_purchase_rice_date, dates?.rice),
      latest_purchase_shiitake_date: maxDate(c.latest_purchase_shiitake_date, dates?.shiitake),
    };
  });
}
export function registeredAddress(profile: any) {
  if (!profile) return null;
  const address = [profile.prefecture, profile.city, profile.address, profile.building].filter(Boolean).join(' ');
  return address ? `${profile.postal_code ? `〒${profile.postal_code} ` : ''}${address}` : null;
}
