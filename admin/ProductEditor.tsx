'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { IconArrowLeft } from '@/components/Icons';
import { LoadingButton } from '@/components/UI';

const ProductEditor = () => {
  const params = useParams<{ handle?: string }>();
  const router = useRouter();
  const handleParam = params?.handle as string | undefined;
  const isNew = !handleParam || handleParam === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [handle, setHandle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('お米');
  const [stock, setStock] = useState('0');
  const [sku, setSku] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [image, setImage] = useState('');

  useEffect(() => {
    if (isNew) {
      setLoading(false);
      return;
    }
    const client = supabase;
    if (!client || !handleParam) return;
    const load = async () => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(handleParam);
      const query = client.from('products').select('*');
      const { data, error: e } = await (isUuid
        ? query.eq('id', handleParam)
        : query.eq('handle', handleParam)
      ).single();
      if (e) {
        setLoading(false);
        return;
      }
      if (data) {
        setTitle(data.title || '');
        setHandle(data.handle || '');
        setPrice(String(data.price ?? ''));
        setDescription(data.description || '');
        setCategory(data.category || 'お米');
        setStock(String(data.stock ?? 0));
        setSku(data.sku || '');
        setIsActive(data.is_active ?? true);
        setIsVisible(data.is_visible ?? true);
        setImage(data.image || (data.images && data.images[0]) || '');
      }
      setLoading(false);
    };
    load();
  }, [handleParam, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = supabase;
    if (!client) return;
    if (!title.trim() || !price || !handle.trim()) {
      alert('商品名・価格・ハンドルは必須です');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        handle: handle.trim().toLowerCase().replace(/\s+/g, '-'),
        price: parseInt(price, 10),
        description: description.trim() || null,
        category,
        stock: parseInt(stock, 10) || 0,
        sku: sku.trim() || null,
        is_active: isActive,
        is_visible: isVisible,
        status: isActive ? 'active' : 'draft',
        image: image.trim() || null,
        images: image.trim() ? [image.trim()] : [],
        updated_at: new Date().toISOString(),
      };
      if (isNew) {
        const { error: insertErr } = await client.from('products').insert([payload]);
        if (insertErr) throw insertErr;
        router.push('/admin/products');
        return;
      }
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(handleParam!);
      const { error: updateErr } = await client
        .from('products')
        .update(payload)
        .eq(isUuid ? 'id' : 'handle', handleParam);
      if (updateErr) throw updateErr;
      router.push('/admin/products');
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
          <Link href="/admin/products" className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <IconArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">
            {isNew ? '新規商品追加' : '商品編集'}
          </h1>
        </div>
        <Link href="/admin/products" className="text-sm text-gray-500 hover:text-gray-900 px-4 py-2">
          キャンセル
        </Link>
      </div>
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">商品名 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ハンドル（URL用） *</label>
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="example-product"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">価格（円） *</label>
          <input
            type="number"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリー</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="お米">お米</option>
              <option value="その他">その他</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">在庫数</label>
            <input
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
          <input
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">画像URL</label>
          <input
            type="url"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">有効</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isVisible}
              onChange={(e) => setIsVisible(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">表示する</span>
          </label>
        </div>
        <div className="flex gap-3 pt-4">
          <LoadingButton
            type="submit"
            loading={saving}
            className="bg-gray-900 text-white px-6 py-2 rounded-md text-sm font-medium"
          >
            {isNew ? '作成' : '更新'}
          </LoadingButton>
          <Link href="/admin/products" className="px-4 py-2 border border-gray-200 rounded-md text-sm hover:bg-gray-50">
            キャンセル
          </Link>
        </div>
      </form>
    </>
  );
};

export default ProductEditor;
