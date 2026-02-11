import React, { useState } from 'react';
import { IconStore, IconGlobe, IconCheckCircle, IconEdit, IconPlus } from '../../components/Icons';

const Market = () => {
  const [channels] = useState([
    { id: '1', name: 'オンラインストア', type: 'online', status: 'active', url: 'https://ikevege.com', sales: 1250000 },
    { id: '2', name: 'Instagram', type: 'social', status: 'active', url: '@ikevege', sales: 450000 },
    { id: '3', name: '楽天市場', type: 'marketplace', status: 'inactive', url: 'rakuten.ikevege.com', sales: 0 },
  ]);

  return (
    <>
      <div className="space-y-6">
        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            マーケットチャネルを管理して、商品を複数の販売場所で販売できます。
          </p>
        </div>

        {/* Channels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {channels.map((channel, index) => (
            <div 
              key={channel.id} 
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    channel.status === 'active' ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {channel.type === 'online' ? (
                      <IconStore className={`w-6 h-6 ${channel.status === 'active' ? 'text-green-600' : 'text-gray-400'}`} />
                    ) : channel.type === 'social' ? (
                      <IconGlobe className={`w-6 h-6 ${channel.status === 'active' ? 'text-green-600' : 'text-gray-400'}`} />
                    ) : (
                      <IconStore className={`w-6 h-6 ${channel.status === 'active' ? 'text-green-600' : 'text-gray-400'}`} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{channel.name}</h3>
                    <p className="text-xs text-gray-500">{channel.type}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  channel.status === 'active' 
                    ? 'bg-green-50 text-green-700 border border-green-100' 
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}>
                  {channel.status === 'active' && <IconCheckCircle className="w-3 h-3" />}
                  {channel.status === 'active' ? '有効' : '無効'}
                </span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">URL</p>
                  <p className="text-sm text-gray-900 font-mono">{channel.url}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">売上（今月）</p>
                  <p className="text-lg font-semibold text-gray-900">¥{channel.sales.toLocaleString()}</p>
                </div>
                <button className="w-full mt-4 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors">
                  <IconEdit className="w-4 h-4" />
                  設定を編集
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Channel Button */}
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-8 text-center hover:border-gray-400 transition-colors">
          <button className="text-gray-500 hover:text-gray-900 transition-colors">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <IconPlus className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium">新しいチャネルを追加</p>
            <p className="text-xs text-gray-400 mt-1">新しい販売チャネルを接続</p>
          </button>
        </div>
      </div>
    </>
  );
};

export default Market;

