import { createClient } from '@supabase/supabase-js';
import { Product } from '../types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('Supabase環境変数が設定されていません。.env.local で NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY を設定してください。');
  }
}

export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Database型定義
export interface DatabaseProduct {
  id: string;
  title: string;
  price: number;
  image: string | null;
  images: string[] | null;
  sold_out: boolean;
  handle: string;
  category: string;
  subcategory: string | null;
  categories?: string[] | null;
  subcategories?: string[] | null;
  description: string | null;
  has_variants: boolean; // 種類選択の有無
  variants: string[] | null; // 選択肢リスト
  variants_config: any; // 新しいバリエーション設定 (JSONB)
  status: 'active' | 'draft' | 'archived';
  stock: number | null;
  sku: string | null;
  is_active: boolean;
  display_order: number | null;
  is_visible: boolean | null;
  is_free_shipping: boolean | null;
  sale_start_at: string | null;
  sale_end_at: string | null;
  created_at: string;
  updated_at: string;
}

// Database型をProduct型に変換
export const convertDatabaseProductToProduct = (dbProduct: DatabaseProduct): Product => {
  const hasVariantsFromConfig =
    Array.isArray(dbProduct.variants_config) && dbProduct.variants_config.length > 0;
  return {
    id: dbProduct.id,
    title: dbProduct.title,
    price: dbProduct.price,
    image: dbProduct.image || '',
    images: dbProduct.images || [],
    soldOut: dbProduct.sold_out,
    handle: dbProduct.handle,
    category: dbProduct.category,
    subcategory: dbProduct.subcategory || undefined,
    categories: (dbProduct as any).categories || undefined,
    subcategories: (dbProduct as any).subcategories || undefined,
    description: dbProduct.description || undefined,
    // has_variants がfalseでも variants_config が入っているケースに対応
    hasVariants: dbProduct.has_variants || hasVariantsFromConfig,
    variants: dbProduct.variants || [],
    variants_config: dbProduct.variants_config || [],
    sku: dbProduct.sku || undefined,
    stock: dbProduct.stock || 0,
    display_order: dbProduct.display_order ?? undefined,
    is_visible: dbProduct.is_visible ?? true,
    isFreeShipping: dbProduct.is_free_shipping ?? false,
    saleStartAt: (dbProduct as any).sale_start_at ?? undefined,
    saleEndAt: (dbProduct as any).sale_end_at ?? undefined,
  };
};

/** サーバー/クライアント用: handle で商品1件取得。active を優先し、なければ status 問わず取得。見つからなければ null */
export async function getProductByHandle(handle: string): Promise<Product | null> {
  if (!supabase) return null;
  let { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('handle', handle)
    .eq('status', 'active')
    .single();
  if (error?.code === 'PGRST116') {
    const res = await supabase.from('products').select('*').eq('handle', handle).single();
    data = res.data;
    error = res.error;
  }
  if (error && error.code !== 'PGRST116') return null;
  if (!data) return null;
  const converted = convertDatabaseProductToProduct(data as DatabaseProduct);
  return {
    ...converted,
    variants_config: (data as any).variants_config ?? converted.variants_config,
  } as Product;
}

// Product型をDatabase型に変換
export const convertProductToDatabaseProduct = (product: Partial<Product> & { status?: 'active' | 'draft' | 'archived', is_active?: boolean }) => {
  const hasVariantsFromConfig =
    Array.isArray((product as any).variants_config) && (product as any).variants_config.length > 0;
  const isVariantProduct = Boolean((product as any).hasVariants || hasVariantsFromConfig);
  return {
    title: product.title,
    price: product.price,
    image: product.image || null,
    images: product.images || null,
    sold_out: product.soldOut || false,
    handle: product.handle,
    category: product.category,
    subcategory: product.subcategory || null,
    categories: (product as any).categories || null,
    subcategories: (product as any).subcategories || null,
    description: product.description || null,
    has_variants: product.hasVariants || false,
    variants: product.variants || null,
    variants_config: product.variants_config || null,
    status: product.status || 'active',
    // ガード: バリエーション有りの商品は基本在庫(stock)を0に固定
    stock: isVariantProduct ? 0 : (product.stock || 0),
    sku: product.sku || null,
    is_active: product.is_active ?? true,
    display_order: product.display_order ?? null,
    is_visible: product.is_visible ?? true,
    sale_start_at: (product as any).saleStartAt ?? null,
    sale_end_at: (product as any).saleEndAt ?? null,
  };
};

// Profile型定義
export interface Profile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  postal_code: string | null;
  prefecture?: string | null;
  address: string | null;
  city: string | null;
  building?: string | null;
  country: string | null;
  created_at: string;
  updated_at: string;
}

