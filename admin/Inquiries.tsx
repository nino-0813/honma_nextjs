'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { IconMail, IconSearch, IconRefreshCw } from '@/components/Icons';

type Inquiry = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  message: string;
  status: string;
  created_at: string;
};

const Inquiries = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchInquiries = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const { data, error: e } = await supabase
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false });
      if (e) throw e;
      setInquiries((data || []) as Inquiry[]);
    } catch (err: any) {
      setError(err?.message || 'お問い合わせの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    if (!supabase) return;
    try {
      const { error: e } = await supabase
        .from('inquiries')
        .update({ status })
        .eq('id', id);
      if (e) throw e;
      setInquiries((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status } : i))
      );
      if (selectedId === id) setSelectedId(null);
    } catch (err: any) {
      console.error(err);
      alert('ステータスの更新に失敗しました');
    }
  };

  const filtered = inquiries.filter((i) => {
    const matchStatus =
      statusFilter === 'all' || i.status === statusFilter;
    if (!matchStatus) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      i.name?.toLowerCase().includes(q) ||
      i.email?.toLowerCase().includes(q) ||
      i.message?.toLowerCase().includes(q) ||
      i.company_name?.toLowerCase().includes(q)
    );
  });

  const selected = selectedId
    ? inquiries.find((i) => i.id === selectedId)
    : null;

  const getStatusLabel = (s: string) => {
    switch (s) {
      case 'new':
      case 'unread':
        return '未読';
      case 'read':
        return '既読';
      case 'in_progress':
        return '対応中';
      case 'replied':
        return '返信済み';
      case 'resolved':
        return '対応済み';
      default:
        return s || '未読';
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'new':
      case 'unread':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'read':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'replied':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'resolved':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">お問い合わせ</h1>
          <p className="text-sm text-gray-500 mt-1">サイトから届いたお問い合わせ一覧</p>
        </div>
        <button
          type="button"
          onClick={fetchInquiries}
          className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm flex items-center gap-2"
        >
          <IconRefreshCw className="w-4 h-4" />
          更新
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="名前・メール・内容で検索..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-black"
          >
            <option value="all">すべて</option>
            <option value="unread">未読</option>
            <option value="new">新規</option>
            <option value="read">既読</option>
            <option value="in_progress">対応中</option>
            <option value="replied">返信済み</option>
            <option value="resolved">対応済み</option>
          </select>
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-500">読み込み中...</div>
        ) : error ? (
          <div className="p-10 text-center text-red-600">{error}</div>
        ) : (
          <div className="flex flex-col md:flex-row min-h-[400px]">
            <div className="md:w-1/2 border-b md:border-b-0 md:border-r border-gray-100 overflow-y-auto max-h-[60vh] md:max-h-[70vh]">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  お問い合わせはありません
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {filtered.map((i) => (
                    <li
                      key={i.id}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedId === i.id ? 'bg-gray-50' : 'hover:bg-gray-50/50'
                      }`}
                      onClick={() => setSelectedId(i.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate">
                            {i.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {i.email}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {i.message}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(
                            i.status
                          )}`}
                        >
                          {getStatusLabel(i.status)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(i.created_at).toLocaleString('ja-JP')}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="md:w-1/2 p-6 overflow-y-auto max-h-[50vh] md:max-h-[70vh]">
              {selected ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">詳細</h3>
                    <select
                      value={selected.status}
                      onChange={(e) =>
                        updateStatus(selected.id, e.target.value)
                      }
                      className="text-sm border border-gray-200 rounded-lg px-2 py-1"
                    >
                      <option value="unread">未読</option>
                      <option value="new">新規</option>
                      <option value="read">既読</option>
                      <option value="in_progress">対応中</option>
                      <option value="replied">返信済み</option>
                      <option value="resolved">対応済み</option>
                    </select>
                  </div>
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-gray-500">お名前</dt>
                      <dd className="font-medium text-gray-900">{selected.name}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">メールアドレス</dt>
                      <dd>
                        <a
                          href={`mailto:${selected.email}`}
                          className="text-gray-900 underline hover:text-black"
                        >
                          {selected.email}
                        </a>
                      </dd>
                    </div>
                    {selected.phone && (
                      <div>
                        <dt className="text-gray-500">電話番号</dt>
                        <dd className="text-gray-900">{selected.phone}</dd>
                      </div>
                    )}
                    {selected.company_name && (
                      <div>
                        <dt className="text-gray-500">会社名</dt>
                        <dd className="text-gray-900">{selected.company_name}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-gray-500">お問い合わせ日時</dt>
                      <dd className="text-gray-600">
                        {new Date(selected.created_at).toLocaleString('ja-JP')}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 mb-1">内容</dt>
                      <dd className="text-gray-900 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 border border-gray-100">
                        {selected.message}
                      </dd>
                    </div>
                  </dl>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                  <IconMail className="w-12 h-12 mb-3" />
                  <p className="text-sm">一覧から選択してください</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Inquiries;
