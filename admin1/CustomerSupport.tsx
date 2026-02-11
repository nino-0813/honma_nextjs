import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { sendEmail } from '../../lib/resend';
import { IconMail, IconSend, IconLoader2, IconSearch } from '../../components/Icons';
import { LoadingButton } from '../../components/UI';

interface Customer {
  id: string;
  email: string;
  name: string;
  hasOrders: boolean;
  lastOrderDate: string | null;
  totalSpent: number;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

const CustomerSupport = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  // メール送信フォーム
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  
  // テンプレート
  const [templates, setTemplates] = useState<EmailTemplate[]>([
    {
      id: 'welcome',
      name: '新規登録お礼',
      subject: 'IKEVEGEへのご登録ありがとうございます',
      body: 'この度は、IKEVEGEにご登録いただき、誠にありがとうございます。\n\n今後ともよろしくお願いいたします。',
    },
    {
      id: 'order_confirmation',
      name: '注文確認',
      subject: 'ご注文ありがとうございます',
      body: 'この度は、IKEVEGEをご利用いただき、誠にありがとうございます。\n\nご注文を承りました。発送まで少々お時間をいただきますが、よろしくお願いいたします。',
    },
    {
      id: 'shipping_notice',
      name: '発送通知',
      subject: '商品を発送いたしました',
      body: 'お客様のご注文商品を本日発送いたしました。\n\n到着まで今しばらくお待ちください。',
    },
  ]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // プロフィールと注文データを取得
      const [profilesResult, ordersResult] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
      ]);

      if (profilesResult.error) {
        console.error('プロフィールデータ取得エラー:', profilesResult.error);
        console.warn('プロフィールデータが取得できませんでした。RLSポリシーを確認してください。');
      }

      if (ordersResult.error) {
        console.error('注文データ取得エラー:', ordersResult.error);
      }

      console.log('取得したプロフィールデータ:', profilesResult.data?.length || 0, '件');
      console.log('プロフィールデータ:', profilesResult.data);
      console.log('取得した注文データ:', ordersResult.data?.length || 0, '件');

      const profiles = profilesResult.data || [];
      const orders = ordersResult.data || [];

      // 顧客データを構築
      const customerMap = new Map<string, Customer>();

      // プロフィールから顧客を作成（ログインユーザー全員を表示）
      profiles.forEach((profile: any) => {
        // メールアドレスがあるプロフィールのみ
        if (profile.email) {
          const userOrders = orders.filter((o: any) => 
            (o.auth_user_id && o.auth_user_id === profile.id) || 
            (o.email && o.email === profile.email)
          );
          
          const name = `${profile.last_name || ''} ${profile.first_name || ''}`.trim() || profile.email;
          
          customerMap.set(profile.email, {
            id: profile.id,
            email: profile.email,
            name: name,
            hasOrders: userOrders.length > 0,
            lastOrderDate: userOrders.length > 0 
              ? userOrders[0].created_at 
              : profile.created_at, // 注文がない場合は登録日を表示
            totalSpent: userOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0),
          });
        }
      });

      // 注文のみの顧客（プロフィールがない）も追加
      orders.forEach((order: any) => {
        if (order.email && !customerMap.has(order.email)) {
          customerMap.set(order.email, {
            id: order.email,
            email: order.email,
            name: `${order.last_name || ''} ${order.first_name || ''}`.trim() || order.email,
            hasOrders: true,
            lastOrderDate: order.created_at,
            totalSpent: order.total || 0,
          });
        }
      });

      setCustomers(Array.from(customerMap.values()));
    } catch (error) {
      console.error('顧客データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCustomer = (email: string) => {
    setSelectedCustomers(prev => 
      prev.includes(email) 
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomers.map(c => c.email));
    }
  };

  const handleUseTemplate = (template: EmailTemplate) => {
    setEmailSubject(template.subject);
    setEmailBody(template.body);
    setShowEmailForm(true);
  };

  const handleSendEmail = async () => {
    if (selectedCustomers.length === 0) {
      alert('送信先を選択してください');
      return;
    }

    if (!emailSubject || !emailBody) {
      alert('件名と本文を入力してください');
      return;
    }

    if (!supabase) {
      alert('Supabaseが設定されていません');
      return;
    }

    setSending(true);
    try {
      // 現在のユーザー（管理者）を取得
      const { data: { user } } = await supabase.auth.getUser();
      
      // Resend APIを使ってメール送信
      const result = await sendEmail(selectedCustomers, emailSubject, emailBody);

      // メール送信履歴をSupabaseに保存
      const { error: logError } = await supabase
        .from('email_logs')
        .insert([
          {
            recipients: selectedCustomers,
            subject: emailSubject,
            body: emailBody,
            status: result.failed > 0 ? 'failed' : 'sent',
            sent_by: user?.id || null,
          }
        ]);

      if (logError) {
        console.error('メール送信履歴の保存エラー:', logError);
        // 履歴保存に失敗しても続行
      }

      // 成功メッセージを表示
      if (result.failed > 0) {
        alert(`${result.successful}件のメールを送信しました。\n${result.failed}件の送信に失敗しました。\n\n失敗したメールアドレス:\n${result.failedEmails.join('\n')}`);
      } else {
        alert(`${result.successful}件のメールを送信しました。`);
      }
      
      // フォームをリセット
      setEmailSubject('');
      setEmailBody('');
      setSelectedCustomers([]);
      setShowEmailForm(false);
    } catch (error) {
      console.error('メール送信エラー:', error);
      alert('メール送信に失敗しました');
    } finally {
      setSending(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <IconLoader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold text-gray-900">顧客対応</h1>
        {selectedCustomers.length > 0 && (
          <button
            onClick={() => setShowEmailForm(true)}
            className="bg-black text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-all shadow-sm hover:shadow flex items-center gap-2"
          >
            <IconMail className="w-4 h-4" />
            メールを送信 ({selectedCustomers.length})
          </button>
        )}
      </div>

      {showEmailForm && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">メール送信</h2>
          
          {/* テンプレート選択 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">テンプレート</label>
            <div className="flex flex-wrap gap-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleUseTemplate(template)}
                  className="px-4 py-2 border border-gray-200 rounded-md text-sm hover:bg-gray-50 transition-colors"
                >
                  {template.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">送信先</label>
              <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                {selectedCustomers.length}件の顧客に送信
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">件名 *</label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                placeholder="メールの件名"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">本文 *</label>
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={10}
                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all resize-y"
                placeholder="メールの本文"
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <LoadingButton
                onClick={handleSendEmail}
                loading={sending}
                className="bg-black text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-all flex items-center gap-2"
              >
                <IconSend className="w-4 h-4" />
                送信する
              </LoadingButton>
              <button
                onClick={() => {
                  setShowEmailForm(false);
                  setEmailSubject('');
                  setEmailBody('');
                }}
                className="px-6 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 顧客リスト */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* 検索バー */}
        <div className="p-5 border-b border-gray-100">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="お客様名、メールアドレスで検索..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all bg-white"
            />
          </div>
        </div>

        {/* 顧客テーブル */}
        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            {searchQuery ? '検索条件に一致する顧客はありません。' : '顧客データはまだありません。'}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 w-12">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-black focus:ring-black"
                      />
                    </th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider">お客様</th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider">メールアドレス</th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider">注文状況</th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider">総購入額</th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider">最終注文</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="group hover:bg-gray-50/80 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(customer.email)}
                          onChange={() => handleSelectCustomer(customer.email)}
                          className="rounded border-gray-300 text-black focus:ring-black"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{customer.name}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{customer.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                          customer.hasOrders
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {customer.hasOrders ? '購入あり' : '未購入'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        ¥{customer.totalSpent.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {customer.lastOrderDate
                          ? new Date(customer.lastOrderDate).toLocaleDateString('ja-JP')
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default CustomerSupport;

