import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { IconChevronDown, IconClose } from '../../components/Icons';

type DiscountType = 'percentage' | 'fixed';

type Coupon = {
  id: string;
  name: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  usage_count: number;
  usage_limit: number | null;
  min_order_amount: number | null;
  once_per_user: boolean;
  applies_to_all: boolean;
  created_at: string;
  updated_at: string;
};

type ProductLite = {
  id: string;
  title: string;
  price: number;
};

const formatYen = (n: number) => `¥${Number(n || 0).toLocaleString()}`;

const toLocalDateTimeInput = (iso: string) => {
  // "2025-12-31T23:59:00Z" -> "2025-12-31T23:59"
  const d = new Date(iso);
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fromLocalDateTimeInput = (val: string) => {
  // "2025-12-31T23:59" -> ISO
  if (!val) return null;
  const d = new Date(val);
  return d.toISOString();
};

const CouponEditor = ({ params }: any) => {
  const navigate = useNavigate();
  const id = params?.id as string | undefined;
  const isNew = !id || id === 'new';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // base
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [isActive, setIsActive] = useState(true);

  // discount
  const [discountType, setDiscountType] = useState<DiscountType>('percentage');
  const [discountValue, setDiscountValue] = useState<string>('10');

  // 기간
  const [hasPeriod, setHasPeriod] = useState(true);
  const [startsAt, setStartsAt] = useState<string>(''); // local datetime
  const [endsAt, setEndsAt] = useState<string>(''); // local datetime

  // details
  const [usageLimitEnabled, setUsageLimitEnabled] = useState(false);
  const [usageLimit, setUsageLimit] = useState<string>('10');
  const [minOrderEnabled, setMinOrderEnabled] = useState(false);
  const [minOrderAmount, setMinOrderAmount] = useState<string>('1000');
  const [oncePerUser, setOncePerUser] = useState(false);

  // targeting
  const [appliesToAll, setAppliesToAll] = useState(true);
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [productSearch, setProductSearch] = useState('');

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter(p => p.title.toLowerCase().includes(q));
  }, [products, productSearch]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('products')
        .select('id, title, price')
        .order('created_at', { ascending: false });
      if (!error) setProducts((data || []) as any);
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchCoupon = async () => {
      if (!supabase) {
        setError('Supabaseが利用できません');
        setLoading(false);
        return;
      }
      if (isNew) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('coupons')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        const c = data as Coupon;

        setName(c.name || '');
        setCode(c.code || '');
        setIsActive(Boolean(c.is_active));
        setDiscountType(c.discount_type || 'percentage');
        setDiscountValue(String(c.discount_value ?? 0));

        const has = Boolean(c.starts_at || c.ends_at);
        setHasPeriod(has);
        setStartsAt(c.starts_at ? toLocalDateTimeInput(c.starts_at) : '');
        setEndsAt(c.ends_at ? toLocalDateTimeInput(c.ends_at) : '');

        setUsageLimitEnabled(c.usage_limit !== null && c.usage_limit !== undefined);
        setUsageLimit(String(c.usage_limit ?? 10));
        setMinOrderEnabled(c.min_order_amount !== null && c.min_order_amount !== undefined);
        setMinOrderAmount(String(c.min_order_amount ?? 1000));
        setOncePerUser(Boolean(c.once_per_user));

        setAppliesToAll(Boolean(c.applies_to_all));

        // selected products
        const { data: links, error: linkErr } = await supabase
          .from('coupon_products')
          .select('product_id')
          .eq('coupon_id', id);
        if (linkErr) throw linkErr;
        const setIds = new Set<string>((links || []).map((r: any) => r.product_id as string));
        setSelectedProductIds(setIds);
      } catch (e: any) {
        console.error(e);
        setError(e.message || 'クーポンの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };
    fetchCoupon();
  }, [id, isNew]);

  const toggleProduct = (pid: string) => {
    const next = new Set(selectedProductIds);
    if (next.has(pid)) next.delete(pid);
    else next.add(pid);
    setSelectedProductIds(next);
  };

  const validate = () => {
    if (!name.trim()) return 'クーポン名を入力してください';
    if (!code.trim()) return 'クーポンコードを入力してください';
    if (!/^[A-Za-z0-9_-]+$/.test(code.trim())) return 'クーポンコードは英数字・_・- のみ利用できます';

    const dv = Number(discountValue);
    if (!Number.isFinite(dv) || dv <= 0) return '割引値を正しく入力してください';
    if (discountType === 'percentage' && (dv <= 0 || dv > 100)) return '割引率は1〜100で入力してください';

    if (hasPeriod) {
      if (!startsAt || !endsAt) return '有効期間の開始/終了を入力してください';
      if (new Date(startsAt).getTime() >= new Date(endsAt).getTime()) return '終了日時は開始日時より後にしてください';
    }

    if (usageLimitEnabled) {
      const ul = Number(usageLimit);
      if (!Number.isFinite(ul) || ul <= 0) return '発行枚数（上限）を正しく入力してください';
    }
    if (minOrderEnabled) {
      const mo = Number(minOrderAmount);
      if (!Number.isFinite(mo) || mo < 0) return '最低購入金額を正しく入力してください';
    }

    if (!appliesToAll && selectedProductIds.size === 0) return '対象商品を選択してください（または全商品対象にしてください）';
    return null;
  };

  const handleSave = async () => {
    if (!supabase) return;
    const msg = validate();
    if (msg) return alert(msg);

    try {
      setSaving(true);
      setError(null);

      const now = new Date().toISOString();
      const payload: Partial<Coupon> = {
        name: name.trim(),
        code: code.trim(),
        discount_type: discountType,
        discount_value: Math.round(Number(discountValue)),
        is_active: isActive,
        starts_at: hasPeriod ? fromLocalDateTimeInput(startsAt) : null,
        ends_at: hasPeriod ? fromLocalDateTimeInput(endsAt) : null,
        usage_limit: usageLimitEnabled ? Math.round(Number(usageLimit)) : null,
        min_order_amount: minOrderEnabled ? Math.round(Number(minOrderAmount)) : null,
        once_per_user: Boolean(oncePerUser),
        applies_to_all: Boolean(appliesToAll),
        updated_at: now,
      };

      let couponId = id;
      if (isNew) {
        const { data, error } = await supabase
          .from('coupons')
          .insert([{ ...payload, created_at: now }])
          .select('id')
          .single();
        if (error) throw error;
        couponId = (data as any).id as string;
      } else {
        const { error } = await supabase.from('coupons').update(payload).eq('id', id);
        if (error) throw error;
      }

      // links
      if (couponId) {
        // always clear then insert (simple)
        await supabase.from('coupon_products').delete().eq('coupon_id', couponId);
        if (!appliesToAll) {
          const rows = Array.from(selectedProductIds).map((pid) => ({
            coupon_id: couponId,
            product_id: pid,
          }));
          if (rows.length > 0) {
            const { error: linkErr } = await supabase.from('coupon_products').insert(rows);
            if (linkErr) throw linkErr;
          }
        }
      }

      alert('保存しました');
      navigate('/admin/discounts');
    } catch (e: any) {
      console.error(e);
      alert(`保存に失敗しました: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!supabase || isNew || !id) return;
    if (!confirm('このクーポンを削除します。よろしいですか？')) return;
    try {
      setSaving(true);
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) throw error;
      alert('削除しました');
      navigate('/admin/discounts');
    } catch (e: any) {
      alert(`削除に失敗しました: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12">
        <div className="text-center text-gray-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{isNew ? 'クーポン作成' : 'クーポン編集'}</h1>
          <p className="text-sm text-gray-500 mt-1">LINE登録キャンペーン等の割引コードを管理できます</p>
        </div>
        <Link to="/admin/discounts">
          <a className="px-4 py-2 border border-gray-200 rounded-md text-sm bg-white hover:bg-gray-50">戻る</a>
        </Link>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">基本設定</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">クーポン名</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg bg-white"
              placeholder="例）友達登録クーポン"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">クーポンコード</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg bg-white font-mono"
              placeholder="例）ikevege_2026"
            />
            <p className="text-xs text-gray-500 mt-1">英数字・_・- のみ（例: ikevege_2026）</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 bg-white"
          />
          <span className="text-sm text-gray-700">有効にする</span>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">割引設定</h2>

        <div className="space-y-4">
          <div className="text-sm font-medium text-gray-700">割引方法</div>
          <label className="flex items-center gap-3">
            <input
              type="radio"
              name="discountType"
              checked={discountType === 'percentage'}
              onChange={() => setDiscountType('percentage')}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700">割引率（%）</span>
          </label>
          {discountType === 'percentage' && (
            <input
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg bg-white"
              placeholder="10"
            />
          )}
          <label className="flex items-center gap-3">
            <input
              type="radio"
              name="discountType"
              checked={discountType === 'fixed'}
              onChange={() => setDiscountType('fixed')}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700">割引額（¥）</span>
          </label>
          {discountType === 'fixed' && (
            <input
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg bg-white"
              placeholder="500"
            />
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">期間設定</h2>

        <label className="flex items-center gap-3">
          <input
            type="radio"
            name="period"
            checked={!hasPeriod}
            onChange={() => setHasPeriod(false)}
            className="w-4 h-4"
          />
          <span className="text-sm text-gray-700">有効期間を設定しない</span>
        </label>
        <label className="flex items-center gap-3">
          <input
            type="radio"
            name="period"
            checked={hasPeriod}
            onChange={() => setHasPeriod(true)}
            className="w-4 h-4"
          />
          <span className="text-sm text-gray-700">有効期間を設定する</span>
        </label>

        {hasPeriod && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">開始日時</label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">終了日時</label>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg bg-white"
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">詳細設定（任意）</h2>

        <div className="space-y-4">
          <div>
            <div className="text-sm font-semibold text-gray-900">発行枚数制限の設定</div>
            <p className="text-xs text-gray-500 mt-1">何枚までクーポンが使用できるかを設定できます。</p>
            <div className="mt-3 flex items-center gap-3">
              <input
                type="checkbox"
                checked={usageLimitEnabled}
                onChange={(e) => setUsageLimitEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 bg-white"
              />
              <span className="text-sm text-gray-700">発行枚数</span>
              <input
                type="number"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                disabled={!usageLimitEnabled}
                className="w-40 p-2 border border-gray-200 rounded bg-white disabled:bg-gray-50"
              />
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-gray-900">最低購入金額の設定</div>
            <p className="text-xs text-gray-500 mt-1">クーポン使用時の最低購入金額を設定できます。</p>
            <div className="mt-3 flex items-center gap-3">
              <input
                type="checkbox"
                checked={minOrderEnabled}
                onChange={(e) => setMinOrderEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 bg-white"
              />
              <span className="text-sm text-gray-700">最低購入金額</span>
              <input
                type="number"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
                disabled={!minOrderEnabled}
                className="w-40 p-2 border border-gray-200 rounded bg-white disabled:bg-gray-50"
              />
              <span className="text-sm text-gray-600">円</span>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-gray-900">1人1回制限の設定</div>
            <p className="text-xs text-gray-500 mt-1">同じユーザーが複数回使用できないようにします。</p>
            <label className="mt-3 flex items-center gap-3">
              <input
                type="checkbox"
                checked={oncePerUser}
                onChange={(e) => setOncePerUser(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 bg-white"
              />
              <span className="text-sm text-gray-700">1人1回制限を有効にする</span>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">対象商品の設定</h2>

        <label className="flex items-center gap-3">
          <input
            type="radio"
            name="target"
            checked={appliesToAll}
            onChange={() => setAppliesToAll(true)}
            className="w-4 h-4"
          />
          <span className="text-sm text-gray-700">すべての商品を対象とする</span>
        </label>
        <label className="flex items-center gap-3">
          <input
            type="radio"
            name="target"
            checked={!appliesToAll}
            onChange={() => setAppliesToAll(false)}
            className="w-4 h-4"
          />
          <span className="text-sm text-gray-700">一部の商品を対象とする</span>
        </label>

        {!appliesToAll && (
          <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-3 border-b border-gray-200 flex items-center gap-3 bg-gray-50">
              <input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="flex-1 p-2 border border-gray-200 rounded bg-white text-sm"
                placeholder="商品名で検索"
              />
              <div className="text-xs text-gray-500 whitespace-nowrap">
                選択: {selectedProductIds.size}件
              </div>
            </div>
            <div className="max-h-[360px] overflow-y-auto bg-white">
              {filteredProducts.map((p) => (
                <label key={p.id} className="flex items-center justify-between gap-4 px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedProductIds.has(p.id)}
                      onChange={() => toggleProduct(p.id)}
                      className="w-4 h-4 rounded border-gray-300 bg-white"
                    />
                    <div className="min-w-0">
                      <div className="text-sm text-gray-900 truncate">{p.title}</div>
                      <div className="text-xs text-gray-500">{formatYen(p.price)}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleProduct(p.id);
                    }}
                    className="text-xs text-gray-600 hover:text-gray-900"
                    title="選択/解除"
                  >
                    {selectedProductIds.has(p.id) ? <IconClose className="w-4 h-4" /> : <IconChevronDown className="w-4 h-4 opacity-0" />}
                  </button>
                </label>
              ))}
              {filteredProducts.length === 0 && (
                <div className="p-6 text-sm text-gray-500 text-center">該当する商品がありません</div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div>
          {!isNew && (
            <button
              onClick={handleDelete}
              disabled={saving}
              className="px-4 py-2 border border-red-200 text-red-700 rounded-md bg-white hover:bg-red-50 disabled:opacity-50"
            >
              削除
            </button>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 bg-emerald-700 text-white rounded-md font-medium hover:bg-emerald-800 disabled:opacity-50"
        >
          {saving ? '保存中...' : '作成する'}
        </button>
      </div>
    </div>
  );
};

export default CouponEditor;



