'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase, getProfile, updateProfile, getOrders, Order, Profile } from '@/lib/supabase';
import { FadeInImage, LoadingButton } from '@/components/UI';
import AuthForm from '@/components/AuthForm';

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
  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');
  const [editingProfile, setEditingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const [isSignUpSuccess, setIsSignUpSuccess] = useState(false);

  useEffect(() => {
    const tab = searchParams?.get('tab');
    if (tab === 'orders') setActiveTab('orders');
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
    } catch (error) {
      console.error('データ読み込みエラー:', error);
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

        <div className="flex border-b border-gray-200 mb-8">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 text-sm font-medium tracking-wider transition-colors ${
              activeTab === 'orders'
                ? 'border-b-2 border-black text-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            購入履歴
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 text-sm font-medium tracking-wider transition-colors ${
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
              orders.map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <Link
                          href={`/mypage/orders/${order.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-primary transition-colors"
                        >
                          注文番号: {order.order_number || order.id.slice(0, 8)}
                        </Link>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(order.created_at)}</p>
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
                      {order.order_items?.map((item) => (
                        <div key={item.id} className="flex gap-4">
                          <Link
                            href={`/products/${item.product?.handle || ''}`}
                            className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded overflow-hidden"
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
                              href={`/products/${item.product?.handle || ''}`}
                              className="text-sm font-medium text-gray-900 hover:text-black transition-colors line-clamp-2"
                            >
                              {item.product?.title || '商品情報なし'}
                            </Link>
                            <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                              <span>数量: {item.quantity}</span>
                              <span>¥{item.price.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
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
              ))
            )}
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
