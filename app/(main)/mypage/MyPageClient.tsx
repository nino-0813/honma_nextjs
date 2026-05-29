'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase, getProfile, updateProfile, getOrders, Order, Profile } from '@/lib/supabase';
import { FadeInImage, LoadingButton } from '@/components/UI';
import AuthForm from '@/components/AuthForm';
import {
  SUBSCRIPTION_INTERVAL_LABELS,
  SubscriptionInterval,
  EventMileTransaction,
  EVENT_MILE_TYPE_LABELS,
} from '@/types';
import { getEventMileBalance, getEventMileTransactions } from '@/lib/eventMiles';
import { computeNextShippingDate, formatJapaneseDate } from '@/lib/subscriptionShipping';

interface SubscriptionRow {
  id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  email: string;
  status: string;
  interval: string;
  next_billing_at: string | null;
  canceled_at: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
}

interface SubscriptionItemView {
  product_id: string | null;
  product_title: string;
  product_image: string | null;
  product_price: number;
  quantity: number;
}

const SUBSCRIPTION_STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  active: { label: '有効', cls: 'bg-green-100 text-green-700' },
  trialing: { label: '次回発送待ち', cls: 'bg-blue-100 text-blue-700' },
  past_due: { label: '支払い遅延', cls: 'bg-red-100 text-red-700' },
  unpaid: { label: '未払い', cls: 'bg-red-100 text-red-700' },
  canceled: { label: '解約済み', cls: 'bg-gray-100 text-gray-600' },
  incomplete: { label: '処理中', cls: 'bg-yellow-100 text-yellow-700' },
  incomplete_expired: { label: '期限切れ', cls: 'bg-gray-100 text-gray-600' },
  paused: { label: '一時停止', cls: 'bg-yellow-100 text-yellow-700' },
};

const PREFECTURES = [
  '北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県',
  '茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県',
  '新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県',
  '静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県',
  '奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県',
  '徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県',
  '熊本県','大分県','宮崎県','鹿児島県','沖縄県',
];

const PREFECTURE_REGEX = new RegExp(`(${PREFECTURES.join('|')})`);

const MyPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  // 定期購入の商品情報（stripe_subscription_id -> [items]）
  const [subscriptionItems, setSubscriptionItems] = useState<Record<string, SubscriptionItemView[]>>({});
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [syncingSubscriptions, setSyncingSubscriptions] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'subscriptions' | 'miles' | 'profile'>('orders');
  const [mileBalance, setMileBalance] = useState<number>(0);
  const [mileTransactions, setMileTransactions] = useState<EventMileTransaction[]>([]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const [isSignUpSuccess, setIsSignUpSuccess] = useState(false);

  useEffect(() => {
    const tab = searchParams?.get('tab');
    if (tab === 'orders') setActiveTab('orders');
    if (tab === 'subscriptions') setActiveTab('subscriptions');
    if (tab === 'miles') setActiveTab('miles');
    if (tab === 'profile') setActiveTab('profile');
  }, [searchParams]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    postalCode: '',
    prefecture: '',
    city: '',
    address: '',
    building: '',
    country: 'JP',
  });

  const [postalCodeSearching, setPostalCodeSearching] = useState(false);
  const [postalCodeError, setPostalCodeError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    const signUpSuccessFlag =
      typeof window !== 'undefined' ? localStorage.getItem('signUpSuccess') : null;
    if (signUpSuccessFlag === 'true') {
      setIsSignUpSuccess(true);
      setLoading(false);
      return;
    }

    checkAuth();

    const welcomeFlag =
      typeof window !== 'undefined' ? localStorage.getItem('showWelcomeMessage') : null;
    if (welcomeFlag === 'true') {
      setShowWelcomeMessage(true);
      localStorage.removeItem('showWelcomeMessage');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    try {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session) {
        setLoading(false);
        return;
      }

      setUser(session.user);
      await loadUserData(session.user.id);
    } catch (error) {
      console.error('認証チェックエラー:', error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = async (_email: string, userData: any) => {
    setUser(userData);
    if (userData?.id) {
      await loadUserData(userData.id);
    }
  };

  const splitProfileAddress = (p: Profile | null) => {
    if (!p) {
      return { prefecture: '', building: '', city: '', address: '' };
    }
    let prefecture = (p as any).prefecture || '';
    const building = (p as any).building || '';
    let city = p.city || '';
    let address = p.address || '';

    if (!prefecture && address) {
      const m = address.match(PREFECTURE_REGEX);
      if (m) {
        prefecture = m[1];
        address = address.replace(prefecture, '').trim();
      }
    }
    if (city && address && address.startsWith(city)) {
      address = address.replace(city, '').trim();
    }
    if (prefecture && address) {
      address = address.replace(new RegExp(prefecture, 'g'), '').trim();
    }
    return { prefecture, building, city, address };
  };

  const loadUserData = async (userId: string) => {
    try {
      const [profileData, ordersData] = await Promise.all([getProfile(userId), getOrders(userId)]);

      if (profileData) {
        setProfile(profileData);
        const { prefecture, building, city, address } = splitProfileAddress(profileData);
        setFormData({
          firstName: profileData.first_name || '',
          lastName: profileData.last_name || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          postalCode: profileData.postal_code || '',
          prefecture,
          city,
          address,
          building,
          country: profileData.country || 'JP',
        });
      }

      setOrders(ordersData);

      // 定期購入を取得
      if (supabase) {
        const { data: subs } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('auth_user_id', userId)
          .order('created_at', { ascending: false });
        const subsRows = (subs ?? []) as SubscriptionRow[];
        setSubscriptions(subsRows);

        // 各定期購入の元注文(orders)から定期購入アイテム(order_items)を引いて商品情報をまとめる
        try {
          const subIds = subsRows.map((s) => s.stripe_subscription_id).filter(Boolean);
          if (subIds.length > 0) {
            // 最初の注文を取得 (subscription_id + created_at asc で最古を1件)
            const { data: ordersForSubs } = await supabase
              .from('orders')
              .select('id, stripe_subscription_id, created_at')
              .in('stripe_subscription_id', subIds)
              .order('created_at', { ascending: true });
            // subscription_id -> 最古のorder.id を構築
            const firstOrderBySub: Record<string, string> = {};
            (ordersForSubs ?? []).forEach((o: any) => {
              if (!firstOrderBySub[o.stripe_subscription_id]) {
                firstOrderBySub[o.stripe_subscription_id] = o.id;
              }
            });
            const orderIds = Object.values(firstOrderBySub);
            if (orderIds.length > 0) {
              const { data: itemsData } = await supabase
                .from('order_items')
                .select('order_id, product_id, product_title, product_image, product_price, quantity, is_subscription')
                .in('order_id', orderIds);
              const itemsByOrderId: Record<string, any[]> = {};
              (itemsData ?? []).forEach((it: any) => {
                if (!itemsByOrderId[it.order_id]) itemsByOrderId[it.order_id] = [];
                itemsByOrderId[it.order_id].push(it);
              });
              const result: Record<string, SubscriptionItemView[]> = {};
              for (const [subId, orderId] of Object.entries(firstOrderBySub)) {
                const items = (itemsByOrderId[orderId] || []).filter((it: any) => it.is_subscription);
                result[subId] = items.map((it: any) => ({
                  product_id: it.product_id,
                  product_title: it.product_title || '商品',
                  product_image: it.product_image || null,
                  product_price: Number(it.product_price || 0),
                  quantity: Number(it.quantity || 1),
                }));
              }
              setSubscriptionItems(result);
            }
          }
        } catch (e) {
          console.warn('定期購入の商品情報取得失敗:', e);
        }
      }

      // イベントマイル残高 + 履歴
      try {
        const [balance, txns] = await Promise.all([
          getEventMileBalance(userId),
          getEventMileTransactions(userId, 50),
        ]);
        setMileBalance(balance);
        setMileTransactions(txns);
      } catch (e) {
        console.warn('イベントマイル取得失敗:', e);
      }
    } catch (error) {
      console.error('データ読み込みエラー:', error);
    }
  };

  const handleSyncSubscriptions = async () => {
    if (!supabase || !user?.id) return;
    try {
      setSyncingSubscriptions(true);
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) throw new Error('セッションが切れています');
      const res = await fetch('/api/sync-subscription', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || '同期に失敗しました');
      }
      await loadUserData(user.id);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || '同期に失敗しました');
    } finally {
      setSyncingSubscriptions(false);
    }
  };

  const handleCancelSubscription = async (stripeSubscriptionId: string) => {
    if (!supabase) return;
    const confirmed = window.confirm(
      '定期購入をキャンセルしますか？\n現在のサイクルの配送は予定通り行われ、その後の自動更新が停止します。'
    );
    if (!confirmed) return;

    try {
      setCancelingId(stripeSubscriptionId);
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) throw new Error('セッションが切れています。再度ログインしてください。');

      const res = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          subscription_id: stripeSubscriptionId,
          cancel_at_period_end: true,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'キャンセルに失敗しました');
      }
      alert('定期購入のキャンセルを受け付けました。');
      // 再読込
      if (user?.id) await loadUserData(user.id);
    } catch (e: any) {
      console.error('キャンセルエラー:', e);
      alert(e?.message || 'キャンセルに失敗しました');
    } finally {
      setCancelingId(null);
    }
  };

  const handlePostalCodeSearch = async () => {
    if (!formData.postalCode) {
      setPostalCodeError('郵便番号を入力してください');
      return;
    }
    if (formData.prefecture && formData.city) {
      setPostalCodeError(null);
      return;
    }

    setPostalCodeSearching(true);
    setPostalCodeError(null);

    try {
      const cleaned = formData.postalCode.replace(/[^0-9]/g, '');
      if (cleaned.length !== 7) {
        setPostalCodeError('郵便番号は7桁で入力してください');
        setPostalCodeSearching(false);
        return;
      }
      const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${cleaned}`);
      const data = await response.json();

      if (data.status === 200 && data.results && data.results.length > 0) {
        const result = data.results[0];
        setFormData((prev) => ({
          ...prev,
          prefecture: result.address1 || '',
          city: result.address2 || '',
          address: result.address3 || '',
        }));
      } else {
        setPostalCodeError('住所が見つかりませんでした');
      }
    } catch (err) {
      console.error('郵便番号検索エラー:', err);
      setPostalCodeError('住所の検索に失敗しました');
    } finally {
      setPostalCodeSearching(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const profileUpdateData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        postal_code: formData.postalCode,
        prefecture: formData.prefecture,
        city: formData.city,
        address: formData.address,
        building: formData.building,
        country: formData.country,
      };

      const updatedProfile = await updateProfile(user.id, profileUpdateData);
      if (updatedProfile) {
        const freshProfile = await getProfile(user.id);
        if (freshProfile) {
          setProfile(freshProfile);
          const { prefecture, building, city, address } = splitProfileAddress(freshProfile);
          setFormData({
            firstName: freshProfile.first_name || '',
            lastName: freshProfile.last_name || '',
            email: freshProfile.email || '',
            phone: freshProfile.phone || '',
            postalCode: freshProfile.postal_code || '',
            prefecture,
            city,
            address,
            building,
            country: freshProfile.country || 'JP',
          });
        } else {
          setProfile(updatedProfile);
        }
        setEditingProfile(false);
        alert('プロフィールを更新しました');
      } else {
        alert('プロフィールの更新に失敗しました');
      }
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      alert('プロフィールの更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push('/');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getPaymentStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: '支払い待ち',
      paid: '支払い済み',
      failed: '支払い失敗',
      refunded: '返金済み',
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4" />
          <p className="text-sm text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user || isSignUpSuccess) {
    return (
      <section className="pt-24 md:pt-32 pb-24 w-full overflow-x-hidden">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="mb-8 text-center">
            <h1 className="text-xl md:text-2xl font-serif tracking-[0.15em] font-normal mb-2">
              <span className="md:hidden">MY PAGE</span>
              <span className="hidden md:inline">マイページ</span>
            </h1>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <AuthForm onAuthSuccess={handleAuthSuccess} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-24 md:pt-32 pb-24 w-full overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="mb-12">
          <h1 className="text-xl md:text-2xl font-serif tracking-[0.15em] font-normal mb-2">
            <span className="md:hidden">MY PAGE</span>
            <span className="hidden md:inline">マイページ</span>
          </h1>
          <p className="text-sm text-gray-500">ご注文履歴とアカウント設定</p>
        </div>

        {showWelcomeMessage && (
          <div className="mb-8 bg-green-50 border border-green-200 text-gray-900 px-6 py-4 rounded-lg">
            <p className="text-sm md:text-base font-medium">会員登録ありがとうございます。</p>
            <p className="text-sm md:text-base mt-1">引き続きお買い物をお楽しみください。</p>
          </div>
        )}

        <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 text-sm font-medium tracking-wider transition-colors whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-b-2 border-black text-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            購入履歴
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`px-6 py-3 text-sm font-medium tracking-wider transition-colors whitespace-nowrap ${
              activeTab === 'subscriptions'
                ? 'border-b-2 border-black text-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            定期購入
            {subscriptions.filter((s) => s.status === 'active' || s.status === 'trialing').length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs bg-black text-white rounded-full">
                {subscriptions.filter((s) => s.status === 'active' || s.status === 'trialing').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('miles')}
            className={`px-6 py-3 text-sm font-medium tracking-wider transition-colors whitespace-nowrap ${
              activeTab === 'miles'
                ? 'border-b-2 border-black text-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            イベントマイル
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 text-sm font-medium tracking-wider transition-colors whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-b-2 border-black text-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            アカウント設定
          </button>
        </div>

        {activeTab === 'orders' && (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 mb-4">購入履歴がありません</p>
                <div className="flex flex-col items-center gap-4">
                  <Link href="/collections" className="text-sm text-black underline hover:no-underline">
                    商品を見る
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-6 py-3 bg-white text-black border border-gray-200 text-sm tracking-widest hover:bg-gray-50 transition-colors"
                  >
                    ログアウト
                  </button>
                </div>
              </div>
            ) : (
              orders.map((order) => {
                const isSubscriptionOrder = Boolean(
                  order.subscription_interval || order.stripe_subscription_id
                );
                const intervalLabel =
                  order.subscription_interval &&
                  SUBSCRIPTION_INTERVAL_LABELS[order.subscription_interval as SubscriptionInterval]
                    ? SUBSCRIPTION_INTERVAL_LABELS[order.subscription_interval as SubscriptionInterval]
                    : null;
                return (
                <div key={order.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/mypage/orders/${order.id}`}
                            className="text-sm font-medium text-gray-900 hover:text-primary transition-colors"
                          >
                            注文番号: {order.order_number || order.id.slice(0, 8)}
                          </Link>
                          {isSubscriptionOrder && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase bg-red-50 text-red-600 border border-red-200 rounded">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                              </svg>
                              定期購入
                              {intervalLabel && <span className="ml-0.5 normal-case tracking-normal">/ {intervalLabel}</span>}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(order.created_at)}</p>
                        {isSubscriptionOrder && order.stripe_subscription_id && (
                          <p className="text-[10px] text-gray-400 mt-1 break-all">
                            定期購入ID: <span className="font-mono">{order.stripe_subscription_id}</span>
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                            order.payment_status === 'paid'
                              ? 'bg-green-100 text-green-700'
                              : order.payment_status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {getPaymentStatusText(order.payment_status)}
                        </span>
                        <span className="text-sm font-serif font-medium">
                          ¥{order.total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="space-y-4">
                      {order.order_items?.map((item) => {
                        // 画像・商品名クリックで注文詳細ページへ遷移
                        const orderDetailHref = `/mypage/orders/${order.id}`;
                        return (
                          <div key={item.id} className="flex gap-4">
                            <Link
                              href={orderDetailHref}
                              className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                            >
                              <FadeInImage
                                src={
                                  item.product?.images && item.product.images.length > 0
                                    ? item.product.images[0]
                                    : item.product?.image || ''
                                }
                                alt={item.product?.title || ''}
                                className="w-full h-full object-contain"
                              />
                            </Link>
                            <div className="flex-1 min-w-0">
                              <Link
                                href={orderDetailHref}
                                className="text-sm font-medium text-gray-900 hover:text-black hover:underline transition-colors line-clamp-2 cursor-pointer"
                              >
                                {item.product?.title || '商品情報なし'}
                              </Link>
                              <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                                <span>数量: {item.quantity}</span>
                                <span>¥{item.price.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <Link
                        href={`/mypage/orders/${order.id}`}
                        className="text-sm text-primary hover:underline inline-flex items-center gap-2"
                      >
                        詳細を表示する
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'subscriptions' && (() => {
          // 支払いが完了して有効になった定期購入のみ表示。
          // incomplete / incomplete_expired / unpaid は初回決済が未完了なので除外。
          const visibleSubscriptions = subscriptions.filter(
            (s) =>
              s.status !== 'incomplete' &&
              s.status !== 'incomplete_expired' &&
              s.status !== 'unpaid'
          );
          return (
          <div className="space-y-6">
            {visibleSubscriptions.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 mb-4">定期購入はまだありません</p>
                <Link href="/collections" className="text-sm text-black underline hover:no-underline">
                  商品を見る
                </Link>
              </div>
            ) : (
              <>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSyncSubscriptions}
                    disabled={syncingSubscriptions}
                    className="text-xs text-gray-500 hover:text-black underline underline-offset-2 disabled:opacity-50"
                  >
                    {syncingSubscriptions ? '同期中...' : '最新情報を取得'}
                  </button>
                </div>
                {(
              visibleSubscriptions.map((sub) => {
                const statusInfo = SUBSCRIPTION_STATUS_LABELS[sub.status] || {
                  label: sub.status,
                  cls: 'bg-gray-100 text-gray-600',
                };
                const intervalLabel =
                  SUBSCRIPTION_INTERVAL_LABELS[sub.interval as SubscriptionInterval] || sub.interval;
                const cancelAtPeriodEnd = Boolean((sub.metadata as any)?.cancel_at_period_end);
                const isActive = sub.status === 'active' || sub.status === 'trialing';
                const canCancel = isActive && !cancelAtPeriodEnd;

                return (
                  <div key={sub.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            定期購入ID: {sub.stripe_subscription_id}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            開始日: {formatDate(sub.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusInfo.cls}`}>
                            {statusInfo.label}
                          </span>
                          {cancelAtPeriodEnd && isActive && (
                            <span className="px-3 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                              次回更新で停止
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-6 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">配送頻度</p>
                          <p className="text-gray-900">{intervalLabel}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            {cancelAtPeriodEnd ? '最終お届け予定' : '次回お届け予定'}
                          </p>
                          <p className="text-gray-900">
                            {formatJapaneseDate(
                              computeNextShippingDate({
                                created_at: sub.created_at,
                                next_billing_at: sub.next_billing_at,
                                interval: sub.interval,
                              })
                            )}
                          </p>
                        </div>
                      </div>

                      {/* 商品情報 */}
                      {(() => {
                        const items = subscriptionItems[sub.stripe_subscription_id] || [];
                        if (items.length === 0) return null;
                        return (
                          <div className="pt-3 border-t border-gray-100 space-y-3">
                            {items.map((item, idx) => (
                              <div key={idx} className="flex gap-3">
                                <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded overflow-hidden">
                                  {item.product_image ? (
                                    <FadeInImage
                                      src={item.product_image}
                                      alt={item.product_title}
                                      className="w-full h-full object-contain"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                      No Image
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 line-clamp-2">{item.product_title}</p>
                                  <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                                    <span>数量: {item.quantity}</span>
                                    <span className="font-serif">¥{item.product_price.toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}

                      {sub.canceled_at && (
                        <p className="text-xs text-gray-500">
                          解約日: {formatDate(sub.canceled_at)}
                        </p>
                      )}

                      {canCancel && (
                        <div className="pt-3 border-t border-gray-100 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleCancelSubscription(sub.stripe_subscription_id)}
                            disabled={cancelingId === sub.stripe_subscription_id}
                            className="text-sm text-red-600 hover:text-red-700 underline underline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {cancelingId === sub.stripe_subscription_id ? '処理中...' : '定期購入をキャンセル'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
              )}
              </>
            )}
          </div>
          );
        })()}

        {activeTab === 'miles' && (
          <div className="space-y-6 max-w-3xl">
            <div className="rounded-lg border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 p-6">
              <p className="text-xs text-amber-800 tracking-widest uppercase mb-2">Event Miles Balance</p>
              <p className="text-3xl font-serif font-bold text-amber-900">
                {mileBalance.toLocaleString()} <span className="text-base font-medium">マイル</span>
              </p>
              <p className="text-xs text-amber-800 mt-3 leading-relaxed">
                イケベジが開催する各種イベント（田植えリトリート等）の参加費に使えるポイントです。<br />
                1マイル = 1円。有効期限はありません。
              </p>
            </div>

            <div>
              <h2 className="text-base font-medium mb-3">取引履歴</h2>
              {mileTransactions.length === 0 ? (
                <div className="border border-gray-200 rounded-lg p-8 text-center text-sm text-gray-500">
                  まだイベントマイルの取得・利用履歴はありません。
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <ul className="divide-y divide-gray-200">
                    {mileTransactions.map((t) => {
                      const sign = t.amount >= 0 ? '+' : '';
                      const colorClass = t.amount >= 0 ? 'text-green-700' : 'text-red-600';
                      return (
                        <li key={t.id} className="flex items-center justify-between gap-4 p-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded ${
                                  t.amount >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'
                                }`}
                              >
                                {EVENT_MILE_TYPE_LABELS[t.type] || t.type}
                              </span>
                              <span className="text-xs text-gray-500">{formatDate(t.created_at)}</span>
                            </div>
                            {t.description && (
                              <p className="text-sm text-gray-700 truncate">{t.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className={`text-base font-serif font-bold ${colorClass}`}>
                              {sign}{t.amount.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">残高 {t.balance_after.toLocaleString()}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-2xl">
            {!editingProfile ? (
              <div className="space-y-6">
                <div className="mb-8">
                  <h2 className="text-lg font-medium mb-4">購入者情報</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">メールアドレス</label>
                      <p className="text-sm text-gray-900">{profile?.email || '-'}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">姓</label>
                        <p className="text-sm text-gray-900">{profile?.last_name || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">名</label>
                        <p className="text-sm text-gray-900">{profile?.first_name || '-'}</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">電話番号</label>
                      <p className="text-sm text-gray-900">{profile?.phone || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">郵便番号</label>
                      <p className="text-sm text-gray-900">{profile?.postal_code || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">都道府県</label>
                      <p className="text-sm text-gray-900">{(profile as any)?.prefecture || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">市区町村</label>
                      <p className="text-sm text-gray-900">{profile?.city || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">町名・番地</label>
                      <p className="text-sm text-gray-900">{profile?.address || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">建物名・部屋番号</label>
                      <p className="text-sm text-gray-900">{(profile as any)?.building || '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setEditingProfile(true)}
                    className="px-6 py-3 bg-black text-white text-sm tracking-widest hover:bg-gray-800 transition-colors"
                  >
                    編集する
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-6 py-3 bg-white text-black border border-gray-200 text-sm tracking-widest hover:bg-gray-50 transition-colors"
                  >
                    ログアウト
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="mb-8">
                  <h2 className="text-lg font-medium mb-4">購入者情報</h2>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        メールアドレス <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-white border border-gray-200 focus:outline-none focus:border-black transition-colors"
                        placeholder="example@email.com"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                          姓 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          required
                          className="w-full px-4 py-3 bg-white border border-gray-200 focus:outline-none focus:border-black transition-colors"
                          placeholder="例) 鈴木"
                        />
                      </div>
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                          名 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          required
                          className="w-full px-4 py-3 bg-white border border-gray-200 focus:outline-none focus:border-black transition-colors"
                          placeholder="例) 太郎"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        電話番号 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-white border border-gray-200 focus:outline-none focus:border-black transition-colors"
                        placeholder="例) 09012345678"
                      />
                    </div>

                    <div>
                      <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
                        郵便番号 <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          id="postalCode"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handlePostalCodeSearch();
                            }
                          }}
                          required
                          className="flex-1 px-4 py-3 bg-white border border-gray-200 focus:outline-none focus:border-black transition-colors"
                          placeholder="例) 1066237"
                        />
                        <button
                          type="button"
                          onClick={handlePostalCodeSearch}
                          disabled={postalCodeSearching || !formData.postalCode}
                          className="px-6 py-3 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {postalCodeSearching ? '検索中...' : '検索'}
                        </button>
                      </div>
                      {postalCodeError && <p className="mt-2 text-sm text-red-600">{postalCodeError}</p>}
                    </div>

                    <div>
                      <label htmlFor="prefecture" className="block text-sm font-medium text-gray-700 mb-2">
                        都道府県
                      </label>
                      <select
                        id="prefecture"
                        name="prefecture"
                        value={formData.prefecture}
                        onChange={(e) => setFormData({ ...formData, prefecture: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 focus:outline-none focus:border-black transition-colors"
                      >
                        <option value="">都道府県を選択してください</option>
                        {PREFECTURES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                        市区町村
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 focus:outline-none focus:border-black transition-colors"
                        placeholder="例) 港区六本木"
                      />
                    </div>

                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                        町名・番地
                      </label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 focus:outline-none focus:border-black transition-colors"
                        placeholder="例) 3丁目2-1"
                      />
                    </div>

                    <div>
                      <label htmlFor="building" className="block text-sm font-medium text-gray-700 mb-2">
                        建物名・部屋番号
                      </label>
                      <input
                        type="text"
                        id="building"
                        name="building"
                        value={formData.building}
                        onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 focus:outline-none focus:border-black transition-colors"
                        placeholder="例) 六本木グランドハイツ307号室"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <LoadingButton
                    type="submit"
                    loading={saving}
                    className="px-6 py-3 bg-black text-white text-sm tracking-widest hover:bg-gray-800 transition-colors"
                  >
                    保存する
                  </LoadingButton>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProfile(false);
                      if (profile) {
                        const { prefecture, building, city, address } = splitProfileAddress(profile);
                        setFormData({
                          firstName: profile.first_name || '',
                          lastName: profile.last_name || '',
                          email: profile.email || '',
                          phone: profile.phone || '',
                          postalCode: profile.postal_code || '',
                          prefecture,
                          city,
                          address,
                          building,
                          country: profile.country || 'JP',
                        });
                      }
                    }}
                    className="px-6 py-3 bg-white text-black border border-gray-200 text-sm tracking-widest hover:bg-gray-50 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default MyPage;
