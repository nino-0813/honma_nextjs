export interface Product {
  id: string;
  title: string;
  price: number;
  image: string; // Main image
  images: string[]; // Gallery images
  soldOut: boolean;
  handle: string;
  category: string;
  subcategory?: string; // サブカテゴリー (koshihikari, kamenoo, nikomaru, yearly など)
  categories?: string[]; // カテゴリー（複数選択対応）
  subcategories?: string[]; // サブカテゴリー（複数選択対応）
  description?: string;
  hasVariants?: boolean; // 種類選択を表示するかどうか
  variants?: string[]; // 選択肢のリスト（旧仕様）
  variants_config?: { // 新仕様
    id: string;
    name: string;
    options: {
      id: string;
      value: string;
      priceAdjustment: number;
      stock: number | null;
    }[];
    stockManagement: 'shared' | 'individual' | 'none';
    sharedStock?: number | null; // 在庫共有時の共有在庫数
  }[];
  sku?: string;
  stock?: number;
  display_order?: number; // 表示順序
  is_visible?: boolean; // 表示/非表示
  isFreeShipping?: boolean; // 送料無料フラグ
  saleStartAt?: string | null; // 販売開始日時 (ISO)
  saleEndAt?: string | null; // 販売終了日時 (ISO)
}

export interface Collection {
  id: string;
  title: string;
  image: string;
  imageMobile?: string; // モバイル用軽量版（レスポンシブ）
  imageMobile600?: string; // 小型モバイル用600px版
  imageMobile400?: string; // 超小型モバイル用400px版
  handle: string;
  path?: string;
  backgroundImage?: string; // 水彩背景画像
  bagImage?: string; // 米袋画像
  description?: string[]; // 説明文の配列
  subtitle?: string; // サブタイトル
}

export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  variant?: string; // 選択された種類
  finalPrice?: number; // バリエーション価格調整後の最終価格（カート追加時に固定）
  selectedOptions?: Record<string, string>; // 選択したオプション（在庫チェック用）
}

export interface Review {
  id: string;
  name: string;
  type?: string; // 注文タイプ（3回目の注文など）
  date: string;
  rating: number;
  comment: string;
  productName: string;
  image?: string;
  is_verified?: boolean; // 購入者かどうか
}

export interface EmailLog {
  id: string;
  to_email: string;
  subject: string;
  body: string;
  sent_at: string;
  status: 'sent' | 'failed';
  error_message?: string;
}

export interface Customer {
  id: string; // profile_id or order_id based logic
  name: string;
  email: string;
  phone?: string;
  orders_count: number;
  total_spent: number;
  last_order_date?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

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

export interface Profile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  postal_code: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  created_at: string;
  updated_at: string;
  is_admin?: boolean;
}

// 発送方法の地域別送料（画像の料金表に合わせた地域区分）
export interface AreaFees {
  hokkaido?: number;           // 北海道
  north_tohoku?: number;       // 北東北（青森、秋田、岩手）
  south_tohoku?: number;       // 南東北（宮城、山形、福島）
  kanto?: number;              // 関東（茨城、栃木、群馬、埼玉、千葉、神奈川、山梨、東京）
  shinetsu?: number;           // 信越（新潟、長野）
  hokuriku?: number;           // 北陸（富山、石川、福井）
  chubu?: number;              // 中部（静岡、愛知、三重、岐阜）
  kansai?: number;             // 関西（大阪、京都、滋賀、奈良、和歌山、兵庫）
  chugoku?: number;            // 中国（岡山、広島、山口、鳥取、島根）
  shikoku?: number;            // 四国（香川、徳島、愛媛、高知）
  kyushu?: number;             // 九州（福岡、佐賀、長崎、熊本、大分、宮崎、鹿児島）
  okinawa?: number;            // 沖縄
}

// サイズ別送料（サイズと重量の組み合わせ）
export interface SizeFee {
  size: number;                // サイズ（60, 80, 100, 120, 140）
  weight_kg: number;           // 重量上限（2, 5, 10, 15, 20）
  area_fees: AreaFees;         // 地域別送料
  max_items_per_box?: number | null; // このサイズで1箱に入る最大商品数（発送量）
}

export interface SizeFees {
  [key: string]: SizeFee;      // key: "size_weight" (例: "60_2", "80_5")
}

// 発送方法
export interface ShippingMethod {
  id: string;
  name: string;                    // 発送方法名（例：米用ダンボールM）
  box_size: number | null;         // ダンボールサイズ（60 / 80 / 100 / 120 / 140）
  max_weight_kg: number | null;   // 最大重量（kg）
  max_items_per_box: number | null; // 1箱に入る最大商品数（発送量）
  fee_type: 'uniform' | 'area' | 'size'; // 送料タイプ（全国一律 / 地域別 / サイズ別）
  area_fees: AreaFees;            // 地域別送料（JSON形式、fee_typeが'area'の場合）
  size_fees?: SizeFees;            // サイズ別送料（JSON形式、fee_typeが'size'の場合）
  uniform_fee?: number;           // 全国一律送料（fee_typeが'uniform'の場合）
  created_at: string;
  updated_at: string;
}

// 商品と発送方法の紐づけ
export interface ProductShippingMethod {
  id: string;
  product_id: string;
  shipping_method_id: string;
  created_at: string;
}
