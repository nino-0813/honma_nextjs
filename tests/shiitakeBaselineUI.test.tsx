import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
vi.mock('../lib/supabase', () => ({ supabase: { auth: { getSession: async () => ({ data: { session: { access_token: 'fixture' } } }) } } }));
import ShiitakeBaselineSettings from '../admin/ShiitakeBaselineSettings';
const saved = { baseline_date: '2026-10-20', phase: 'before_open', quantity: 18, revision: 1, reason: '初回登録', updated_at: '2026-10-28T00:00:00Z' };
let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => { fetchMock = vi.fn().mockResolvedValue(Response.json({ baseline: null, history: [] })); vi.stubGlobal('fetch', fetchMock); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it('loads the persisted state and never auto-saves the confirmed suggested 18', async () => {
  render(<ShiitakeBaselineSettings />);
  await screen.findByText(/未保存：確認済み/);
  expect((screen.getByLabelText('開始在庫の数量（個）') as HTMLInputElement).value).toBe('18');
  expect(screen.getByText(/当日の売上を含めて/)).toBeTruthy();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: '開始在庫を保存する' }));
  expect(screen.getByRole('alert').textContent).toContain('変更理由'); expect(fetchMock).toHaveBeenCalledTimes(1);
});
it('saves settings with revision and reason, then reloads persisted values on remount', async () => {
  const view = render(<ShiitakeBaselineSettings />); await screen.findByText(/未保存：確認済み/);
  fireEvent.change(screen.getByLabelText('開始在庫の変更理由（必須）'), { target: { value: '初回登録' } });
  fetchMock.mockResolvedValueOnce(Response.json({ baseline: saved }));
  fireEvent.click(screen.getByRole('button', { name: '開始在庫を保存する' }));
  await screen.findByRole('status');
  expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toMatchObject({ quantity: 18, phase: 'before_open', expectedRevision: 0, reason: '初回登録' });
  view.unmount(); fetchMock.mockResolvedValueOnce(Response.json({ baseline: { ...saved, quantity: 12 }, history: [saved] }));
  render(<ShiitakeBaselineSettings />); await screen.findByText(/保存済み：.*12個/);
  expect((screen.getByLabelText('開始在庫の数量（個）') as HTMLInputElement).value).toBe('12');
});
it('does not show suggested values as saved when database is unavailable', async () => {
  fetchMock.mockResolvedValueOnce(Response.json({ error: 'SQL未適用' }, { status: 503 }));
  render(<ShiitakeBaselineSettings />); await screen.findByRole('alert');
  expect(screen.getByText('設定を未確認')).toBeTruthy();
  expect((screen.getByRole('button', { name: '開始在庫を保存する' }) as HTMLButtonElement).disabled).toBe(true);
});
it('blocks overwrite on conflict until the current settings are reloaded', async () => {
  render(<ShiitakeBaselineSettings />); await screen.findByText(/未保存：確認済み/);
  fireEvent.change(screen.getByLabelText('開始在庫の変更理由（必須）'), { target: { value: '訂正' } });
  fetchMock.mockResolvedValueOnce(Response.json({ error: '別の管理者が変更しました' }, { status: 409 }));
  fireEvent.click(screen.getByRole('button', { name: '開始在庫を保存する' }));
  await screen.findByRole('alert');
  await waitFor(() => expect((screen.getByRole('button', { name: '開始在庫を保存する' }) as HTMLButtonElement).disabled).toBe(true));
});
