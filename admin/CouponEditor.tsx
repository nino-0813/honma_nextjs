'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { IconArrowLeft } from '@/components/Icons';
import { LoadingButton } from '@/components/UI';

const CouponEditor = () => {
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const id = params?.id as string | undefined;
  const isNew = !id || id === 'new';

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [usageLimit, setUsageLimit] = useState('');

  useEffect(() => {
    if (isNew) return;
    const client = supabase;
    if (!client || !id) return;
    const load = async () => {
      const { data, error: e } = await client
        .from('coupons')
        .select('*')
        .eq('id', id)
        .single();
      if (e) {
        setError(e.message);
        return;
      }
      if (data) {
        setName(data.name || '');
        setCode(data.code || '');
        setDiscountType(data.discount_type || 'percentage');
        setDiscountValue(String(data.discount_value ?? ''));
        setIsActive(data.is_active ?? true);
        setStartsAt(data.starts_at ? data.starts_at.slice(0, 16) : '');
        setEndsAt(data.ends_at ? data.ends_at.slice(0, 16) : '');
        setUsageLimit(data.usage_limit != null ? String(data.usage_limit) : '');
      }
    };
    load();
  }, [id, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = supabase;
    if (!client) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        discount_type: discountType,
        discount_value: parseInt(discountValue, 10) || 0,
        is_active: isActive,
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        usage_limit: usageLimit ? parseInt(usageLimit, 10) : null,
        updated_at: new Date().toISOString(),
      };
      if (isNew) {
        const { error: insertErr } = await client.from('coupons').insert([payload]);
        if (insertErr) throw insertErr;
        router.push('/admin/discounts');
        return;
      }
      const { error: updateErr } = await client
        .from('coupons')
        .update(payload)
        .eq('id', id);
      if (updateErr) throw updateErr;
      router.push('/admin/discounts');
    } catch (err: any) {
      setError(err?.message || '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/discounts" className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <IconArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {isNew ? 'クーポン作成' : 'クーポン編集'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">割引コードを管理</p>
          </div>
        </div>
      </div>
      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">クーポン名</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">コード</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
            placeholder="例: WELCOME10"
            required
          />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">割引タイプ</label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="percentage">パーセント</option>
              <option value="fixed">固定金額</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {discountType === 'percentage' ? '割引率（%）' : '割引額（円）'}
            </label>
            <input
              type="number"
              min={discountType === 'percentage' ? 1 : 0}
              max={discountType === 'percentage' ? 100 : undefined}
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">使用上限（空で無制限）</label>
          <input
            type="number"
            min="0"
            value={usageLimit}
            onChange={(e) => setUsageLimit(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">開始日時</label>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">終了日時</label>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded border-gray-300"
          />
          <label htmlFor="isActive" className="text-sm text-gray-700">有効</label>
        </div>
        <div className="flex gap-3 pt-4">
          <LoadingButton
            type="submit"
            loading={saving}
            className="bg-gray-900 text-white px-6 py-2 rounded-md text-sm font-medium"
          >
            {isNew ? '作成' : '更新'}
          </LoadingButton>
          <Link
            href="/admin/discounts"
            className="px-4 py-2 border border-gray-200 rounded-md text-sm bg-white hover:bg-gray-50"
          >
            キャンセル
          </Link>
        </div>
      </form>
    </>
  );
};

export default CouponEditor;
