import React, { StrictMode } from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CheckoutSuccess from '../app/(main)/checkout/success/CheckoutSuccessClient';
import { trackPurchase } from '../lib/analytics';
import { trackPurchaseOnce } from '../lib/purchase-tracking';

const mocks = vi.hoisted(() => ({ query: vi.fn(), intent: '', signal: undefined as AbortSignal | undefined }));
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams({ payment_intent: mocks.intent }) }));
vi.mock('next/link', () => ({ default: ({ href, children }: any) => <a href={href}>{children}</a> }));
vi.mock('@/providers/CartProvider', async () => {
  const { createContext } = await import('react');
  return { CartContext: createContext({ clearCart: () => {} }) };
});
vi.mock('@/lib/supabase', () => ({ supabase: { from: () => {
  const builder: any = {};
  for (const name of ['select', 'eq', 'order', 'limit']) builder[name] = () => builder;
  builder.abortSignal = (signal: AbortSignal) => { mocks.signal = signal; return builder; };
  builder.maybeSingle = mocks.query;
  return builder;
} } }));

const order = (status = 'paid') => ({ data: {
  order_number: 'ORDER-STABLE', payment_status: status, total: 1200, shipping_cost: 200,
  order_items: [{ product_id: 'p1', product_title: 'Vegetable', product_price: 1000, quantity: 1 }],
}, error: null });
const payload = { transactionId: 'ORDER-STABLE', value: 1200, items: [] };
const flush = async () => { await act(async () => {}); };
const advance = async (ms = 1000) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };
let sequence = 0;
beforeEach(() => {
  vi.useFakeTimers();
  mocks.intent = `pi_test_${++sequence}`;
  mocks.query.mockReset().mockResolvedValue(order());
  localStorage.clear();
  sessionStorage.clear();
  window.gtag = vi.fn();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); delete window.gtag; });
const key = () => `ga4_purchase_${mocks.intent}`;

