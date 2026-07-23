'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { IconArrowLeft, IconTrash, IconPlus } from '@/components/Icons';
import { LoadingButton } from '@/components/UI';

const TARGET_CATEGORIES = [
  'プロダクト（美味しさ）',
  'プロダクト（質・安全性）',
  '活動（サステナ・スピリチュアル・共感）',
  '人柄（地域応援）',
  '人柄（個人・繋がり）',
];

const PLATFORM_OPTIONS = [
  { value: 'website', label: '自社サイト' },
  { value: 'base', label: 'BASE' },
  { value: 'other', label: 'その他' },
];

const GENDER_OPTIONS = ['男性', '女性', 'その他', '未回答'];

type SnsRow = { sns_type: string; account_url: string };

const CustomerEditor = () => {
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const routeId = params?.id as string | undefined;
  // "profile-{profileId}" は顧客リストにまだ登録されていない既存会員（profiles）から編集を開始した場合のID
  const isProfileSourced = Boolean(routeId && routeId.startsWith('profile-'));
  const profileId = isProfileSourced ? routeId!.slice('profile-'.length) : undefined;
  const id = !isProfileSourced && routeId !== 'new' ? routeId : undefined;
  const isNew = !id; // 'new' の場合も profile-sourced の場合も、customersテーブルにはまだ行が無いのでtrue

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [platform, setPlatform] = useState('website');
  const [birthYear, setBirthYear] = useState('');
  const [gender, setGender] = useState('');
  const [targetCategories, setTargetCategories] = useState<Set<string>>(new Set());
  const [firstPurchaseRiceDate, setFirstPurchaseRiceDate] = useState('');
  const [firstPurchaseShiitakeDate, setFirstPurchaseShiitakeDate] = useState('');
  const [latestPurchaseRiceDate, setLatestPurchaseRiceDate] = useState('');
  const [latestPurchaseShiitakeDate, setLatestPurchaseShiitakeDate] = useState('');
  const [snsAccounts, setSnsAccounts] = useState<SnsRow[]>([]);
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [referrerName, setReferrerName] = useState('');

  useEffect(() => {
    const fetchFromProfile = async (client: NonNullable<typeof supabase>) => {
      try {
        setLoading(true);
        setError(null);
        const { data, error } = await client.from('profiles').select('*').eq('id', profileId).single();
        if (error) throw error;
        const p = data as any;
        setLastName(p.last_name || '');
        setFirstName(p.first_name || '');
        setEmail(p.email || '');
        setPlatform('website');
      } catch (e: any) {
        console.error(e);
        setError(e.message || '会員情報の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    const fetchCustomer = async () => {
      const client = supabase;
      if (!client) {
        setError('Supabaseが利用できません');
        setLoading(false);
        return;
      }
      if (isProfileSourced && profileId) {
        await fetchFromProfile(client);
        return;
      }
      if (isNew) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error } = await client.from('customers').select('*').eq('id', id).single();
        if (error) throw error;
        const c = data as any;

        setLastName(c.last_name || '');
        setFirstName(c.first_name || '');
        setEmail(c.email || '');
        setPlatform(c.platform || 'website');
        setBirthYear(c.birth_year ? String(c.birth_year) : '');
        setGender(c.gender || '');
        setTargetCategories(new Set<string>(c.target_categories || []));
        setFirstPurchaseRiceDate(c.first_purchase_rice_date || '');
        setFirstPurchaseShiitakeDate(c.first_purchase_shiitake_date || '');
        setLatestPurchaseRiceDate(c.latest_purchase_rice_date || '');
        setLatestPurchaseShiitakeDate(c.latest_purchase_shiitake_date || '');
        setNewsletterOptIn(Boolean(c.newsletter_opt_in));
        setReferrerName(c.referrer_name || '');

        const { data: sns, error: snsErr } = await client
          .from('customer_sns_accounts')
          .select('sns_type, account_url')
          .eq('customer_id', id);
        if (snsErr) throw snsErr;
        setSnsAccounts((sns || []).map((s: any) => ({ sns_type: s.sns_type || '', account_url: s.account_url || '' })));
      } catch (e: any) {
        console.error(e);
        setError(e.message || '顧客情報の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [id, isNew, isProfileSourced, profileId]);

  const toggleCategory = (cat: string) => {
    setTargetCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const addSnsRow = () => setSnsAccounts((prev) => [...prev, { sns_type: '', account_url: '' }]);
  const updateSnsRow = (index: number, patch: Partial<SnsRow>) => {
    setSnsAccounts((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };
  const removeSnsRow = (index: number) => {
    setSnsAccounts((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    if (!lastName.trim()) return '姓を入力してください';
    if (birthYear && (Number.isNaN(Number(birthYear)) || String(birthYear).length !== 4)) {
      return '生年は4桁の数値で入力してください（例: 1990）';
    }
    return null;
  };

  const handleSave = async () => {
    const client = supabase;
    if (!client) return;
    const message = validate();
    if (message) {
      alert(message);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const now = new Date().toISOString();
      const payload = {
        last_name: lastName.trim(),
        first_name: firstName.trim() || null,
        email: email.trim() || null,
        platform,
        birth_year: birthYear ? Number(birthYear) : null,
        gender: gender || null,
        target_categories: Array.from(targetCategories),
        first_purchase_rice_date: firstPurchaseRiceDate || null,
        first_purchase_shiitake_date: firstPurchaseShiitakeDate || null,
        latest_purchase_rice_date: latestPurchaseRiceDate || null,
        latest_purchase_shiitake_date: latestPurchaseShiitakeDate || null,
        newsletter_opt_in: newsletterOptIn,
        referrer_name: referrerName.trim() || null,
        updated_at: now,
      };

      let customerId = id;
      if (isNew) {
        const { data, error } = await client.from('customers').insert([{ ...payload, created_at: now }]).select('id').single();
        if (error) throw error;
        customerId = (data as any).id as string;
      } else {
        const { error } = await client.from('customers').update(payload).eq('id', id);
        if (error) throw error;
      }

      if (customerId) {
        await client.from('customer_sns_accounts').delete().eq('customer_id', customerId);
        const rows = snsAccounts
          .filter((row) => row.sns_type.trim() || row.account_url.trim())
          .map((row) => ({
            customer_id: customerId,
            sns_type: row.sns_type.trim(),
            account_url: row.account_url.trim() || null,
          }));
        if (rows.length > 0) {
          const { error: snsErr } = await client.from('customer_sns_accounts').insert(rows);
          if (snsErr) throw snsErr;
        }
      }

      alert('保存しました');
      router.push('/admin/customer-list');
    } catch (e: any) {
      console.error(e);
      setError(e.message || '保存に失敗しました');
      alert(`保存に失敗しました: ${e.message || '不明なエラー'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const client = supabase;
    if (!client || isNew || !id) return;
    if (!confirm('この顧客を削除します。よろしいですか？')) return;
    try {
      setSaving(true);
      const { error } = await client.from('customers').delete().eq('id', id);
      if (error) throw error;
      alert('削除しました');
      router.push('/admin/customer-list');
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
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/customer-list" className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <IconArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {isProfileSourced ? '会員情報を顧客リストに登録' : isNew ? '顧客を追加' : '顧客を編集'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {isProfileSourced ? '既存の会員登録情報から作成します' : '顧客リスト（CRM台帳）'}
            </p>
          </div>
        </div>
      </div>

      {error && <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>}

      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">基本情報</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">姓</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg bg-white"
                placeholder="例）山田"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">名</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg bg-white"
                placeholder="例）太郎"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">メールアドレス</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg bg-white"
                placeholder="example@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">プラットフォーム</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg bg-white"
              >
                {PLATFORM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">生年（4桁）</label>
              <input
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                className="w-full p-3 border border-gray-200 rounded-lg bg-white"
                placeholder="例）1990"
                inputMode="numeric"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">性別</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg bg-white"
              >
                <option value="">未設定</option>
                {GENDER_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">ターゲットカテゴリー</h2>
          <p className="text-xs text-gray-500">複数選択できます</p>
          <div className="space-y-2">
            {TARGET_CATEGORIES.map((cat) => (
              <label key={cat} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={targetCategories.has(cat)}
                  onChange={() => toggleCategory(cat)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">{cat}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">購入日</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">初回購入日（お米）</label>
              <input
                type="date"
                value={firstPurchaseRiceDate}
                onChange={(e) => setFirstPurchaseRiceDate(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">初回購入日（椎茸）</label>
              <input
                type="date"
                value={firstPurchaseShiitakeDate}
                onChange={(e) => setFirstPurchaseShiitakeDate(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">最新購入日（お米）</label>
              <input
                type="date"
                value={latestPurchaseRiceDate}
                onChange={(e) => setLatestPurchaseRiceDate(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">最新購入日（椎茸）</label>
              <input
                type="date"
                value={latestPurchaseShiitakeDate}
                onChange={(e) => setLatestPurchaseShiitakeDate(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg bg-white"
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">SNS</h2>
            <button
              type="button"
              onClick={addSnsRow}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center gap-1"
            >
              <IconPlus className="w-3.5 h-3.5" />
              追加
            </button>
          </div>
          {snsAccounts.length === 0 ? (
            <p className="text-sm text-gray-500">登録されているSNSはありません</p>
          ) : (
            <div className="space-y-3">
              {snsAccounts.map((row, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-2">
                  <input
                    value={row.sns_type}
                    onChange={(e) => updateSnsRow(index, { sns_type: e.target.value })}
                    className="p-3 border border-gray-200 rounded-lg bg-white text-sm"
                    placeholder="種類（例: Instagram）"
                  />
                  <input
                    value={row.account_url}
                    onChange={(e) => updateSnsRow(index, { account_url: e.target.value })}
                    className="p-3 border border-gray-200 rounded-lg bg-white text-sm"
                    placeholder="アカウントURL"
                  />
                  <button
                    type="button"
                    onClick={() => removeSnsRow(index)}
                    className="p-3 text-gray-400 hover:text-red-600"
                    title="削除"
                  >
                    <IconTrash className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">その他</h2>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={newsletterOptIn}
              onChange={(e) => setNewsletterOptIn(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700">メルマガ許可あり</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">紹介者氏名</label>
            <input
              value={referrerName}
              onChange={(e) => setReferrerName(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg bg-white"
              placeholder="例）鈴木花子"
            />
          </div>
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
          <LoadingButton
            onClick={handleSave}
            loading={saving}
            className="px-8 py-3 bg-emerald-700 text-white rounded-md font-medium hover:bg-emerald-800 disabled:opacity-50"
          >
            {isNew ? '作成する' : '保存する'}
          </LoadingButton>
        </div>
      </div>
    </>
  );
};

export default CustomerEditor;
