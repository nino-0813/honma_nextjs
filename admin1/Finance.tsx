import React, { useState } from 'react';
import { IconBuilding, IconCreditCard, IconTrendingUp, IconCalendar, IconCheckCircle } from '../../components/Icons';

const Finance = () => {
  const [timeRange, setTimeRange] = useState('今月');

  const transactions = [
    { id: '1', date: '2025-12-01', type: 'payment', description: '商品売上', amount: 45000, status: 'completed' },
    { id: '2', date: '2025-12-02', type: 'payment', description: '商品売上', amount: 15000, status: 'completed' },
    { id: '3', date: '2025-12-03', type: 'fee', description: '決済手数料', amount: -450, status: 'completed' },
    { id: '4', date: '2025-12-04', type: 'payment', description: '商品売上', amount: 7500, status: 'pending' },
  ];

  const totalRevenue = transactions.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0);
  const totalFees = Math.abs(transactions.filter(t => t.type === 'fee').reduce((sum, t) => sum + t.amount, 0));
  const netRevenue = totalRevenue - totalFees;

  return (
    <>
      <div className="space-y-6">
        {/* Time Range Selector */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">期間:</label>
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black bg-white"
          >
            <option>今日</option>
            <option>今週</option>
            <option>今月</option>
            <option>今四半期</option>
            <option>今年</option>
          </select>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <IconTrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">総売上</p>
                <p className="text-2xl font-semibold text-gray-900">¥{totalRevenue.toLocaleString()}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">前月比: +12.5%</p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <IconCreditCard className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">手数料</p>
                <p className="text-2xl font-semibold text-gray-900">¥{totalFees.toLocaleString()}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">決済手数料</p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <IconBuilding className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">純利益</p>
                <p className="text-2xl font-semibold text-gray-900">¥{netRevenue.toLocaleString()}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">売上 - 手数料</p>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">取引履歴</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">日付</th>
                  <th className="px-6 py-3">種類</th>
                  <th className="px-6 py-3">説明</th>
                  <th className="px-6 py-3">ステータス</th>
                  <th className="px-6 py-3 text-right">金額</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((transaction, index) => (
                  <tr 
                    key={transaction.id} 
                    className="hover:bg-gray-50/80 transition-colors opacity-0 animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-6 py-4 text-gray-600">{transaction.date}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded ${
                        transaction.type === 'payment' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {transaction.type === 'payment' ? '入金' : '手数料'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900">{transaction.description}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.status === 'completed' 
                          ? 'bg-green-50 text-green-700 border border-green-100' 
                          : 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                      }`}>
                        {transaction.status === 'completed' && <IconCheckCircle className="w-3 h-3" />}
                        {transaction.status === 'completed' ? '完了' : '保留中'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-right font-medium ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}¥{Math.abs(transaction.amount).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default Finance;