describe('checkout purchase lifecycle (mocked orders and gtag only)', () => {
  it('displays the pending order immediately and polls until paid', async () => {
    mocks.query.mockResolvedValueOnce(order('pending')).mockResolvedValueOnce(order('paid'));
    render(<CheckoutSuccess />); await flush();
    expect(screen.getByText('ORDER-STABLE')).toBeTruthy();
    expect(window.gtag).not.toHaveBeenCalled();
    expect(localStorage.getItem(key())).toBeNull();
    await advance();
    expect(window.gtag).toHaveBeenCalledExactlyOnceWith('event', 'purchase', expect.objectContaining({
      transaction_id: 'ORDER-STABLE', value: 1200, shipping: 200, currency: 'JPY',
    }));
    expect(localStorage.getItem(key())).toBe('1');
  });
  it('stops after ten pending checks without a marker', async () => {
    mocks.query.mockResolvedValue(order('pending'));
    render(<CheckoutSuccess />); await flush(); await advance(60000);
    expect(mocks.query).toHaveBeenCalledTimes(10);
    expect(window.gtag).not.toHaveBeenCalled();
    expect(localStorage.getItem(key())).toBeNull();
  });
  it('waits for a late tag without blocking the order display', async () => {
    delete window.gtag;
    render(<CheckoutSuccess />); await flush(); await advance(2000);
    expect(screen.getByText('ORDER-STABLE')).toBeTruthy();
    expect(localStorage.getItem(key())).toBeNull();
    window.gtag = vi.fn(); await advance();
    expect(window.gtag).toHaveBeenCalledTimes(1);
    expect(mocks.query).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(key())).toBe('1');
  });
  it('does not mark or retry forever when the tag stays absent', async () => {
    delete window.gtag;
    render(<CheckoutSuccess />); await flush(); await advance(60000);
    window.gtag = vi.fn(); await advance(60000);
    expect(window.gtag).not.toHaveBeenCalled();
    expect(localStorage.getItem(key())).toBeNull();
  });
  it('bounds tag exceptions and keeps the transaction ID on all attempts', async () => {
    window.gtag = vi.fn(() => { throw new Error('tag failed'); });
    render(<CheckoutSuccess />); await flush(); await advance(60000);
    expect(window.gtag).toHaveBeenCalledTimes(10);
    for (const call of vi.mocked(window.gtag).mock.calls) expect(call[2].transaction_id).toBe('ORDER-STABLE');
    expect(localStorage.getItem(key())).toBeNull();
  });
  it('recovers after a tag exception, marking only the successful handoff', async () => {
    window.gtag = vi.fn().mockImplementationOnce(() => { throw new Error('tag failed'); });
    render(<CheckoutSuccess />); await flush();
    expect(localStorage.getItem(key())).toBeNull(); await advance();
    expect(window.gtag).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem(key())).toBe('1');
  });
  it('suppresses StrictMode, rerender and remount duplicates', async () => {
    const first = render(<StrictMode><CheckoutSuccess /></StrictMode>); await flush();
    first.rerender(<StrictMode><CheckoutSuccess /></StrictMode>); await flush(); await advance();
    first.unmount(); render(<CheckoutSuccess />); await flush();
    expect(window.gtag).toHaveBeenCalledTimes(1);
  });
  it('suppresses a real handoff after module memory is reset on reload', async () => {
    expect(trackPurchaseOnce(mocks.intent, payload)).toBe('handed_off');
    vi.resetModules();
    const fresh = await import('../lib/purchase-tracking');
    expect(fresh.trackPurchaseOnce(mocks.intent, payload)).toBe('already_recorded');
    expect(window.gtag).toHaveBeenCalledTimes(1);
  });
  it('honors a persisted legacy marker from before reload and keeps unrelated markers', async () => {
    localStorage.setItem(key(), '1'); localStorage.setItem('ga4_purchase_historical', '1');
    render(<CheckoutSuccess />); await flush(); await advance(60000);
    expect(window.gtag).not.toHaveBeenCalled();
    expect(localStorage.getItem('ga4_purchase_historical')).toBe('1');
  });
  it('continues the first handoff on storage read exceptions and suppresses remount duplicates', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
    const view = render(<StrictMode><CheckoutSuccess /></StrictMode>); await flush();
    expect(screen.getByText('ORDER-STABLE')).toBeTruthy();
    view.unmount(); render(<CheckoutSuccess />); await flush();
    expect(window.gtag).toHaveBeenCalledExactlyOnceWith('event', 'purchase', expect.objectContaining({ transaction_id: 'ORDER-STABLE' }));
  });
  it('suppresses simultaneous mounts when storage is entirely unavailable', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied'); });
    render(<><CheckoutSuccess /><CheckoutSuccess /></>); await flush(); await advance(60000);
    expect(window.gtag).toHaveBeenCalledTimes(1);
  });
  it('suppresses simultaneous mounts after a delayed tag becomes available', async () => {
    delete window.gtag;
    render(<><CheckoutSuccess /><CheckoutSuccess /></>); await flush(); await advance(2000);
    window.gtag = vi.fn(); await advance(60000);
    expect(window.gtag).toHaveBeenCalledTimes(1);
  });
  it('honors a readable session marker even when localStorage cannot be read', async () => {
    sessionStorage.setItem(key(), '1');
    const original = Storage.prototype.getItem;
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(function (this: Storage, k) {
      if (this === localStorage) throw new Error('denied');
      return original.call(this, k);
    });
    render(<CheckoutSuccess />); await flush();
    expect(window.gtag).not.toHaveBeenCalled();
  });
  it('reuses the transaction ID after reload with both stores unavailable', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied'); });
    expect(trackPurchaseOnce(mocks.intent, payload)).toBe('handed_off');
    vi.resetModules();
    const fresh = await import('../lib/purchase-tracking');
    expect(fresh.trackPurchaseOnce(mocks.intent, payload)).toBe('handed_off');
    expect(window.gtag).toHaveBeenCalledTimes(2);
    for (const call of vi.mocked(window.gtag!).mock.calls) expect(call[2].transaction_id).toBe('ORDER-STABLE');
  });
  it('keeps an in-memory guard when both storage writes fail', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('full'); });
    const view = render(<StrictMode><CheckoutSuccess /></StrictMode>); await flush();
    view.unmount(); render(<CheckoutSuccess />); await flush(); await advance(60000);
    expect(window.gtag).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(key())).toBeNull();
  });
  it('uses a session marker if only localStorage writes fail', () => {
    const original = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, k, v) {
      if (this === localStorage) throw new Error('full');
      original.call(this, k, v);
    });
    expect(trackPurchaseOnce(mocks.intent, payload)).toBe('handed_off');
    expect(sessionStorage.getItem(key())).toBe('1');
  });
  it('honors a session fallback marker after reload', () => {
    sessionStorage.setItem(key(), '1');
    expect(trackPurchaseOnce(mocks.intent, payload)).toBe('already_recorded');
    expect(window.gtag).not.toHaveBeenCalled();
  });
  it('ignores a response after unmount and aborts the request', async () => {
    let resolve!: (value: ReturnType<typeof order>) => void;
    mocks.query.mockReturnValue(new Promise(r => { resolve = r; }));
    const view = render(<CheckoutSuccess />); view.unmount();
    expect(mocks.signal?.aborted).toBe(true);
    await act(async () => { resolve(order()); }); await advance(60000);
    expect(window.gtag).not.toHaveBeenCalled(); expect(localStorage.getItem(key())).toBeNull();
  });
  it('cancels tag retries on departure', async () => {
    delete window.gtag;
    const view = render(<CheckoutSuccess />); await flush(); view.unmount();
    window.gtag = vi.fn(); await advance(60000);
    expect(window.gtag).not.toHaveBeenCalled();
  });
  it('ignores a response after the overall request deadline', async () => {
    let resolve!: (value: ReturnType<typeof order>) => void;
    mocks.query.mockReturnValue(new Promise(r => { resolve = r; }));
    render(<CheckoutSuccess />); await advance(30000);
    expect(mocks.signal?.aborted).toBe(true);
    await act(async () => { resolve(order()); });
    expect(window.gtag).not.toHaveBeenCalled(); expect(localStorage.getItem(key())).toBeNull();
  });
  it('bounds failed order queries without recording a purchase', async () => {
    mocks.query.mockRejectedValue(new Error('offline'));
    render(<CheckoutSuccess />); await flush(); await advance(60000);
    expect(mocks.query).toHaveBeenCalledTimes(10);
    expect(window.gtag).not.toHaveBeenCalled(); expect(localStorage.getItem(key())).toBeNull();
  });
  it('ignores stale responses after the payment intent changes', async () => {
    let resolve!: (value: ReturnType<typeof order>) => void;
    mocks.query.mockReturnValueOnce(new Promise(r => { resolve = r; }));
    const view = render(<CheckoutSuccess />);
    const oldKey = key(); mocks.intent += '_next';
    view.rerender(<CheckoutSuccess />); await flush();
    await act(async () => { resolve(order()); });
    expect(window.gtag).toHaveBeenCalledTimes(1); expect(localStorage.getItem(oldKey)).toBeNull();
  });
});

it('distinguishes unavailable, throwing and handed-off tags', () => {
  delete window.gtag; expect(trackPurchase(payload)).toBe('unavailable');
  window.gtag = () => { throw new Error('failed'); }; expect(trackPurchase(payload)).toBe('error');
  window.gtag = vi.fn(); expect(trackPurchase(payload)).toBe('handed_off');
});
