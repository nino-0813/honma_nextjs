import { trackPurchase, type AnalyticsSendResult } from './analytics';

// Survives effect cleanup/remounts (including StrictMode) within this document.
const handedOff = new Set<string>();

export function trackPurchaseOnce(
  paymentIntentId: string,
  purchase: Parameters<typeof trackPurchase>[0],
): AnalyticsSendResult | 'already_recorded' {
  const key = `ga4_purchase_${paymentIntentId}`;
  if (handedOff.has(key)) return 'already_recorded';
  try {
    // Retain the existing key and all historical markers, including legacy '1'.
    // An unreadable marker is unknown, not proof of a previous handoff.
    if (window.localStorage.getItem(key)) return 'already_recorded';
  } catch {
    // Continue with the same transaction_id to avoid losing first purchases.
  }
  try {
    if (window.sessionStorage.getItem(key)) return 'already_recorded';
  } catch {
    // Storage is best effort; the document-level guard still prevents duplicates.
  }
  const result = trackPurchase(purchase);
  if (result === 'handed_off') {
    handedOff.add(key);
    try {
      window.localStorage.setItem(key, '1');
    } catch {
      // Best effort across reloads when localStorage is full or becomes unavailable.
      try { window.sessionStorage.setItem(key, '1'); } catch { /* memory guard remains */ }
    }
  }
  return result;
}
