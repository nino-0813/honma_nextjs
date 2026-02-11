import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconPlus, IconSearch, IconFilter, IconMonitor, IconEdit, IconMore, IconEye, IconCheckCircle } from '../../components/Icons';

interface Content {
  id: string;
  title: string;
  type: 'page' | 'blog' | 'announcement';
  status: 'published' | 'draft' | 'archived';
  author: string;
  updatedAt: string;
  views: number;
}

const mockContent: Content[] = [
  { id: '1', title: '自然栽培について', type: 'page', status: 'published', author: 'Admin', updatedAt: '2025-12-01', views: 1250 },
  { id: '2', title: '新米の季節がやってきました', type: 'blog', status: 'published', author: 'Admin', updatedAt: '2025-12-02', views: 890 },
  { id: '3', title: '年末年始の配送について', type: 'announcement', status: 'published', author: 'Admin', updatedAt: '2025-12-03', views: 2100 },
  { id: '4', title: '佐渡ヶ島の自然', type: 'blog', status: 'draft', author: 'Admin', updatedAt: '2025-11-28', views: 0 },
];

const Content = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContent = mockContent.filter(content => 
    content.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeLabel = (type: Content['type']) => {
    switch (type) {
      case 'page': return 'ページ';
      case 'blog': return 'ブログ';
      case 'announcement': return 'お知らせ';
      default: return type;
    }
  };

  const getStatusColor = (status: Content['status']) => {
    switch (status) {
      case 'published': return 'bg-green-50 text-green-700 border-green-100';
      case 'draft': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
      case 'archived': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const getStatusLabel = (status: Content['status']) => {
    switch (status) {
      case 'published': return '公開中';
      case 'draft': return '下書き';
      case 'archived': return 'アーカイブ';
      default: return status;
    }
  };

  return (
    <>
      <div className="flex justify-end mb-6">
        <Link to="/admin/content/new">
          <a className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm flex items-center gap-2">
            <IconPlus className="w-4 h-4" />
            コンテンツを作成
          </a>
        </Link>
      </div>

      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <IconMonitor className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">総コンテンツ数</p>
                <p className="text-2xl font-semibold text-gray-900">{mockContent.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <IconCheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">公開中</p>
                <p className="text-2xl font-semibold text-gray-900">{mockContent.filter(c => c.status === 'published').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <IconEdit className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">下書き</p>
                <p className="text-2xl font-semibold text-gray-900">{mockContent.filter(c => c.status === 'draft').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <IconEye className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">総閲覧数</p>
                <p className="text-2xl font-semibold text-gray-900">{mockContent.reduce((sum, c) => sum + c.views, 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-gray-100 flex gap-4">
            <div className="flex-1 relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="タイトルで検索..." 
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
              />
            </div>
            <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-2 transition-colors">
              <IconFilter className="w-4 h-4" />
              フィルター
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">タイトル</th>
                  <th className="px-6 py-3">タイプ</th>
                  <th className="px-6 py-3">ステータス</th>
                  <th className="px-6 py-3">作成者</th>
                  <th className="px-6 py-3">更新日</th>
                  <th className="px-6 py-3">閲覧数</th>
                  <th className="px-6 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredContent.map((content, index) => (
                  <tr 
                    key={content.id} 
                    className="group hover:bg-gray-50/80 transition-colors opacity-0 animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-6 py-4">
                      <Link to={`/admin/content/${content.id}`}>
                        <a className="font-medium text-gray-900 hover:text-primary transition-colors">
                          {content.title}
                        </a>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600">{getTypeLabel(content.type)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(content.status)}`}>
                        {getStatusLabel(content.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{content.author}</td>
                    <td className="px-6 py-4 text-gray-500">{content.updatedAt}</td>
                    <td className="px-6 py-4 text-gray-600">{content.views.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link to={`/admin/content/${content.id}`}>
                          <a className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <IconEdit className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                          </a>
                        </Link>
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <IconMore className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
            <span>{filteredContent.length} 件中 1-{filteredContent.length} 件を表示</span>
            <div className="flex gap-2">
              <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50" disabled>前へ</button>
              <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50" disabled>次へ</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Content;

