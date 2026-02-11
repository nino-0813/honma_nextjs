import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { IconSearch, IconChevronDown } from '../../components/Icons';

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: 'new' | 'in_progress' | 'resolved' | 'archived';
  created_at: string;
  updated_at: string;
}

const Inquiries = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Inquiry['status']>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    if (!supabase) {
      setError(new Error('Supabaseが設定されていません。'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setInquiries(data || []);
    } catch (err) {
      console.error('お問い合わせデータの取得に失敗しました:', err);
      setError(err instanceof Error ? err : new Error('お問い合わせデータの取得に失敗しました'));
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: Inquiry['status']) => {
    if (!supabase) {
      alert('Supabaseが利用できません。');
      return;
    }

    try {
      const { error } = await supabase
        .from('inquiries')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        throw error;
      }

      // データを再取得
      fetchInquiries();
      if (selectedInquiry?.id === id) {
        setSelectedInquiry({ ...selectedInquiry, status: newStatus });
      }
    } catch (err) {
      console.error('ステータスの更新に失敗しました:', err);
      alert(`ステータスの更新に失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`);
    }
  };

  const filteredInquiries = inquiries.filter(inquiry => {
    const matchesSearch = 
      inquiry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inquiry.phone && inquiry.phone.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || inquiry.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusLabel = (status: Inquiry['status']) => {
    const labels = {
      new: '新規',
      in_progress: '対応中',
      resolved: '解決済み',
      archived: 'アーカイブ'
    };
    return labels[status];
  };

  const getStatusColor = (status: Inquiry['status']) => {
    const colors = {
      new: 'bg-blue-50 text-blue-800 border-blue-200',
      in_progress: 'bg-amber-50 text-amber-800 border-amber-200',
      resolved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      archived: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[status];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-12">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-500">お問い合わせデータを読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-12">
        <div className="text-center">
          <p className="text-red-500 mb-2">エラーが発生しました</p>
          <p className="text-sm text-gray-500">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">お問い合わせ</h1>
      </div>

      {/* フィルターと検索 */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="名前、メール、内容で検索..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all bg-white"
              />
            </div>
            <div className="relative group">
              <button className="inline-flex justify-center items-center w-full md:w-auto px-4 py-2.5 text-sm border border-gray-200 rounded-md hover:border-gray-400 transition-colors font-medium">
                {statusFilter === 'all' ? 'すべてのステータス' : getStatusLabel(statusFilter)}
                <IconChevronDown className="ml-2 h-4 w-4" />
              </button>
              <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20">
                <div className="py-1">
                  <button 
                    onClick={() => setStatusFilter('all')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    すべてのステータス
                  </button>
                  <button 
                    onClick={() => setStatusFilter('new')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    新規
                  </button>
                  <button 
                    onClick={() => setStatusFilter('in_progress')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    対応中
                  </button>
                  <button 
                    onClick={() => setStatusFilter('resolved')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    解決済み
                  </button>
                  <button 
                    onClick={() => setStatusFilter('archived')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    アーカイブ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* お問い合わせ一覧 */}
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm">
          {filteredInquiries.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">
                {searchQuery || statusFilter !== 'all' 
                  ? '検索結果が見つかりませんでした' 
                  : 'お問い合わせがありません'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredInquiries.map((inquiry) => (
                <div 
                  key={inquiry.id}
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedInquiry(selectedInquiry?.id === inquiry.id ? null : inquiry)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-gray-900">{inquiry.name}</h3>
                        <span className={`text-xs px-2.5 py-1 rounded-md border ${getStatusColor(inquiry.status)}`}>
                          {getStatusLabel(inquiry.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{inquiry.email}</p>
                      {inquiry.phone && (
                        <p className="text-sm text-gray-500 mb-2">{inquiry.phone}</p>
                      )}
                      <p className="text-sm text-gray-700 line-clamp-2 mb-2">{inquiry.message}</p>
                      <p className="text-xs text-gray-400">{formatDate(inquiry.created_at)}</p>
                    </div>
                    <IconChevronDown 
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        selectedInquiry?.id === inquiry.id ? 'rotate-180' : ''
                      }`} 
                    />
                  </div>

                  {/* 詳細表示 */}
                  {selectedInquiry?.id === inquiry.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">お名前</label>
                          <p className="text-sm text-gray-900 mt-1">{inquiry.name}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">メールアドレス</label>
                          <p className="text-sm text-gray-900 mt-1">
                            <a href={`mailto:${inquiry.email}`} className="text-primary hover:underline">
                              {inquiry.email}
                            </a>
                          </p>
                        </div>
                        {inquiry.phone && (
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">お電話番号</label>
                            <p className="text-sm text-gray-900 mt-1">
                              <a href={`tel:${inquiry.phone}`} className="text-primary hover:underline">
                                {inquiry.phone}
                              </a>
                            </p>
                          </div>
                        )}
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">お問い合わせ内容</label>
                          <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap leading-relaxed">{inquiry.message}</p>
                        </div>
                        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</label>
                          <select
                            value={inquiry.status}
                            onChange={(e) => updateStatus(inquiry.id, e.target.value as Inquiry['status'])}
                            className="text-sm border border-gray-200 rounded-md px-3 py-1.5 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 bg-white"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="new">新規</option>
                            <option value="in_progress">対応中</option>
                            <option value="resolved">解決済み</option>
                            <option value="archived">アーカイブ</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-500 mb-1">総件数</p>
            <p className="text-2xl font-bold text-gray-900">{inquiries.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-500 mb-1">新規</p>
            <p className="text-2xl font-bold text-blue-600">
              {inquiries.filter(i => i.status === 'new').length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-500 mb-1">対応中</p>
            <p className="text-2xl font-bold text-yellow-600">
              {inquiries.filter(i => i.status === 'in_progress').length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-500 mb-1">解決済み</p>
            <p className="text-2xl font-bold text-green-600">
              {inquiries.filter(i => i.status === 'resolved').length}
            </p>
          </div>
        </div>
      </div>
  );
};

export default Inquiries;

