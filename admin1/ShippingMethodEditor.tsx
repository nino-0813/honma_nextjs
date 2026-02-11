import React, { useMemo, useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { IconArrowLeft, IconLoader2 } from '../../components/Icons';
import { LoadingButton } from '../../components/UI';
import { ShippingMethod, AreaFees, Product, SizeFees, SizeFee } from '../../types';

// 画像の料金表に合わせた地域区分
const AREA_LABELS: Record<keyof AreaFees, string> = {
  hokkaido: '北海道',
  north_tohoku: '北東北（青森、秋田、岩手）',
  south_tohoku: '南東北（宮城、山形、福島）',
  kanto: '関東（茨城、栃木、群馬、埼玉、千葉、神奈川、山梨、東京）',
  shinetsu: '信越（新潟、長野）',
  hokuriku: '北陸（富山、石川、福井）',
  chubu: '中部（静岡、愛知、三重、岐阜）',
  kansai: '関西（大阪、京都、滋賀、奈良、和歌山、兵庫）',
  chugoku: '中国（岡山、広島、山口、鳥取、島根）',
  shikoku: '四国（香川、徳島、愛媛、高知）',
  kyushu: '九州（福岡、佐賀、長崎、熊本、大分、宮崎、鹿児島）',
  okinawa: '沖縄',
};

const AREA_KEYS: (keyof AreaFees)[] = [
  'hokkaido',
  'north_tohoku',
  'south_tohoku',
  'kanto',
  'shinetsu',
  'hokuriku',
  'chubu',
  'kansai',
  'chugoku',
  'shikoku',
  'kyushu',
  'okinawa',
];

const getAreaLabelParts = (label: string): { main: string; sub?: string } => {
  const idx = label.indexOf('（');
  if (idx === -1) return { main: label };
  const main = label.slice(0, idx);
  const sub = label.slice(idx + 1).replace(/）$/, '');
  return { main, sub };
};

const AreaLabelCell = ({ area }: { area: keyof AreaFees }) => {
  const { main, sub } = getAreaLabelParts(AREA_LABELS[area]);
  return (
    <div className="leading-tight">
      <div className="font-medium text-gray-900">{main}</div>
      {sub ? <div className="text-[10px] text-gray-500 mt-0.5">{sub}</div> : null}
    </div>
  );
};

const getSupabaseErrorMessage = (err: unknown): string => {
  const anyErr = err as any;
  const message = anyErr?.message || '不明なエラー';
  const details = anyErr?.details ? `\n詳細: ${anyErr.details}` : '';
  const hint = anyErr?.hint ? `\nヒント: ${anyErr.hint}` : '';
  const code = anyErr?.code ? `\nコード: ${anyErr.code}` : '';

  // よくあるケースを分かりやすく
  const lower = String(message).toLowerCase();
  if (lower.includes('column') && lower.includes('size_fees')) {
    return (
      'DBに `size_fees` カラムがありません。\n' +
      'SupabaseのSQL Editorで `supabase_schema.sql`（統合版）を実行して、shipping_methodsテーブルを最新化してください。'
    );
  }
  if (lower.includes('column') && lower.includes('uniform_fee')) {
    return (
      'DBに `uniform_fee` カラムがありません。\n' +
      'SupabaseのSQL Editorで `supabase_schema.sql`（統合版）を実行して、shipping_methodsテーブルを最新化してください。'
    );
  }
  if (lower.includes('row-level security') || lower.includes('rls')) {
    return (
      'RLS（Row Level Security）で拒否されました。\n' +
      '管理者アカウント/ポリシー設定を確認してください。'
    );
  }

  return `${message}${details}${hint}${code}`;
};

// サイズ別送料（画像の表）: サイズごとに重量が固定
const SIZE_OPTIONS = [60, 80, 100, 120, 140];
const SIZE_WEIGHT_MAP: Record<number, number> = {
  60: 2,
  80: 5,
  100: 10,
  120: 15,
  140: 20,
};

const ShippingMethodEditor = () => {
  const params = useParams<{ id?: string }>();
  const methodId = params?.id;
  const isNew = !methodId || methodId === 'new';
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  // フォーム状態
  const [name, setName] = useState('');
  const [feeType, setFeeType] = useState<'uniform' | 'area' | 'size'>('uniform');
  const [uniformFee, setUniformFee] = useState<number | ''>('');
  const [areaFees, setAreaFees] = useState<AreaFees>({});
  const [sizeFees, setSizeFees] = useState<SizeFees>({});

  // 商品選択
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // 新規作成時: 既存の送料表をコピー（通常料金/クール便 など）
  const [shippingTemplates, setShippingTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [autoAppliedDefaultTemplate, setAutoAppliedDefaultTemplate] = useState(false);

  // サイズ別: 表示するサイズ行（バリエーションのように追加していく）
  const [enabledSizes, setEnabledSizes] = useState<number[]>([]);
  const [sizeToAdd, setSizeToAdd] = useState<number>(60);

  const availableSizes = useMemo(
    () => SIZE_OPTIONS.filter((s) => !enabledSizes.includes(s)),
    [enabledSizes]
  );

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const title = (p.title || '').toLowerCase();
      const sku = (p.sku || '').toLowerCase();
      return title.includes(q) || sku.includes(q);
    });
  }, [products, productSearch]);

  const allFilteredSelected = useMemo(() => {
    if (filteredProducts.length === 0) return false;
    const selectedSet = new Set(selectedProductIds);
    return filteredProducts.every((p) => selectedSet.has(p.id));
  }, [filteredProducts, selectedProductIds]);

  useEffect(() => {
    if (!isNew && methodId) {
      fetchShippingMethod(methodId);
    }
    fetchProducts();
  }, [methodId, isNew]);

  useEffect(() => {
    if (!isNew) return;
    fetchShippingTemplates();
  }, [isNew]);

  // 新規作成時: 「サイズ別」を選んだ瞬間に「通常料金」を自動適用（未入力の場合のみ）
  useEffect(() => {
    if (!isNew) return;
    if (feeType !== 'size') return;
    if (autoAppliedDefaultTemplate) return;
    if (Object.keys(sizeFees || {}).length > 0) return; // すでに入力があるなら上書きしない
    if (!shippingTemplates || shippingTemplates.length === 0) return;

    const defaultTemplate =
      shippingTemplates.find((t) => t?.name === '通常料金') ||
      shippingTemplates.find((t) => t?.fee_type === 'size');

    if (!defaultTemplate?.id) return;

    setSelectedTemplateId(defaultTemplate.id);
    applyTemplate(defaultTemplate.id);
    setAutoAppliedDefaultTemplate(true);
  }, [isNew, feeType, shippingTemplates, sizeFees, autoAppliedDefaultTemplate]);

  // サイズ別に切り替えたら、最初は60だけ表示（必要なサイズを追加していく）
  useEffect(() => {
    if (feeType !== 'size') return;
    setEnabledSizes((prev) => (prev.length > 0 ? prev : [60]));
  }, [feeType]);

  // 追加候補のselectは「まだ追加されていないサイズ」に追従させる
  useEffect(() => {
    if (feeType !== 'size') return;
    const next = availableSizes[0];
    if (next !== undefined) {
      setSizeToAdd(next);
    }
  }, [feeType, availableSizes]);

  const addSizeRow = () => {
    setEnabledSizes((prev) => {
      if (prev.includes(sizeToAdd)) return prev;
      return [...prev, sizeToAdd].sort((a, b) => a - b);
    });
  };

  const removeSizeRow = (size: number) => {
    setEnabledSizes((prev) => prev.filter((s) => s !== size));
    // 表示から消すだけでなく、該当サイズのデータも消す（混乱防止）
    const weight = SIZE_WEIGHT_MAP[size];
    const key = `${size}_${weight}`;
    setSizeFees((prev) => {
      if (!prev || !(key in prev)) return prev;
      const { [key]: _removed, ...rest } = prev as any;
      return rest as SizeFees;
    });
  };

  const fetchShippingMethod = async (id: string) => {
    try {
      setInitialLoading(true);
      const { data, error } = await supabase
        .from('shipping_methods')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setName(data.name || '');
        setFeeType(data.fee_type || 'uniform');
        // area_feesとsize_feesを正しく読み込む
        let loadedAreaFees: AreaFees = {};
        let loadedSizeFees: SizeFees = {};
        
        try {
          if (data.area_fees) {
            if (typeof data.area_fees === 'string') {
              loadedAreaFees = JSON.parse(data.area_fees);
            } else if (typeof data.area_fees === 'object') {
              loadedAreaFees = data.area_fees as AreaFees;
            }
          }
          
          if (data.size_fees) {
            if (typeof data.size_fees === 'string') {
              loadedSizeFees = JSON.parse(data.size_fees);
            } else if (typeof data.size_fees === 'object') {
              loadedSizeFees = data.size_fees as SizeFees;
            }
          }
        } catch (e) {
          console.error('送料データのパースエラー:', e);
        }
        
        setAreaFees(loadedAreaFees);
        setSizeFees(loadedSizeFees);
        setUniformFee(data.uniform_fee || '');

        // 既存データの場合: size_feesに入っているサイズだけ表示（なければ60だけ）
        if ((data.fee_type || 'uniform') === 'size') {
          const sizesFromKeys = Object.keys(loadedSizeFees || {})
            .map((k) => Number(String(k).split('_')[0]))
            .filter((n) => Number.isFinite(n));
          const uniqueSorted = Array.from(new Set(sizesFromKeys)).sort((a, b) => a - b);
          setEnabledSizes(uniqueSorted.length > 0 ? uniqueSorted : [60]);
          setSizeToAdd(60);
        }
        
        // 紐づいている商品を取得
        const { data: linkedProducts, error: linkError } = await supabase
          .from('product_shipping_methods')
          .select('product_id')
          .eq('shipping_method_id', id);

        if (!linkError && linkedProducts) {
          setSelectedProductIds(linkedProducts.map((p: any) => p.product_id));
        }
      }
    } catch (error) {
      console.error('発送方法の取得エラー:', error);
      alert('発送方法の取得に失敗しました');
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchShippingTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('shipping_methods')
        .select('id, name, fee_type, area_fees, size_fees, uniform_fee')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setShippingTemplates(data || []);
    } catch (e) {
      console.error('送料表テンプレートの取得エラー:', e);
    }
  };

  const applyTemplate = (templateId?: string) => {
    const idToApply = templateId || selectedTemplateId;
    const tmpl = shippingTemplates.find((t) => t.id === idToApply);
    if (!tmpl) return;

    // fee_type
    const tmplFeeType = (tmpl.fee_type || 'uniform') as 'uniform' | 'area' | 'size';
    setFeeType(tmplFeeType);

    // fees
    let loadedAreaFees: AreaFees = {};
    let loadedSizeFees: SizeFees = {};
    try {
      if (tmpl.area_fees) {
        loadedAreaFees =
          typeof tmpl.area_fees === 'string' ? JSON.parse(tmpl.area_fees) : (tmpl.area_fees as AreaFees);
      }
      if (tmpl.size_fees) {
        loadedSizeFees =
          typeof tmpl.size_fees === 'string' ? JSON.parse(tmpl.size_fees) : (tmpl.size_fees as SizeFees);
      }
    } catch (e) {
      console.error('テンプレート送料データのパースエラー:', e);
    }
    setAreaFees(loadedAreaFees);
    setSizeFees(loadedSizeFees);
    setUniformFee(tmpl.uniform_fee ?? '');

    // 名前が空なら「（コピー）」を付けて入れる
    if (!name.trim()) {
      setName(`${tmpl.name}（コピー）`);
    }

    // サイズ別の場合、最初は60だけ表示（必要なサイズを追加していく）
    if (tmplFeeType === 'size') {
      setEnabledSizes((prev) => (prev.length > 0 ? prev : [60]));
      setSizeToAdd(60);
    }
  };

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('id, title, sku, price')
        .order('title', { ascending: true });

      if (error) throw error;
      setProducts((data || []) as Product[]);
    } catch (error) {
      console.error('商品の取得エラー:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleAreaFeeChange = (area: keyof AreaFees, value: string) => {
    setAreaFees((prev) => ({
      ...prev,
      [area]: value === '' ? undefined : Number(value),
    }));
  };

  const handleSizeFeeChange = (size: number, weight: number, area: keyof AreaFees, value: string) => {
    const key = `${size}_${weight}`;
    setSizeFees((prev) => {
      const current = prev[key] || { size, weight_kg: weight, area_fees: {}, max_items_per_box: null };
      return {
        ...prev,
        [key]: {
          ...current,
          area_fees: {
            ...current.area_fees,
            [area]: value === '' ? undefined : Number(value),
          },
        },
      };
    });
  };

  const handleSizeMaxItemsChange = (size: number, value: string) => {
    const weight = SIZE_WEIGHT_MAP[size];
    const key = `${size}_${weight}`;
    setSizeFees((prev) => {
      const current = prev[key] || { size, weight_kg: weight, area_fees: {}, max_items_per_box: null };
      return {
        ...prev,
        [key]: {
          ...current,
          max_items_per_box: value === '' ? null : Number(value),
        },
      };
    });
  };

  const getSizeFee = (size: number, weight: number): SizeFee | null => {
    const key = `${size}_${weight}`;
    return sizeFees[key] || null;
  };

  const handleProductToggle = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!name.trim()) {
        alert('発送方法名を入力してください');
        return;
      }
      if (feeType === 'uniform' && (uniformFee === '' || Number(uniformFee) < 0)) {
        alert('全国一律の送料（円）を入力してください');
        return;
      }

      const methodData: any = {
        name,
        // 基本情報の「ダンボールサイズ / 最大重量 / 1箱に入る最大商品数」は不要のため常にnull
        box_size: null,
        max_weight_kg: null,
        max_items_per_box: null,
        fee_type: feeType,
        area_fees: feeType === 'area' ? areaFees : {},
        size_fees: feeType === 'size' ? sizeFees : {},
        uniform_fee: feeType === 'uniform' && uniformFee !== '' ? Number(uniformFee) : null,
      };

      let savedMethodId = methodId;

      if (isNew) {
        const { data, error } = await supabase
          .from('shipping_methods')
          .insert(methodData)
          .select()
          .single();

        if (error) throw error;
        savedMethodId = data.id;
      } else {
        const { error } = await supabase
          .from('shipping_methods')
          .update(methodData)
          .eq('id', methodId);

        if (error) throw error;
      }

      // 商品との紐づけを更新
      if (savedMethodId) {
        // 既存の紐づけを削除
        await supabase
          .from('product_shipping_methods')
          .delete()
          .eq('shipping_method_id', savedMethodId);

        // 新しい紐づけを追加
        if (selectedProductIds.length > 0) {
          const links = selectedProductIds.map((productId) => ({
            product_id: productId,
            shipping_method_id: savedMethodId,
          }));

          const { error: linkError } = await supabase
            .from('product_shipping_methods')
            .insert(links);

          if (linkError) throw linkError;
        }
      }

      alert(isNew ? '発送方法を作成しました' : '発送方法を更新しました');
      navigate('/admin/shipping-methods');
    } catch (error) {
      console.error('保存エラー:', error);
      alert(`保存に失敗しました。\n\n${getSupabaseErrorMessage(error)}`);
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <IconLoader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* ヘッダー */}
      <div className="mb-6">
        <Link to="/admin/shipping-methods">
          <a className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
            <IconArrowLeft className="w-4 h-4" />
            発送方法管理に戻る
          </a>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {isNew ? '新規発送方法を作成' : '発送方法を編集'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本情報 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                発送方法名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                placeholder="例：米用ダンボールM"
                required
              />
            </div>
          </div>
        </div>

        {/* 送料設定 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">送料設定</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                送料タイプ <span className="text-red-500">*</span>
              </label>
              <select
                value={feeType}
                onChange={(e) => setFeeType(e.target.value as 'uniform' | 'area' | 'size')}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
              >
                <option value="uniform">全国一律</option>
                <option value="area">地域別</option>
                <option value="size">サイズ別</option>
              </select>
            </div>

            {feeType === 'uniform' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  送料（円） <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={uniformFee}
                  onChange={(e) => setUniformFee(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                  placeholder="例：800"
                  required
                />
              </div>
            ) : feeType === 'area' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  地域別送料（円）
                </label>
                {isNew && (
                  <div className="mb-3 flex items-center gap-2">
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm"
                    >
                      <option value="">（任意）既存の送料表をコピーして入力を埋める</option>
                      {shippingTemplates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={applyTemplate}
                      disabled={!selectedTemplateId}
                      className="px-3 py-2 text-sm bg-gray-900 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800"
                    >
                      コピー
                    </button>
                  </div>
                )}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">地域</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">送料</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {AREA_KEYS.map((area) => {
                        const feeValue = areaFees[area];
                        // 0の場合は空欄を表示
                        const displayValue = feeValue !== undefined && feeValue !== null && feeValue !== 0 ? feeValue : '';
                        return (
                          <tr key={area}>
                            <td className="px-4 py-2">
                              <AreaLabelCell area={area} />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                value={displayValue}
                                onChange={(e) => handleAreaFeeChange(area, e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded text-sm text-right bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                                placeholder=""
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : feeType === 'size' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  サイズ別送料（円）税込
                </label>
                <p className="text-xs text-gray-500 mb-4">
                  写真の料金表と同じ形式で入力できます。サイズと重量の組み合わせごとに地域別送料を設定してください。
                </p>
                {isNew && (
                  <div className="mb-3 flex items-center gap-2">
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm"
                    >
                      <option value="">（任意）既存の送料表をコピーして入力を埋める</option>
                      {shippingTemplates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={applyTemplate}
                      disabled={!selectedTemplateId}
                      className="px-3 py-2 text-sm bg-gray-900 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800"
                    >
                      コピー
                    </button>
                  </div>
                )}

                {/* サイズを追加していく（バリエーション風） */}
                <div className="mb-3 flex items-center gap-2">
                  <select
                    value={sizeToAdd}
                    onChange={(e) => setSizeToAdd(Number(e.target.value))}
                    className="p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm"
                  >
                    {availableSizes.map((s) => (
                      <option key={s} value={s}>
                        {s}サイズ
                      </option>
                    ))}
                    {availableSizes.length === 0 && (
                      <option value={sizeToAdd}>追加できるサイズはありません</option>
                    )}
                  </select>
                  <button
                    type="button"
                    onClick={addSizeRow}
                    disabled={availableSizes.length === 0}
                    className="px-3 py-2 text-sm bg-gray-100 text-gray-900 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
                  >
                    サイズを追加
                  </button>
                  <span className="text-xs text-gray-500">表に表示するサイズだけ追加できます</span>
                </div>

                {enabledSizes.length === 0 ? (
                  <div className="text-sm text-gray-500 py-6 text-center border border-gray-200 rounded-lg bg-white">
                    「サイズを追加」から表示したいサイズを追加してください
                  </div>
                ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full min-w-max text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 border-r border-gray-200 whitespace-nowrap">
                          サイズ
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 border-r border-gray-200 whitespace-nowrap">
                          重量
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 border-r border-gray-200 whitespace-nowrap">
                          1箱に入る数
                        </th>
                        {AREA_KEYS.map((area) => (
                          <th
                            key={area}
                            className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap"
                          >
                            <AreaLabelCell area={area} />
                          </th>
                        ))}
                        <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {enabledSizes.map((size) => {
                        const weight = SIZE_WEIGHT_MAP[size];
                        const sizeFee = getSizeFee(size, weight);
                        const maxItemsValue =
                          sizeFee?.max_items_per_box !== undefined && sizeFee?.max_items_per_box !== null && sizeFee.max_items_per_box !== 0
                            ? sizeFee.max_items_per_box
                            : '';
                        return (
                          <tr key={size} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-sm font-medium text-gray-900 border-r border-gray-200 text-center whitespace-nowrap bg-gray-50">
                              {size}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-700 border-r border-gray-200 text-center whitespace-nowrap">
                              {weight}kg以内
                            </td>
                            <td className="px-2 py-1 border-r border-gray-200">
                              <input
                                type="number"
                                min={1}
                                step={1}
                                value={maxItemsValue}
                                onChange={(e) => handleSizeMaxItemsChange(size, e.target.value)}
                                className="w-24 p-1.5 border border-gray-300 rounded text-xs text-right bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                                placeholder=""
                              />
                              <span className="ml-1 text-xs text-gray-500">個</span>
                            </td>
                            {AREA_KEYS.map((area) => {
                              const feeValue = sizeFee?.area_fees?.[area];
                              // 0の場合は空欄を表示
                              const displayValue =
                                feeValue !== undefined && feeValue !== null && feeValue !== 0 ? feeValue : '';
                              return (
                                <td key={`${size}_${weight}_${area}`} className="px-2 py-1">
                                  <input
                                    type="number"
                                    value={displayValue}
                                    onChange={(e) => handleSizeFeeChange(size, weight, area, e.target.value)}
                                    className="w-full min-w-[60px] p-1.5 border border-gray-300 rounded text-xs text-right bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                                    placeholder=""
                                  />
                                </td>
                              );
                            })}
                            <td className="px-2 py-1 text-center">
                              <button
                                type="button"
                                onClick={() => removeSizeRow(size)}
                                className="text-xs text-gray-500 hover:text-red-600"
                              >
                                削除
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  ※ 写真の料金表をそのまま入力できます。空欄の場合は0円として扱われます。
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {/* 商品選択 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                この発送方法を使う商品を選択
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                検索: {filteredProducts.length}件 / 全{products.length}件
              </p>
            </div>
            <div className="w-full max-w-xs">
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm"
                placeholder="商品名 or SKUで検索（例：コシヒカリ）"
              />
            </div>
          </div>
          {productsLoading ? (
            <div className="text-center py-8 text-gray-500">読み込み中...</div>
          ) : (
            <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 w-12">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={(e) => {
                          const filteredIds = new Set(filteredProducts.map((p) => p.id));
                          if (e.target.checked) {
                            setSelectedProductIds((prev) => {
                              const merged = new Set(prev);
                              filteredIds.forEach((id) => merged.add(id));
                              return Array.from(merged);
                            });
                            return;
                          }
                          setSelectedProductIds((prev) => prev.filter((id) => !filteredIds.has(id)));
                        }}
                        className="w-4 h-4 rounded border-gray-300 bg-white text-black focus:ring-black focus:ring-2"
                      />
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">商品名</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">SKU</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">価格</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className={`hover:bg-gray-50 cursor-pointer ${
                        selectedProductIds.includes(product.id) ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleProductToggle(product.id)}
                    >
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(product.id)}
                          onChange={() => handleProductToggle(product.id)}
                          className="w-4 h-4 rounded border-gray-300 bg-white text-black focus:ring-black focus:ring-2"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">{product.title}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">{product.sku || '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-right">
                        ¥{product.price?.toLocaleString() || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {products.length === 0 ? (
                <div className="text-center py-8 text-gray-500">商品が登録されていません</div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">検索条件に一致する商品がありません</div>
              ) : null}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2">
            選択した商品にこの発送方法が適用されます
          </p>
        </div>

        {/* 保存ボタン */}
        <div className="flex items-center justify-end gap-4">
          <Link to="/admin/shipping-methods">
            <a className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              キャンセル
            </a>
          </Link>
          <LoadingButton
            type="submit"
            loading={saving}
            className="px-6 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            {isNew ? '作成' : '更新'}
          </LoadingButton>
        </div>
      </form>
    </div>
  );
};

export default ShippingMethodEditor;