// プロフィール情報を取得
export const getProfile = async (userId: string): Promise<Profile | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('プロフィール取得エラー:', error);
    return null;
  }

  return data as Profile;
};

// プロフィール情報を更新
export const updateProfile = async (
  userId: string,
  profileData: Partial<Profile>
): Promise<Profile | null> => {
  if (!supabase) return null;

  // 基本フィールドのみを更新（prefectureとbuildingは存在する場合のみ）
  const updateData: any = {
    email: profileData.email,
    first_name: profileData.first_name,
    last_name: profileData.last_name,
    phone: profileData.phone,
    postal_code: profileData.postal_code,
    address: profileData.address,
    city: profileData.city,
    country: profileData.country || 'JP',
    updated_at: new Date().toISOString(),
  };

  // prefectureとbuildingが存在する場合のみ追加（既存DBとの互換性のため）
  if ((profileData as any).prefecture !== undefined) {
    updateData.prefecture = (profileData as any).prefecture || null;
  }
  if ((profileData as any).building !== undefined) {
    updateData.building = (profileData as any).building || null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('プロフィール更新エラー:', error);
    console.error('更新データ:', updateData);
    // エラーの詳細をログに出力
    if (error.code === '42703') {
      console.error('カラムが存在しません。マイグレーションが必要です。');
    }
    return null;
  }

  return data as Profile;
};

// 注文履歴を取得
export interface Order {
  id: string;
  order_number: string | null;
  payment_intent_id?: string | null;
  total: number;
  payment_status: string;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  product?: {
    title: string;
    image: string | null;
    images: string[] | null;
    handle: string | null;
  };
}

export const getOrders = async (userId: string): Promise<Order[]> => {
  if (!supabase) return [];

  console.log('[getOrders] userId:', userId);

  // まず、auth_user_idで注文を取得（支払い済みのみ）
  const { data: ordersData, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .eq('auth_user_id', userId)
    .eq('payment_status', 'paid')
    .order('created_at', { ascending: false });

  if (ordersError) {
    console.error('注文履歴取得エラー (orders):', ordersError);
    return [];
  }

  console.log('[getOrders] 取得した注文数:', ordersData?.length || 0);
  
  // デバッグ: 取得した注文のpayment_statusを確認
  if (ordersData && ordersData.length > 0) {
    console.log('[getOrders] 取得した注文のpayment_status:', ordersData.map((o: any) => ({
      id: o.id,
      order_number: o.order_number,
      payment_status: o.payment_status
    })));
  }

  if (!ordersData || ordersData.length === 0) {
    console.log('[getOrders] 注文が見つかりませんでした');
    return [];
  }

  // 旧バグ等で同一 payment_intent_id の注文が複数作られている場合に備えて、表示上は1件にまとめる
  // ordersData は created_at desc なので「最初に出てくるもの＝最新」を採用する
  const uniqueByKey = new Map<string, any>();
  for (const o of ordersData as any[]) {
    const key = o.payment_intent_id || o.id;
    if (!uniqueByKey.has(key)) {
      uniqueByKey.set(key, o);
    }
  }
  const uniqueOrdersData = Array.from(uniqueByKey.values());

  // 各注文のorder_itemsを取得（productsテーブルとのJOINは行わない）
  const orderIds = uniqueOrdersData.map(order => order.id);
  const { data: orderItemsData, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .in('order_id', orderIds);

  if (itemsError) {
    console.error('注文履歴取得エラー (order_items):', itemsError);
    // order_itemsの取得に失敗しても、注文情報は返す
  }

  console.log('[getOrders] 取得した注文明細数:', orderItemsData?.length || 0);

  // 注文IDごとにorder_itemsをグループ化
  const itemsByOrderId: Record<string, any[]> = {};
  (orderItemsData || []).forEach((item: any) => {
    if (!itemsByOrderId[item.order_id]) {
      itemsByOrderId[item.order_id] = [];
    }
    itemsByOrderId[item.order_id].push(item);
  });

  console.log('[getOrders] 注文データ:', ordersData);
  console.log('[getOrders] 注文明細データ:', itemsByOrderId);

  // データを整形（念のため、支払い済みのみをフィルタリング）
  return (uniqueOrdersData || [])
    .filter((order: any) => order.payment_status === 'paid')
    .map((order: any) => {
      const orderItems = itemsByOrderId[order.id] || [];
      return {
        id: order.id,
        order_number: order.order_number,
        payment_intent_id: order.payment_intent_id ?? null,
        total: order.total,
        payment_status: order.payment_status,
        created_at: order.created_at,
        updated_at: order.updated_at,
        order_items: orderItems.map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.product_price || (item.line_total ? item.line_total / item.quantity : 0) || 0, // product_price または line_totalから計算
        product: {
          title: item.product_title || '商品情報なし',
          image: item.product_image || null,
          images: item.product_image ? [item.product_image] : null,
          handle: null, // handleはproduct_idから取得できないためnull
        },
        variant: item.variant,
        selected_options: item.selected_options,
      })),
    };
  });
};

