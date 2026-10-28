import type { SupabaseClient } from "@supabase/supabase-js";
import { readAll } from "./loadStoreAnalytics";
import { buildReferralSales, type ReferralRefund } from "./referralMonthly";
import type { ExternalOrderRecord } from "./externalOrderAccounting";
export async function loadReferralMonthly(client: SupabaseClient) {
  const [customers, orders, external, direct, refunds] = await Promise.all([
    readAll<any>(
      client,
      "customers",
      "id,last_name,first_name,email,referred_by_customer_id",
    ),
    readAll<any>(client, "orders", "*,order_items(*)"),
    readAll<ExternalOrderRecord>(
      client,
      "external_order_records",
      "*",
      "source_key",
    ),
    readAll<any>(client, "referral_manual_sales", "*"),
    readAll<ReferralRefund>(client, "referral_refunds", "*"),
  ]);
  return {
    customers,
    ...buildReferralSales(customers, orders, external, direct),
    refunds,
  };
}
