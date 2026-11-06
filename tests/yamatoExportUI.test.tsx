import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

const mock = vi.hoisted(() => ({ from: vi.fn(), download: vi.fn(), search: new URLSearchParams() }));
vi.mock('next/link', () => ({ default: ({ children, ...props }: any) => <a {...props}>{children}</a> }));
vi.mock('next/navigation', () => ({ useSearchParams: () => mock.search }));
vi.mock('@/lib/supabase', () => ({ supabase: { from: mock.from } }));
vi.mock('@/lib/yamatoWorkbook', () => ({ downloadYamatoWorkbook: mock.download }));
vi.mock('../admin/SubscriptionAnnualSummary', () => ({ default: () => null }));
import Orders from '../admin/Orders';
import Subscriptions from '../admin/Subscriptions';

const orders = [
  { id: 'first', order_number: 'TEST-001', total: 100, email: 'fixture@example.invalid', created_at: '2026-10-01',
    payment_status: 'paid', order_status: 'processing', stripe_subscription_id: 'sub_fixture', order_items: [] },
  { id: 'other', order_number: 'TEST-002', total: 100, email: 'other@example.invalid', created_at: '2026-10-02',
    payment_status: 'paid', order_status: 'processing', order_items: [] },
];
const sub = { id: 'contract', stripe_subscription_id: 'sub_fixture', stripe_customer_id: 'customer_fixture',
  email: 'fixture@example.invalid', auth_user_id: null, status: 'active', interval: 'monthly', created_at: '2026-10-01',
  next_billing_at: '2026-11-10', metadata: { first_shipping_override: '2026-11-15' } };

beforeEach(() => {
  mock.search = new URLSearchParams();
  mock.download.mockResolvedValue(undefined);
  mock.from.mockImplementation((table: string) => {
    const rows = table === 'subscriptions' ? [sub] : table === 'orders' ? orders : [];
    const q: any = { select: () => q, eq: () => q, in: () => q, order: () => q,
      range: async () => ({ data: rows, count: rows.length, error: null }) };
    return q;
  });
});
afterEach(() => { cleanup(); vi.resetAllMocks(); vi.restoreAllMocks(); });

it('adds Yamato Excel beside existing CSV formats and exports only checked orders', async () => {
  render(<Orders />);
  const firstRow = (await screen.findByText('TEST-001')).closest('tr')!;
  fireEvent.click(within(firstRow).getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: /エクスポート/ }));
  expect(screen.getByRole('button', { name: /発送CSV（指定形式）/ })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /ヤマト取込用Excel/ }));
  await waitFor(() => expect(mock.download).toHaveBeenCalledOnce());
  expect(mock.download.mock.calls[0][0].map((o: any) => o.id)).toEqual(['first']);
});

it('exports the filtered result when nothing is checked and surfaces failures for retry', async () => {
  mock.search = new URLSearchParams('email=other@example.invalid');
  mock.download.mockRejectedValueOnce(new Error('必要な注文情報が不足しています'));
  const alert = vi.spyOn(window, 'alert').mockImplementation(() => {});
  render(<Orders />);
  await screen.findByText('TEST-002');
  fireEvent.click(screen.getByRole('button', { name: /エクスポート/ }));
  fireEvent.click(screen.getByRole('button', { name: /ヤマト取込用Excel/ }));
  await waitFor(() => expect(alert).toHaveBeenCalledWith('必要な注文情報が不足しています'));
  expect(mock.download.mock.calls[0][0].map((o: any) => o.id)).toEqual(['other']);
  expect((screen.getByRole('button', { name: /ヤマト取込用Excel/ }) as HTMLButtonElement).disabled).toBe(false);
});

it('retains subscription CSV while removing the subscription Yamato Excel button', async () => {
  render(<Subscriptions />);
  await screen.findByRole('checkbox', { name: 'fixture@example.invalidを選択' });
  fireEvent.change(screen.getByLabelText('発送対象月'), { target: { value: '2026-11' } });
  fireEvent.click(screen.getByRole('checkbox', { name: /絞り込み結果の発送対象を全件選択/ }));
  expect(screen.getByRole('button', { name: '発送予定CSV（確認用）' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'ヤマト取込用Excel' })).toBeNull();
  expect(mock.download).not.toHaveBeenCalled();
});
