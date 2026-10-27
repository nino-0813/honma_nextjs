import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
const mock = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn(), read: vi.fn(), search: new URLSearchParams('detail=target') }));
vi.mock('next/link', () => ({ default: ({ children, ...props }: any) => <a {...props}>{children}</a> }));
vi.mock('next/navigation', () => ({ useSearchParams: () => mock.search }));
vi.mock('@/lib/supabase', () => ({ supabase: { from: mock.from, rpc: mock.rpc } }));
vi.mock('@/lib/loadStoreAnalytics', () => ({ readAll: mock.read }));
import CustomerList from '../admin/CustomerList';
import Orders from '../admin/Orders';
import SubscriptionAnnualSummary from '../admin/SubscriptionAnnualSummary';
afterEach(() => { cleanup(); vi.resetAllMocks(); });
it('renders full names, referrer and current active state instead of the email column', async () => {
  const fixtures: Record<string, any[]> = {
    customers: [{ id: 'c', last_name: '山田', first_name: '太郎', email: 'fixture@example.invalid', referrer_name: '佐藤 花子' }],
    profiles: [], subscriptions: [{ email: 'fixture@example.invalid', status: 'active' }], orders: [], products: [],
  };
  mock.read.mockImplementation(async (_client, table) => fixtures[table]);
  render(<CustomerList />);
  await screen.findByText('山田 太郎');
  expect(screen.getByRole('columnheader', { name: '紹介者氏名' })).toBeTruthy();
  expect(screen.getByRole('columnheader', { name: '定期便（active）' })).toBeTruthy();
  expect(screen.queryByRole('columnheader', { name: 'メール' })).toBeNull();
  expect(screen.getByText('佐藤 花子')).toBeTruthy(); expect(screen.getByText('あり')).toBeTruthy();
});
it('only renders the clicked related order and supports removing that filter', async () => {
  const rows = [{ id: 'target', order_number: 'ORD-TARGET', total: 100, email: 'a@example.invalid', created_at: '2026-10-27', payment_status: 'paid', order_status: 'processing', order_items: [] },
    { id: 'unrelated', order_number: 'ORD-OTHER', total: 100, email: 'b@example.invalid', created_at: '2026-10-27', payment_status: 'paid', order_status: 'processing', order_items: [] }];
  mock.from.mockImplementation(() => {
    const q: any = { select: () => q, eq: () => q, order: () => q, range: async () => ({ data: rows, count: 2, error: null }) };
    return q;
  });
  render(<Orders />);
  await screen.findByText('ORD-TARGET');
  expect(screen.queryByText('ORD-OTHER')).toBeNull();
  expect(screen.getByRole('link', { name: '絞り込みを解除' }).getAttribute('href')).toBe('/admin/orders');
});
it('shows unavailable annual data instead of a fabricated zero on inventory errors', async () => {
  mock.rpc.mockResolvedValue({ error: { message: 'unavailable' }, data: null });
  render(<SubscriptionAnnualSummary orders={[]} />);
  await screen.findByText(/年間発送量は未取得/);
  expect(screen.queryByText('0 kg')).toBeNull();
});