// 在庫チェック用のユーティリティ関数
/**
 * 選択されたバリエーションから在庫数を取得
 * @param product 商品情報
 * @param selectedOptions 選択されたバリエーションオプション（Type ID -> Option ID）
 * @returns 在庫数（nullの場合は無制限）
 */
export const getStockForVariant = (product: Product, selectedOptions: Record<string, string>): number | null => {
  // バリエーションがない場合
  if (!product.hasVariants) {
    return product.stock ?? null;
  }

  // 新しいvariants_configがある場合
  if (product.variants_config && product.variants_config.length > 0) {
    let minStock: number | null = null;
    const baseStock = product.stock ?? null;

    // 各バリエーションタイプを確認し、在庫の最小値を採用
    for (const type of product.variants_config) {
      const selectedOptionId = selectedOptions[type.id];
      if (!selectedOptionId) continue;

      const option = type.options.find(o => o.id === selectedOptionId);
      if (!option) continue;

      if (type.stockManagement === 'none') {
        // 在庫管理しない場合はスキップ
        continue;
      } else if (type.stockManagement === 'individual' || type.stockManagement === 'shared') {
        // 在庫共有が有効な場合
        if (type.sharedStock !== null && type.sharedStock !== undefined) {
          const sharedStockValue = Number(type.sharedStock);
          minStock = minStock === null ? sharedStockValue : Math.min(minStock, sharedStockValue);
        } else {
          // 個別在庫の場合: 数値が設定されていれば候補に含める（0も有効な在庫）
          if (option.stock !== null && option.stock !== undefined) {
            const stockValue = Number(option.stock);
            minStock = minStock === null ? stockValue : Math.min(minStock, stockValue);
          }
          // null/undefined は在庫管理しないオプションとして無視
        }
      }
    }

    // いずれかで在庫が決まった場合はその最小値、決まらない場合は基本在庫
    return minStock !== null ? minStock : baseStock;
  }

  // 旧形式のvariantsがある場合（基本在庫を使用）
  return product.stock ?? null;
};

/**
 * 在庫チェック
 * @param product 商品情報
 * @param selectedOptions 選択されたバリエーションオプション
 * @param requestedQuantity 追加したい数量
 * @param currentCartQuantity カート内の既存数量（同じ商品・バリエーション）
 * @returns { available: boolean, availableStock: number | null, message: string }
 */
export const checkStockAvailability = (
  product: Product,
  selectedOptions: Record<string, string>,
  requestedQuantity: number,
  currentCartQuantity: number = 0
): { available: boolean; availableStock: number | null; message: string } => {
  // バリエーションが無効な場合は在庫チェックをスキップ（無制限）
  if (!product.hasVariants) {
    return {
      available: true,
      availableStock: null,
      message: ''
    };
  }
  const stock = getStockForVariant(product, selectedOptions);

  // 在庫がnullの場合は無制限として扱う
  if (stock === null) {
    return {
      available: true,
      availableStock: null,
      message: ''
    };
  }

  const totalQuantity = currentCartQuantity + requestedQuantity;

  if (totalQuantity > stock) {
    const availableQuantity = Math.max(0, stock - currentCartQuantity);
    return {
      available: false,
      availableStock: stock,
      message: availableQuantity > 0
        ? `在庫が不足しています。追加可能な数量は${availableQuantity}個です。`
        : '在庫が不足しています。'
    };
  }

  return {
    available: true,
    availableStock: stock,
    message: ''
  };
};
