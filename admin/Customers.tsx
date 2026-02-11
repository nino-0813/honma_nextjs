'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { IconUsers, IconRefreshCw } from '@/components/Icons';

type ProfileRow = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  created_at: string;
};

const Customers = () => {
  const [customers, setCustomers] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data, error: e } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, phone, created_at')
        .order('created_at', { ascending: false });
      if (e) throw e;
      setCustomers((data || []) as ProfileRow[]);
    } catch (err: any) {
      setError(err?.message || '顧客の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const name = (p: ProfileRow) =>
    [p.last_name, p.first_name].filter(Boolean).join(' ') || p.email || '（未設定）';

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">顧客管理</h1>
          <p className="text-sm text-gray-500 mt-1">会員・プロフィール一覧</p>
        </div>
        <button
          type="button"
          onClick={fetchCustomers}
          className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
        >
          <IconRefreshCw className="w-4 h-4" />
          更新
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500">読み込み中...</div>
        ) : error ? (
          <div className="p-10 text-center text-red-600">{error}</div>
        ) : customers.length === 0 ? (
          <div className="p-10 text-center text-gray-500">顧客はまだいません</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">名前</th>
                  <th className="px-6 py-3">メール</th>
                  <th className="px-6 py-3">電話</th>
                  <th className="px-6 py-3">登録日</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium text-gray-900">{name(c)}</td>
                    <td className="px-6 py-4 text-gray-600">{c.email || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{c.phone || '-'}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(c.created_at).toLocaleDateString('ja-JP')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default Customers;
