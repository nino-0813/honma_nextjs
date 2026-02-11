'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { IconArrowLeft } from '@/components/Icons';
import { LoadingButton } from '@/components/UI';

const ShippingMethodEditor = () => {
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const id = params?.id as string | undefined;
  const isNew = !id || id === 'new';

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [name, setName] = useState('');
  const [feeType, setFeeType] = useState<'uniform' | 'area' | 'size'>('uniform');
  const [uniformFee, setUniformFee] = useState('');

  useEffect(() => {
    if (isNew) {
      setLoading(false);
      return;
    }
    const client = supabase;
    if (!client || !id) return;
    const load = async () => {
      const { data, error: e } = await client
        .from('shipping_methods')
        .select('*')
        .eq('id', id)
        .single();
      if (e) {
        setLoading(false);
        return;
      }
      if (data) {
        setName(data.name || '');
        setFeeType(data.fee_type || 'uniform');
        setUniformFee(data.uniform_fee != null ? String(data.uniform_fee) : '');
      }
      setLoading(false);
    };
    load();
  }, [id, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = supabase;
    if (!client) return;
    if (!name.trim()) {
      alert('発送方法名を入力してください');
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        fee_type: feeType,
        area_fees: feeType === 'area' ? {} : {},
        size_fees: feeType === 'size' ? {} : {},
        uniform_fee: feeType === 'uniform' && uniformFee !== '' ? parseInt(uniformFee, 10) : null,
        updated_at: new Date().toISOString(),
      };
      if (isNew) {
        const { error: insertErr } = await client.from('shipping_methods').insert([payload]);
        if (insertErr) throw insertErr;
        router.push('/admin/shipping-methods');
        return;
      }
      const { error: updateErr } = await client
        .from('shipping_methods')
        .update(payload)
        .eq('id', id);
      if (updateErr) throw updateErr;
      router.push('/admin/shipping-methods');
    } catch (err: any) {
      alert(err?.message || '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/shipping-methods" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
            <IconArrowLeft className="w-4 h-4" />
            発送方法管理に戻る
          </Link>
        </div>
      </div>
      <div className="max-w-xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {isNew ? '新規発送方法' : '発送方法の編集'}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">発送方法名 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">送料タイプ</label>
            <select
              value={feeType}
              onChange={(e) => setFeeType(e.target.value as 'uniform' | 'area' | 'size')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="uniform">全国一律</option>
              <option value="area">地域別</option>
              <option value="size">サイズ別</option>
            </select>
          </div>
          {feeType === 'uniform' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">送料（円）</label>
              <input
                type="number"
                min="0"
                value={uniformFee}
                onChange={(e) => setUniformFee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          )}
          {feeType !== 'uniform' && (
            <p className="text-sm text-gray-500">地域別・サイズ別の詳細は今後設定できます。</p>
          )}
          <div className="flex gap-3 pt-4">
            <LoadingButton
              type="submit"
              loading={saving}
              className="bg-gray-900 text-white px-6 py-2 rounded-md text-sm font-medium"
            >
              {isNew ? '作成' : '更新'}
            </LoadingButton>
            <Link
              href="/admin/shipping-methods"
              className="px-4 py-2 border border-gray-200 rounded-md text-sm hover:bg-gray-50"
            >
              キャンセル
            </Link>
          </div>
        </form>
      </div>
    </>
  );
};

export default ShippingMethodEditor;
