import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { IconArrowLeft, IconUpload, IconLoader2, IconTrash, IconX, IconPlus, IconCalendar } from '../../components/Icons';
import { convertImageToWebP } from '../../lib/imageUtils';
import { LoadingButton } from '../../components/UI';
import { ShippingMethod } from '../../types';

const CATEGORIES = [
  { id: 'お米', name: 'お米', subcategories: ['コシヒカリ', '亀の尾', 'にこまる', '年間契約'] },
  { id: 'Crescentmoon', name: 'Crescentmoon', subcategories: [] },
  { id: 'その他', name: 'その他', subcategories: [] }
];

type VariationOption = {
  id: string;
  value: string;
  priceAdjustment: number;
  stock: number | null;
};

type VariationType = {
  id: string;
  name: string;
  options: VariationOption[];
  stockManagement: 'shared' | 'individual' | 'none';
  sharedStock?: number | null; // 在庫共有時の共有在庫数
};

const ProductEditor = () => {
  const params = useParams<{ handle?: string }>();
  const routeParam = params?.handle;
  const isNew = !routeParam || routeParam === 'new';
  // UUID形式ならIDで検索、そうでなければhandleで検索（管理者はIDで遷移するため）
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(routeParam || '');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!isNew);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [categories, setCategories] = useState<string[]>(['お米']);
  const [subcategories, setSubcategories] = useState<string[]>(['コシヒカリ']);
  const [description, setDescription] = useState('');
  const [handle, setHandle] = useState('');
  const [stock, setStock] = useState('0');
  const [sku, setSku] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [isFreeShipping, setIsFreeShipping] = useState(false);
  const [saleStartAt, setSaleStartAt] = useState('');
  const [saleEndAt, setSaleEndAt] = useState('');
  const [stockValidationError, setStockValidationError] = useState<string>('');
  
  // Variants
  const [hasVariants, setHasVariants] = useState(false);
  const [variationTypes, setVariationTypes] = useState<VariationType[]>([]);

  // ガード: バリエーション有りの場合は基本在庫(stock)を常に0に固定
  useEffect(() => {
    if (hasVariants) {
      setStock('0');
    }
  }, [hasVariants]);

  // Images
  const [images, setImages] = useState<string[]>([]);

  // Shipping Methods
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedShippingMethodIds, setSelectedShippingMethodIds] = useState<string[]>([]);

  // Fetch shipping methods
  useEffect(() => {
    fetchShippingMethods();
  }, []);

  // Fetch existing product
  useEffect(() => {
    if (!isNew && routeParam) {
      fetchProduct(routeParam, isUuid);
    } else if (isNew) {
      // Initialize with one empty variation type if new and hasVariants is toggled
      setVariationTypes([
        {
          id: Math.random().toString(36).substr(2, 9),
          name: '種類',
          options: [],
          stockManagement: 'shared',
          sharedStock: null
        }
      ]);
    }
  }, [routeParam, isNew, isUuid]);

  // Category/Subcategory multi-select guard
  useEffect(() => {
    // keep at least one category
    if (!categories || categories.length === 0) {
      setCategories(['お米']);
      return;
    }

    const riceSubs = CATEGORIES.find(c => c.id === 'お米')?.subcategories || [];
    const riceSelected = categories.includes('お米');

    if (!riceSelected) {
      if (subcategories.length > 0) setSubcategories([]);
      return;
    }

    // rice selected: ensure subcategories only contains valid ones
    const next = subcategories.filter(s => riceSubs.includes(s));
    if (next.length === 0) {
      setSubcategories([riceSubs[0] || 'コシヒカリ']);
    } else if (next.length !== subcategories.length) {
      setSubcategories(next);
      }
  }, [categories]);

  const fetchShippingMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('shipping_methods')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setShippingMethods((data || []) as ShippingMethod[]);
    } catch (error) {
      console.error('発送方法の取得エラー:', error);
    }
  };

  const fetchProduct = async (idOrHandle: string, byId: boolean = false) => {
    try {
      setInitialLoading(true);
      const query = supabase.from('products').select('*');
      const { data, error } = await (byId ? query.eq('id', idOrHandle) : query.eq('handle', idOrHandle)).single();

      if (error) throw error;

      if (data) {
        setTitle(data.title);
        setPrice(data.price.toString());
        const loadedCategories = Array.isArray(data.categories) && data.categories.length > 0
          ? data.categories
          : (data.category ? [data.category] : ['お米']);
        const loadedSubcategories = Array.isArray(data.subcategories) && data.subcategories.length > 0
          ? data.subcategories
          : (data.subcategory ? [data.subcategory] : []);
        setCategories(loadedCategories);
        setSubcategories(loadedSubcategories);
        setDescription(data.description || '');
        setHandle(data.handle);
        setStock(data.stock?.toString() || '0');
        setSku(data.sku || '');
        setIsActive(data.is_active ?? true);
        setIsVisible(data.is_visible ?? (data.is_active ?? true));
        setIsFreeShipping(data.is_free_shipping ?? false);
        const toDatetimeLocal = (iso: string | null) => {
          if (!iso) return '';
          const d = new Date(iso);
          if (isNaN(d.getTime())) return '';
          const pad = (n: number) => String(n).padStart(2, '0');
          return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        };
        setSaleStartAt(toDatetimeLocal(data.sale_start_at));
        setSaleEndAt(toDatetimeLocal(data.sale_end_at));
        // has_variants が false でも variants_config が入っているケースに対応
        const hasVariantsFromConfig = Array.isArray(data.variants_config) && data.variants_config.length > 0;
        const hasVariantsFromLegacy = Array.isArray(data.variants) && data.variants.length > 0;
        const computedHasVariants = Boolean(data.has_variants || hasVariantsFromConfig || hasVariantsFromLegacy);
        setHasVariants(computedHasVariants);

        // DBガード: バリエーション有りの商品は products.stock を0に補正（古いデータの残り対策）
        if (computedHasVariants && data.id && (data.stock ?? 0) !== 0) {
          try {
            await supabase
              .from('products')
              .update({ stock: 0 })
              .eq('id', data.id);
            setStock('0');
          } catch (e) {
            console.warn('products.stock の自動補正に失敗:', e);
          }
        }
        
        // Load variants config or migrate from old format
        if (data.variants_config && Array.isArray(data.variants_config) && data.variants_config.length > 0) {
          setVariationTypes(data.variants_config);
        } else if (data.variants && data.variants.length > 0) {
          // Migration from old format
          setVariationTypes([{
            id: 'legacy_migration',
            name: '種類',
            options: data.variants.map((v: string) => ({
              id: Math.random().toString(36).substr(2, 9),
              value: v,
              priceAdjustment: 0,
              stock: null
            })),
            stockManagement: 'shared',
            sharedStock: null
          }]);
        } else {
          setVariationTypes([{
            id: Math.random().toString(36).substr(2, 9),
            name: '種類',
            options: [],
            stockManagement: 'shared',
            sharedStock: null
          }]);
        }
        
        if (data.images && Array.isArray(data.images) && data.images.length > 0) {
          setImages(data.images);
        } else if (data.image) {
          setImages([data.image]);
        }

        // Load shipping methods for this product
        const { data: linkedMethods, error: linkError } = await supabase
          .from('product_shipping_methods')
          .select('shipping_method_id')
          .eq('product_id', data.id);

        if (!linkError && linkedMethods) {
          setSelectedShippingMethodIds(linkedMethods.map((m: any) => m.shipping_method_id));
        }
      }
    } catch (error) {
      console.error('商品取得エラー:', error);
      alert('商品の取得に失敗しました');
      navigate('/admin/products');
    } finally {
      setInitialLoading(false);
    }
  };

  const uploadImageToStorage = async (file: File): Promise<string> => {
    const webpFile = await convertImageToWebP(file);
    const fileName = `${Math.random().toString(36).substring(2)}.webp`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, webpFile, {
        cacheControl: 'public, max-age=31536000, immutable',
        upsert: true,
        contentType: 'image/webp',
      });

    if (uploadError) {
      console.error('画像アップロードエラー:', uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map((file) => uploadImageToStorage(file as File));
      const newImageUrls = await Promise.all(uploadPromises);
      
      setImages(prev => [...prev, ...newImageUrls]);
    } catch (error) {
      alert('画像のアップロードに失敗しました。');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const setAsMainImage = (index: number) => {
    if (index === 0) return;
    setImages(prev => {
      const newImages = [...prev];
      const [movedImage] = newImages.splice(index, 1);
      newImages.unshift(movedImage);
      return newImages;
    });
  };

  // Variation Logic
  const addVariationType = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setVariationTypes([...variationTypes, {
      id: newId,
      name: '種類',
      options: [{
      id: Math.random().toString(36).substr(2, 9),
        value: '',
        priceAdjustment: 0,
        stock: null
      }],
      stockManagement: 'shared',
      sharedStock: null
    }]);
  };

  const removeVariationType = (typeId: string) => {
    setVariationTypes(variationTypes.filter(vt => vt.id !== typeId));
  };

  const updateVariationType = (typeId: string, field: keyof VariationType, value: any) => {
    const newVariationTypes = variationTypes.map(vt => 
      vt.id === typeId ? { ...vt, [field]: value } : vt
    );
    
    setVariationTypes(newVariationTypes);
    
    // 在庫管理方法が変更された場合の処理（基本在庫は使用しない）
    if (field === 'stockManagement') {
      // バリデーションは不要（基本在庫との比較がないため）
      setStockValidationError('');
    }
  };

  const addOption = (typeId: string) => {
    setVariationTypes(variationTypes.map(vt => {
      if (vt.id === typeId) {
        return {
          ...vt,
          options: [...vt.options, {
            id: Math.random().toString(36).substr(2, 9),
            value: '',
            priceAdjustment: 0,
            stock: null
          }]
        };
      }
      return vt;
    }));
  };

  const updateOption = (typeId: string, optionId: string, field: keyof VariationOption, value: any) => {
    const newVariationTypes = variationTypes.map(vt => {
      if (vt.id === typeId) {
        return {
          ...vt,
          options: vt.options.map(opt => 
            opt.id === optionId ? { ...opt, [field]: value } : opt
          )
        };
      }
      return vt;
    });
    
    setVariationTypes(newVariationTypes);
    
    // 在庫フィールドが変更された場合の処理（基本在庫は使用しない）
    if (field === 'stock') {
      // バリデーションは不要（基本在庫との比較がないため）
      setStockValidationError('');
    }
  };
  
  // バリエーション在庫の合計を計算（引数でタイプを指定可能）
  // 在庫数がnullの場合は計算から除外（在庫管理が不要なバリエーション用）
  // 0の場合は有効な在庫数として含める
  const calculateTotalVariantStockForTypes = (types: VariationType[]): number => {
    let total = 0;
    for (const vt of types) {
      if (vt.stockManagement === 'individual') {
        for (const opt of vt.options) {
          // nullまたはundefinedの場合はスキップ（在庫管理が不要なバリエーション）
          // 0以上の数値は有効な在庫数として合計に含める
          if (opt.stock !== null && opt.stock !== undefined && opt.stock >= 0) {
            total += opt.stock;
          }
        }
      }
    }
    return total;
  };

  const removeOption = (typeId: string, optionId: string) => {
    const newVariationTypes = variationTypes.map(vt => {
      if (vt.id === typeId) {
        return {
          ...vt,
          options: vt.options.filter(opt => opt.id !== optionId)
        };
      }
      return vt;
    });
    
    setVariationTypes(newVariationTypes);
    
    // 基本在庫は使用しないため、バリデーションは不要
    setStockValidationError('');
  };

  // バリエーション在庫の合計を計算
  const calculateTotalVariantStock = (): number => {
    if (!hasVariants || variationTypes.length === 0) {
      return 0;
    }

    let total = 0;
    for (const vt of variationTypes) {
      if (vt.stockManagement === 'individual') {
        // バリエーションごとに設定されている場合、各オプションの在庫を合計
        for (const opt of vt.options) {
          if (opt.stock !== null && opt.stock !== undefined) {
            total += opt.stock;
          }
        }
      }
      // 'shared'の場合は基本在庫を使用するため、合計には含めない
    }
    return total;
  };

  // 在庫バリデーション（基本在庫は使用しないため、常に空文字列を返す）
  const validateStock = (newStock: string, newVariationTypes?: VariationType[]): string => {
    // 基本在庫との比較は不要（基本在庫を使用しない）
    return '';
  };

  const handleSubmit = async () => {
    if (!title || !price || !handle) {
      alert('必須項目を入力してください（商品名、価格、ハンドル）');
      return;
    }

    // Validate variations
    if (hasVariants) {
      for (const vt of variationTypes) {
        if (!vt.name) {
          alert('バリエーション名を入力してください');
          return;
        }
        if (vt.options.length === 0) {
          alert(`バリエーション「${vt.name}」の選択肢を追加してください`);
          return;
        }
        for (const opt of vt.options) {
          if (!opt.value) {
            alert(`バリエーション「${vt.name}」の選択肢名を入力してください`);
            return;
          }
        }
      }
    }

    try {
      setLoading(true);
      
      // Legacy variants array for compatibility
      const legacyVariants = hasVariants && variationTypes.length > 0
        ? variationTypes[0].options.map(o => o.value)
        : [];

      const productData = {
        title,
        price: Number(price),
        // legacy fields (互換性): 先頭要素を保存
        category: categories[0] || 'お米',
        subcategory: subcategories[0] || null,
        // new fields: 複数選択
        categories: categories,
        subcategories: subcategories,
        description,
        handle,
        stock: 0, // 基本在庫は使用しないため、常に0として保存
        sku: sku || null,
        is_active: isActive,
        is_visible: isActive, // is_activeとis_visibleを連動
        is_free_shipping: isFreeShipping,
        status: isActive ? 'active' : 'draft', // statusも連動
        has_variants: hasVariants,
        variants: legacyVariants, // Only first variation type options for legacy
        variants_config: hasVariants ? variationTypes : [], // Full config
        image: images.length > 0 ? images[0] : null,
        images: images,
        sale_start_at: saleStartAt ? new Date(saleStartAt).toISOString() : null,
        sale_end_at: saleEndAt ? new Date(saleEndAt).toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      let productId: string;
      let error;
      if (isNew) {
        const { data: insertedData, error: insertError } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();
        error = insertError;
        productId = insertedData?.id;
      } else {
        // Get product ID first (routeParam が UUID の場合は id で、そうでなければ handle で検索)
        const existingQuery = supabase.from('products').select('id');
        const { data: existingProduct } = await (isUuid ? existingQuery.eq('id', routeParam) : existingQuery.eq('handle', routeParam)).single();
        
        productId = existingProduct?.id;

        const updateQuery = supabase.from('products').update(productData);
        const { error: updateError } = await (isUuid ? updateQuery.eq('id', routeParam) : updateQuery.eq('handle', routeParam));
        error = updateError;
      }

      if (error) throw error;

      // Save shipping method associations
      if (productId) {
        // Delete existing associations
        await supabase
          .from('product_shipping_methods')
          .delete()
          .eq('product_id', productId);

        // Insert new associations
        if (selectedShippingMethodIds.length > 0) {
          const links = selectedShippingMethodIds.map((methodId) => ({
            product_id: productId,
            shipping_method_id: methodId,
          }));

          const { error: linkError } = await supabase
            .from('product_shipping_methods')
            .insert(links);

          if (linkError) {
            console.error('発送方法の紐づけエラー:', linkError);
            // Don't throw - product is saved, just the link failed
          }
        }
      }

      alert('商品を保存しました');
      navigate('/admin/products');

    } catch (error: any) {
      console.error('保存エラー:', error);
      alert(`保存に失敗しました: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <IconLoader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/admin/products">
            <a className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
              <IconArrowLeft className="w-5 h-5" />
            </a>
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">
            {isNew ? '新規商品追加' : '商品編集'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin/products">
            <a className="text-sm text-gray-500 hover:text-gray-900 transition-colors px-4 py-2">キャンセル</a>
          </Link>
          <LoadingButton 
            onClick={handleSubmit} 
            loading={loading || uploading}
            className="bg-black text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-all shadow-sm hover:shadow"
          >
            {loading ? '保存中...' : '保存する'}
          </LoadingButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-slide-up">
             <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">商品名 <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all bg-white"
                    placeholder="例: 自然栽培 コシヒカリ 5kg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">商品説明</label>
                  <textarea 
                    rows={8}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black resize-y text-sm bg-white"
                    placeholder="商品の特徴や魅力を入力してください..."
                  />
                </div>
             </div>
          </div>

          {/* New Variations UI */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-slide-up" style={{ animationDelay: '150ms' }}>
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-base font-medium text-gray-900">バリエーション設定</h3>
               <label className="relative inline-flex items-center cursor-pointer">
                 <input 
                   type="checkbox" 
                   checked={hasVariants} 
                   onChange={(e) => setHasVariants(e.target.checked)} 
                   className="sr-only peer" 
                 />
                 <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                 <span className="ml-3 text-sm font-medium text-gray-700">有効にする</span>
               </label>
             </div>
             
             {hasVariants && (
               <div className="space-y-8 animate-fade-in">
                 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                   <p className="text-sm text-blue-800">
                     <strong>使い方:</strong> 「バリエーションタイプを追加」をクリックすると、デフォルトで1つの選択肢が追加されます。選択肢名を入力し、「+ 選択肢を追加」で追加の選択肢を追加できます。
                   </p>
                   <p className="text-sm text-blue-800 mt-2">
                     <strong>在庫管理:</strong> 「基本在庫を共有」は簡単（基本在庫から減算）、「バリエーションごとに設定」は各選択肢ごとに在庫を設定できます（基本在庫は自動計算されます）。
                   </p>
                 </div>
                 {variationTypes.map((vt, vtIndex) => (
                   <div key={vt.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 relative">
                     <button 
                       onClick={() => removeVariationType(vt.id)}
                       className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                     >
                       <IconTrash className="w-4 h-4" />
                     </button>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                       <div>
                         <label className="block text-xs font-medium text-gray-500 mb-1">バリエーション名 (例: 種類, 包装)</label>
                         <input 
                           type="text" 
                           value={vt.name}
                           onChange={(e) => updateVariationType(vt.id, 'name', e.target.value)}
                           className="w-full p-2 border border-gray-300 rounded text-sm bg-white"
                           placeholder="種類"
                         />
                       </div>
                       <div>
                         <label className="block text-xs font-medium text-gray-500 mb-1">在庫管理</label>
                         <select 
                           value={vt.stockManagement}
                           onChange={(e) => updateVariationType(vt.id, 'stockManagement', e.target.value)}
                           className="w-full p-2 border border-gray-300 rounded text-sm bg-white"
                         >
                           <option value="none">在庫管理しない</option>
                           <option value="individual">在庫設定をする</option>
                         </select>
                         {vt.stockManagement === 'individual' && (
                           <p className="text-[10px] text-blue-600 mt-1">
                             各選択肢の在庫数を設定できます。
                           </p>
                         )}
                         {vt.stockManagement === 'none' && (
                           <p className="text-[10px] text-gray-500 mt-1">
                             このバリエーションでは在庫管理を行いません。
                           </p>
                         )}
                       </div>
                     </div>

                     <div className="space-y-2">
                       <div className="text-xs font-medium text-gray-500 flex gap-4 px-2">
                         <span className="flex-1">選択肢名</span>
                         <span className="w-24 text-right">追加価格</span>
                         {vt.stockManagement === 'individual' && vt.sharedStock === null && (
                           <span className="w-24 text-right">
                             在庫数
                             <span className="block text-[10px] text-gray-400 font-normal mt-0.5">
                               (合計: {vt.options.reduce((sum, o) => sum + (o.stock ?? 0), 0)})
                             </span>
                           </span>
                         )}
                         {vt.stockManagement === 'individual' && vt.sharedStock !== null && (
                           <span className="w-24 text-right">
                             在庫数
                             <span className="block text-[10px] text-gray-400 font-normal mt-0.5">
                               (共有: {vt.sharedStock ?? 0})
                             </span>
                           </span>
                         )}
                         <span className="w-8"></span>
                       </div>
                       {vt.options.map((opt) => (
                         <div key={opt.id} className="flex gap-4 items-center">
                           <input 
                             type="text" 
                             value={opt.value}
                             onChange={(e) => updateOption(vt.id, opt.id, 'value', e.target.value)}
                             className="flex-1 p-2 border border-gray-300 rounded text-sm bg-white"
                             placeholder="例: 玄米"
                           />
                           <div className="w-24 relative">
                             <input 
                               type="number" 
                               value={opt.priceAdjustment}
                               onChange={(e) => updateOption(vt.id, opt.id, 'priceAdjustment', Number(e.target.value))}
                               className="w-full p-2 border border-gray-300 rounded text-sm text-right pr-6 bg-white"
                             />
                             <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">円</span>
                           </div>
                           {vt.stockManagement === 'individual' && vt.sharedStock === null && (
                             <div className="w-24">
                               <input 
                                 type="number" 
                                 value={opt.stock ?? ''}
                                 onChange={(e) => {
                                   const newValue = e.target.value === '' ? null : Number(e.target.value);
                                   updateOption(vt.id, opt.id, 'stock', newValue);
                                 }}
                                 className={`w-full p-2 border rounded text-sm text-right bg-white ${
                                   stockValidationError ? 'border-red-500' : 'border-gray-300'
                                 }`}
                                 placeholder="0"
                                 min="0"
                               />
                               <p className="text-[10px] text-gray-400 mt-0.5 text-right">在庫不要なら空欄</p>
                             </div>
                           )}
                           {vt.stockManagement === 'individual' && vt.sharedStock !== null && (
                             <div className="w-24 text-center text-sm text-gray-500">
                               共有在庫
                             </div>
                           )}
                           <button 
                             onClick={() => removeOption(vt.id, opt.id)}
                             className="w-8 flex justify-center text-gray-400 hover:text-red-500"
                           >
                             <IconX className="w-4 h-4" />
                           </button>
                         </div>
                       ))}
                       <button 
                         onClick={() => addOption(vt.id)}
                         className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium mt-2"
                       >
                         <IconPlus className="w-4 h-4" />
                         選択肢を追加
                       </button>
                       
                       {/* 在庫共有設定（在庫設定をするを選んだ場合のみ表示） */}
                       {vt.stockManagement === 'individual' && (
                         <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-end gap-4">
                           <label className="flex items-center gap-2 text-sm text-gray-700">
                             <input
                               type="checkbox"
                               checked={vt.sharedStock !== null && vt.sharedStock !== undefined}
                               onChange={(e) => {
                                 if (e.target.checked) {
                                   // 在庫共有を有効にする（デフォルト値は0）
                                   updateVariationType(vt.id, 'sharedStock', 0);
                                 } else {
                                   // 在庫共有を無効にする
                                   updateVariationType(vt.id, 'sharedStock', null);
                                 }
                               }}
                               className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                             />
                             <span>在庫共有をする</span>
                           </label>
                           {vt.sharedStock !== null && vt.sharedStock !== undefined && (
                             <div className="flex items-center gap-2">
                               <label className="text-sm text-gray-700">共有在庫数:</label>
                               <input
                                 type="number"
                                 value={vt.sharedStock ?? 0}
                                 onChange={(e) => {
                                   const newValue = e.target.value === '' ? 0 : Number(e.target.value);
                                   updateVariationType(vt.id, 'sharedStock', newValue);
                                 }}
                                 className="w-24 p-2 border border-gray-300 rounded text-sm text-right bg-white"
                                 placeholder="0"
                                 min="0"
                               />
                               <span className="text-sm text-gray-500">個</span>
                             </div>
                           )}
                         </div>
                       )}
                     </div>
                   </div>
                 ))}
                 
                 <button 
                   onClick={addVariationType}
                   className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center gap-2"
                 >
                   <IconPlus className="w-4 h-4" />
                   バリエーションタイプを追加
                 </button>
               </div>
             )}
          </div>

          {/* Media */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-slide-up" style={{ animationDelay: '100ms' }}>
             <h3 className="text-base font-medium text-gray-900 mb-4 flex items-center justify-between">
               <span>商品画像</span>
               <span className="text-xs text-gray-500 font-normal">ドラッグ＆ドロップで追加可能</span>
             </h3>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
               {images.map((imgUrl, index) => (
                 <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                   <img src={imgUrl} alt={`商品画像 ${index + 1}`} className="w-full h-full object-contain" />
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                     <button 
                       onClick={() => removeImage(index)}
                       className="p-1.5 bg-white rounded-full text-red-500 hover:bg-red-50 transition-colors"
                       title="削除"
                     >
                       <IconTrash className="w-4 h-4" />
                     </button>
                     {index !== 0 && (
                       <button
                         onClick={() => setAsMainImage(index)}
                         className="px-2 py-1 bg-white rounded text-xs font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                       >
                         メインにする
                       </button>
                     )}
                   </div>
                   {index === 0 && (
                     <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm">
                       MAIN
                     </div>
                   )}
                 </div>
               ))}
               <label className={`border-2 border-dashed border-gray-300 rounded-lg aspect-square hover:bg-gray-50 transition-colors cursor-pointer group flex flex-col items-center justify-center ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                 <input
                   type="file"
                   accept="image/*"
                   multiple
                   onChange={handleImageUpload}
                   className="hidden"
                   disabled={uploading}
                 />
                 {uploading ? (
                   <IconLoader2 className="w-6 h-6 text-gray-400 animate-spin" />
                 ) : (
                   <>
                     <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2 group-hover:bg-white group-hover:shadow-sm transition-all">
                       <IconUpload className="w-5 h-5 text-gray-400 group-hover:text-black" />
                     </div>
                     <span className="text-xs text-gray-500 group-hover:text-gray-900">追加</span>
                   </>
                 )}
               </label>
             </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-slide-up" style={{ animationDelay: '200ms' }}>
             <h3 className="text-base font-medium text-gray-900 mb-4">基本価格と基本在庫</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">基本価格 <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                    <input 
                      type="number" 
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full pl-7 p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all bg-white"
                      placeholder="0"
                      required
                    />
                  </div>
                  {hasVariants && <p className="text-xs text-gray-500 mt-1">バリエーションごとの追加価格がここに加算されます。</p>}
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU (商品番号)</label>
                  <input 
                    type="text" 
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all bg-white"
                    placeholder=""
                  />
               </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-slide-up" style={{ animationDelay: '300ms' }}>
             <h3 className="text-base font-medium text-gray-900 mb-4">公開状態</h3>
             <select 
               value={isActive ? 'active' : 'draft'}
               onChange={(e) => {
                 const newIsActive = e.target.value === 'active';
                 setIsActive(newIsActive);
                 setIsVisible(newIsActive); // is_visibleも連動
               }}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-sm bg-white"
             >
               <option value="active">販売中</option>
               <option value="draft">非公開 (下書き)</option>
             </select>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-slide-up" style={{ animationDelay: '350ms' }}>
             <h3 className="text-base font-medium text-gray-900 mb-4 flex items-center gap-2">
               <IconCalendar className="w-5 h-5 text-gray-500" />
               販売期間
             </h3>
             <p className="text-xs text-gray-500 mb-3">設定すると、この期間内のみ注文できます。未設定の場合は常時注文可能です。</p>
             <div className="space-y-4">
               <div>
                 <label className="block text-xs font-medium text-gray-700 mb-1">販売開始日時</label>
                 <input
                   type="datetime-local"
                   value={saleStartAt}
                   onChange={(e) => setSaleStartAt(e.target.value)}
                   className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm bg-white"
                 />
               </div>
               <div>
                 <label className="block text-xs font-medium text-gray-700 mb-1">販売終了日時</label>
                 <input
                   type="datetime-local"
                   value={saleEndAt}
                   onChange={(e) => setSaleEndAt(e.target.value)}
                   className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm bg-white"
                 />
               </div>
             </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-slide-up" style={{ animationDelay: '400ms' }}>
             <h3 className="text-base font-medium text-gray-900 mb-4">商品分類</h3>
             <div className="space-y-4">
               <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">カテゴリー</label>
                  <div className="space-y-2">
                    {CATEGORIES.map(c => {
                      const checked = categories.includes(c.id);
                      return (
                        <label key={c.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setCategories(prev => {
                                const next = checked ? prev.filter(x => x !== c.id) : [...prev, c.id];
                                // prevent empty
                                return next.length > 0 ? next : prev;
                              });
                            }}
                            className="rounded border-gray-300 text-black focus:ring-black bg-white"
                          />
                          <span className="text-gray-800">{c.name}</span>
                        </label>
                      );
                    })}
                    <p className="text-[11px] text-gray-500">
                      複数選択できます（例：お米＋その他）
                    </p>
                  </div>
               </div>
               
               {categories.includes('お米') && (
                 <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">サブカテゴリー</label>
                   <div className="grid grid-cols-2 gap-2">
                     {CATEGORIES.find(c => c.id === 'お米')!.subcategories.map(sub => {
                       const checked = subcategories.includes(sub);
                       return (
                         <label key={sub} className="flex items-center gap-2 text-sm">
                           <input
                             type="checkbox"
                             checked={checked}
                             onChange={() => {
                               setSubcategories(prev => {
                                 const next = checked ? prev.filter(x => x !== sub) : [...prev, sub];
                                 return next.length > 0 ? next : prev; // keep at least one when rice selected
                               });
                             }}
                             className="rounded border-gray-300 text-black focus:ring-black bg-white"
                           />
                           <span className="text-gray-800">{sub}</span>
                         </label>
                       );
                     })}
                   </div>
                   <p className="text-[11px] text-gray-500 mt-2">
                     複数選択できます（例：コシヒカリ＋年間契約）
                   </p>
                 </div>
               )}

               <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">ハンドル (URL末尾) <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-sm bg-white"
                    placeholder="例: koshihikari-5kg"
                    required
                  />
               </div>
             </div>
          </div>

          {/* 送料無料設定 */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-slide-up" style={{ animationDelay: '450ms' }}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-medium text-gray-900 mb-1">送料無料</h3>
                <p className="text-xs text-gray-500">この商品を送料無料にする</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFreeShipping}
                  onChange={(e) => setIsFreeShipping(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>

          {/* 発送方法選択 */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-slide-up" style={{ animationDelay: '500ms' }}>
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-base font-medium text-gray-900">発送方法</h3>
               <Link to="/admin/shipping-methods">
                 <a className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
                   管理画面で設定
                 </a>
               </Link>
             </div>
             <div className="space-y-2 max-h-64 overflow-y-auto">
               {shippingMethods.length === 0 ? (
                 <div className="text-sm text-gray-500 py-4 text-center">
                   発送方法が登録されていません
                   <br />
                   <Link to="/admin/shipping-methods/new">
                     <a className="text-blue-600 hover:underline mt-1 inline-block">
                       新規作成
                     </a>
                   </Link>
                 </div>
               ) : (
                 shippingMethods.map((method) => (
                   <label
                     key={method.id}
                     className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                   >
                     <input
                       type="checkbox"
                       checked={selectedShippingMethodIds.includes(method.id)}
                       onChange={(e) => {
                         if (e.target.checked) {
                           setSelectedShippingMethodIds([...selectedShippingMethodIds, method.id]);
                         } else {
                           setSelectedShippingMethodIds(selectedShippingMethodIds.filter(id => id !== method.id));
                         }
                       }}
                       className="rounded border-gray-300 text-black focus:ring-black"
                     />
                     <div className="flex-1">
                       <div className="text-sm font-medium text-gray-900">{method.name}</div>
                       <div className="text-xs text-gray-500">
                         {method.box_size && `${method.box_size}サイズ`}
                         {method.max_items_per_box && ` / 1箱${method.max_items_per_box}個まで`}
                       </div>
                     </div>
                   </label>
                 ))
               )}
             </div>
             <p className="text-xs text-gray-500 mt-2">
               複数の発送方法を選択できます（例：常温便 / クール便）
             </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductEditor;