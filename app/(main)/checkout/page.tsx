'use client';

import { FormEvent, useContext, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { CartContext } from '@/providers/CartProvider';
import { supabase } from '@/lib/supabase';
import type { AreaFees, ShippingMethod } from '@/types';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

type CheckoutFormProps = {
  clientSecret: string;
  total: number;
  name: string;
  email?: string;
  disabled?: boolean;
};

const AREA_KEY_COMPAT: Record<string, string> = {
  north_tohoku: 'kitatohoku',
  south_tohoku: 'minamitohoku',
  kanto: 'kanto_area',
  chubu: 'chubu_area',
  kansai: 'kansai_area',
  chugoku: 'chugoku_area',
  shikoku: 'shikoku_area',
  kyushu: 'kyushu_area',
  okinawa: 'okinawa_area',
  kitatohoku: 'north_tohoku',
  minamitohoku: 'south_tohoku',
  kanto_area: 'kanto',
  chubu_area: 'chubu',
  kansai_area: 'kansai',
  chugoku_area: 'chugoku',
  shikoku_area: 'shikoku',
  kyushu_area: 'kyushu',
  okinawa_area: 'okinawa',
};

const getAreaFromPrefecture = (prefecture: string): string | null => {
  if (!prefecture) return null;
  if (prefecture === '北海道') return 'hokkaido';
  if (['青森県', '秋田県', '岩手県'].includes(prefecture)) return 'kitatohoku';
  if (['宮城県', '山形県', '福島県'].includes(prefecture)) return 'minamitohoku';
  if (['東京都', '神奈川県', '山梨県', '千葉県', '茨城県', '栃木県', '群馬県', '埼玉県'].includes(prefecture)) return 'kanto_area';
  if (['新潟県', '長野県'].includes(prefecture)) return 'shinetsu';
  if (['富山県', '石川県', '福井県'].includes(prefecture)) return 'hokuriku';
  if (['静岡県', '愛知県', '三重県', '岐阜県'].includes(prefecture)) return 'chubu_area';
  if (['大阪府', '京都府', '滋賀県', '奈良県', '和歌山県', '兵庫県'].includes(prefecture)) return 'kansai_area';
  if (['岡山県', '広島県', '山口県', '鳥取県', '島根県'].includes(prefecture)) return 'chugoku_area';
  if (['香川県', '徳島県', '愛媛県', '高知県'].includes(prefecture)) return 'shikoku_area';
  if (['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県'].includes(prefecture)) return 'kyushu_area';
  if (prefecture === '沖縄県') return 'okinawa_area';
  return null;
};

const getAreaFee = (fees: AreaFees | Record<string, number> | null | undefined, areaKey: string | null): number => {
  if (!fees || !areaKey) return 0;
  const direct = (fees as any)[areaKey];
  if (direct != null) return Number(direct) || 0;
  const compat = AREA_KEY_COMPAT[areaKey];
  const alt = compat ? (fees as any)[compat] : null;
  return alt != null ? Number(alt) || 0 : 0;
};

const calcMethodCost = (method: ShippingMethod, quantity: number, areaKey: string | null): number => {
  if (method.fee_type === 'uniform') {
    const fee = Number(method.uniform_fee || 0);
    if (fee <= 0) return 0;
    const cap = Number(method.max_items_per_box || 0);
    return cap > 0 ? Math.ceil(quantity / cap) * fee : fee;
  }
  if (method.fee_type === 'area') {
    const fee = getAreaFee(method.area_fees, areaKey);
    if (fee <= 0) return 0;
    const cap = Number(method.max_items_per_box || 0);
    return cap > 0 ? Math.ceil(quantity / cap) * fee : fee;
  }
  const sizeFees = method.size_fees || {};
  let min = Infinity;
  for (const sf of Object.values(sizeFees as any)) {
    const perBox = getAreaFee((sf as any).area_fees, areaKey);
    const cap = Math.max(1, Number((sf as any).max_items_per_box || 1));
    if (perBox <= 0) continue;
    const total = Math.ceil(quantity / cap) * perBox;
    if (total < min) min = total;
  }
  return Number.isFinite(min) ? min : 0;
};

function StripeCheckoutForm({ clientSecret, total, name, email, disabled }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);
    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || '決済情報の確認に失敗しました。');
        return;
      }

      const { error: paymentError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
          payment_method_data: {
            billing_details: {
              name,
              email,
            },
          },
        },
      });

      if (paymentError) {
        setError(paymentError.message || '決済処理に失敗しました。');
      }
    } catch (err: any) {
      setError(err?.message || '決済処理中にエラーが発生しました。');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="border border-gray-200 p-5 rounded">
        <h3 className="text-sm font-medium mb-4">お支払い方法</h3>
        <PaymentElement />
      </div>
      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded">{error}</div>}
      <button
        type="submit"
        disabled={!stripe || !elements || submitting || disabled}
        className="w-full py-4 bg-primary text-white text-sm tracking-widest uppercase hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? '処理中...' : `¥${total.toLocaleString()} を支払う`}
      </button>
    </form>
  );
}

export default function CheckoutPage() {
  const { cartItems } = useContext(CartContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [prefecture, setPrefecture] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [postalSearching, setPostalSearching] = useState(false);
  const [postalError, setPostalError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [creatingIntent, setCreatingIntent] = useState(false);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [shippingMethodMap, setShippingMethodMap] = useState<Record<string, string[]>>({});
  const [shippingError, setShippingError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + (item.finalPrice ?? item.product.price) * item.quantity, 0),
    [cartItems]
  );
  useEffect(() => {
    const loadShippingData = async () => {
      if (!supabase || cartItems.length === 0) return;
      const productIds = [...new Set(cartItems.map((item) => item.product.id))];
      const [{ data: methods }, { data: links }] = await Promise.all([
        supabase.from('shipping_methods').select('*'),
        supabase
          .from('product_shipping_methods')
          .select('product_id, shipping_method_id')
          .in('product_id', productIds),
      ]);

      setShippingMethods((methods || []) as ShippingMethod[]);
      const map: Record<string, string[]> = {};
      (links || []).forEach((l: any) => {
        if (!map[l.product_id]) map[l.product_id] = [];
        map[l.product_id].push(l.shipping_method_id);
      });
      setShippingMethodMap(map);
    };
    loadShippingData();
  }, [cartItems]);

  const shippingResult = useMemo(() => {
    if (cartItems.length === 0) return { cost: 0, error: null as string | null };
    const areaKey = getAreaFromPrefecture(prefecture);
    let sum = 0;
    let err: string | null = null;

    for (const item of cartItems) {
      if (item.product.isFreeShipping) continue;
      const ids = shippingMethodMap[item.product.id] || [];
      const candidates = shippingMethods.filter((m) => ids.includes(m.id));
      if (candidates.length === 0) {
        err = `「${item.product.title}」の発送方法が設定されていません。`;
        break;
      }
      const costs = candidates
        .map((m) => calcMethodCost(m, item.quantity, areaKey))
        .filter((c) => c > 0);
      if (costs.length === 0) {
        err = `「${item.product.title}」の送料を計算できません。`;
        break;
      }
      sum += Math.min(...costs);
    }

    return { cost: sum, error: err };
  }, [cartItems, shippingMethodMap, shippingMethods, prefecture]);

  const shipping = shippingResult.cost;

  const getCartItemVariantLabel = (item: (typeof cartItems)[number]): string | undefined => {
    if (item.variant && String(item.variant).trim()) return String(item.variant).trim();
    const selected = item.selectedOptions || {};

    if (item.product.variants_config && item.product.variants_config.length > 0) {
      const parts = item.product.variants_config
        .map((type) => {
          const selectedOptionId = selected[type.id];
          if (!selectedOptionId) return null;
          const option = type.options.find((o) => o.id === selectedOptionId);
          return option?.value || null;
        })
        .filter((v): v is string => Boolean(v && String(v).trim()));
      if (parts.length > 0) return parts.join(' / ');
    }

    if ((selected as any).legacy_migration) {
      const legacyOption = item.product.variants?.find((v) => String(v) === String((selected as any).legacy_migration));
      if (legacyOption) return legacyOption;
    }
    if ((selected as any).legacy) return String((selected as any).legacy);
    return undefined;
  };

  useEffect(() => {
    setShippingError(shippingResult.error);
  }, [shippingResult]);

  const total = subtotal + shipping;
  const canPay =
    Boolean(name.trim()) &&
    Boolean(email.trim()) &&
    Boolean(postalCode.replace(/[^0-9]/g, '').length === 7) &&
    Boolean(prefecture.trim()) &&
    Boolean(city.trim()) &&
    Boolean(address.trim()) &&
    !shippingError;

  const handlePostalSearch = async () => {
    const zip = postalCode.replace(/[^0-9]/g, '');
    if (zip.length !== 7) {
      setPostalError('郵便番号は7桁で入力してください。');
      return;
    }
    setPostalSearching(true);
    setPostalError(null);
    try {
      const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zip}`);
      const data = await res.json();
      if (!data?.results?.[0]) throw new Error('住所が見つかりませんでした。');
      const result = data.results[0];
      setPrefecture(result.address1 || '');
      setCity(`${result.address2 || ''}${result.address3 || ''}`);
    } catch (err: any) {
      setPostalError(err?.message || '郵便番号検索に失敗しました。');
    } finally {
      setPostalSearching(false);
    }
  };

  useEffect(() => {
    const createPaymentIntent = async () => {
      if (total <= 0 || !stripePromise) return;
      setCreatingIntent(true);
      setIntentError(null);
      try {
        const res = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: total,
            currency: 'jpy',
            metadata: { source: 'next_checkout' },
          }),
        });

        const data = await res.json();
        if (!res.ok || !data?.clientSecret) {
          throw new Error(data?.error || 'PaymentIntentの作成に失敗しました。');
        }
        setClientSecret(data.clientSecret);
      } catch (err: any) {
        setIntentError(err?.message || '決済の初期化に失敗しました。');
      } finally {
        setCreatingIntent(false);
      }
    };

    createPaymentIntent();
  }, [total]);

  if (cartItems.length === 0) {
    return (
      <div className="pt-28 pb-24 min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-6 md:px-12 text-center">
          <h1 className="text-xl md:text-2xl font-serif tracking-[0.15em] font-normal mb-6">CHECKOUT</h1>
          <div className="w-12 h-px bg-primary mx-auto mb-8" />
          <p className="text-gray-600 mb-8">カートに商品がありません。</p>
          <Link
            href="/collections"
            className="inline-block border border-primary text-primary px-6 py-3 text-sm tracking-widest hover:bg-primary hover:text-white transition-colors"
          >
            商品一覧へ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <h1 className="text-xl md:text-2xl font-serif tracking-[0.15em] font-normal mb-6 text-center">CHECKOUT</h1>
        <div className="w-12 h-px bg-primary mx-auto mb-10" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <section>
            <h2 className="text-base tracking-wider mb-4">ご注文内容</h2>
            <div className="border border-gray-200 rounded divide-y divide-gray-100">
              {cartItems.map((item) => (
                <div key={`${item.product.id}-${item.variant || ''}`} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{item.product.title}</p>
                    {getCartItemVariantLabel(item) ? (
                      <p className="text-xs text-gray-500">種類: {getCartItemVariantLabel(item)}</p>
                    ) : null}
                    <p className="text-xs text-gray-500">数量: {item.quantity}</p>
                  </div>
                  <p className="text-sm">¥{((item.finalPrice ?? item.product.price) * item.quantity).toLocaleString()}</p>
                </div>
              ))}
              <div className="p-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">小計</span>
                  <span>¥{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">送料</span>
                  <span>¥{shipping.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium border-t border-gray-100 pt-2">
                  <span>合計</span>
                  <span>¥{total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base tracking-wider mb-4">購入者情報</h2>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs text-gray-600 mb-1">お名前</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-gray-600"
                  placeholder="山田 太郎"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">メールアドレス</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-gray-600"
                  placeholder="example@mail.com"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">郵便番号</label>
                <div className="flex gap-2">
                  <input
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-gray-600"
                    placeholder="123-4567"
                  />
                  <button
                    type="button"
                    onClick={handlePostalSearch}
                    disabled={postalSearching}
                    className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50 whitespace-nowrap"
                  >
                    {postalSearching ? '検索中' : '住所検索'}
                  </button>
                </div>
                {postalError && <p className="text-xs text-red-600 mt-1">{postalError}</p>}
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">都道府県</label>
                <input
                  value={prefecture}
                  onChange={(e) => setPrefecture(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-gray-600"
                  placeholder="東京都"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">市区町村</label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-gray-600"
                  placeholder="渋谷区"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">町名・番地</label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-gray-600"
                  placeholder="1-2-3"
                />
              </div>
            </div>

            {creatingIntent && <p className="text-sm text-gray-500">決済フォームを準備中...</p>}
            {intentError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded">{intentError}</p>}
            {shippingError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded mb-3">{shippingError}</p>}
            {!canPay && !shippingError && (
              <p className="text-xs text-gray-500 mb-3">お名前・メール・配送先住所を入力すると決済できます。</p>
            )}
            {clientSecret && stripePromise && (
              <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                <StripeCheckoutForm
                  clientSecret={clientSecret}
                  total={total}
                  name={name.trim() || 'IKEVEGE Customer'}
                  email={email.trim() || undefined}
                  disabled={!canPay}
                />
              </Elements>
            )}
          </section>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
          <Link
            href="/collections"
            className="inline-block border border-primary text-primary px-6 py-3 text-sm tracking-widest hover:bg-primary hover:text-white transition-colors"
          >
            商品一覧へ
          </Link>
          <Link
            href="/contact"
            className="inline-block bg-primary text-white px-6 py-3 text-sm tracking-widest hover:bg-gray-800 transition-colors"
          >
            お問い合わせ
          </Link>
        </div>
      </div>
    </div>
  );
}
