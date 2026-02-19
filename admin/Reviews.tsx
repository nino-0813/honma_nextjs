'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { IconStar, IconRefreshCw } from '@/components/Icons';

type ReviewRow = {
  id: string;
  name: string;
  role: string | null;
  comment: string;
  rating: number;
  date: string;
  product_name: string | null;
  status: string;
  created_at: string;
};

const Reviews = () => {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data, error: e } = await supabase
        .from('reviews')
        .select('*')
        .order('date', { ascending: false });
      if (e) throw e;
      setReviews((data || []) as ReviewRow[]);
    } catch (err: any) {
      setError(err?.message || 'レビューの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">レビュー管理</h1>
          <p className="text-sm text-gray-500 mt-1">お客様の声の一覧</p>
        </div>
        <button
          type="button"
          onClick={fetchReviews}
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
        ) : reviews.length === 0 ? (
          <div className="p-10 text-center text-gray-500">レビューはまだありません</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">名前</th>
                  <th className="px-6 py-3">評価</th>
                  <th className="px-6 py-3">商品</th>
                  <th className="px-6 py-3">日付</th>
                  <th className="px-6 py-3">コメント</th>
                  <th className="px-6 py-3">ステータス</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reviews.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium text-gray-900">{r.name}</td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1">
                        <IconStar className="w-4 h-4 text-amber-500 fill-amber-500" />
                        {r.rating}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{r.product_name || '-'}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {r.date ? new Date(r.date).toLocaleDateString('ja-JP') : '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{r.comment}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs ${
                          r.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : r.status === 'draft'
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {r.status === 'published' ? '公開' : r.status === 'draft' ? '下書き' : 'アーカイブ'}
                      </span>
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

export default Reviews;
