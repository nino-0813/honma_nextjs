'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { IconArrowLeft } from '@/components/Icons';

export default function AdminCustomerDetailPage() {
  const params = useParams<{ email: string }>();
  const email = decodeURIComponent((params?.email as string) || '');
  const [profile, setProfile] = useState<any | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!supabase || !email) {
        setLoading(false);
        return;
      }

      try {
        const [profileResult, ordersResult] = await Promise.all([
          supabase.from('profiles').select('*').eq('email', email).maybeSingle(),
          supabase.from('orders').select('*').eq('email', email).order('created_at', { ascending: false }),
        ]);

        if (!profileResult.error) setProfile(profileResult.data);
        if (!ordersResult.error) setOrders(ordersResult.data || []);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [email]);

  const totalSpent = useMemo(
    () => orders.reduce((sum, order) => sum + Number(order.total || 0), 0),
    [orders]
  );

  if (loading) {
    return <div className="p-8 text-gray-500">読み込み中...</div>;
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/customers" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
        <IconArrowLeft className="w-4 h-4" />
        顧客一覧に戻る
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">{profile ? `${profile.last_name || ''} ${profile.first_name || ''}`.trim() || email : email}</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500 mb-1">メールアドレス</p>
            <p className="text-gray-900">{email}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">電話番号</p>
            <p className="text-gray-900">{profile?.phone || '-'}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">総購入額</p>
            <p className="text-gray-900 font-medium">¥{totalSpent.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">注文履歴</h2>
        </div>
        {orders.length === 0 ? (
          <div className="p-8 text-sm text-gray-500">注文履歴はありません。</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">注文番号</th>
                  <th className="px-6 py-3">注文日</th>
                  <th className="px-6 py-3">支払い状態</th>
                  <th className="px-6 py-3">合計</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4">{order.order_number || '-'}</td>
                    <td className="px-6 py-4 text-gray-500">{new Date(order.created_at).toLocaleDateString('ja-JP')}</td>
                    <td className="px-6 py-4">{order.payment_status || '-'}</td>
                    <td className="px-6 py-4">¥{Number(order.total || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
