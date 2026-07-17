'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface ReceiptOrderItem {
  id: string;
  product_title: string;
  product_price: number;
  quantity: number;
  line_total: number;
  tax_rate: number;
  shipping_status: 'before_shipping' | 'shipped' | null;
}

interface ReceiptOrder {
  id: string;
  order_number: string | null;
  first_name: string;
  last_name: string;
  created_at: string;
  order_items: ReceiptOrderItem[];
}

const COMPANY_INFO = {
  storeName: 'イケベジオンラインストア',
  companyName: '株式会社naco',
  postalCode: '〒952-0317',
  address: '新潟県佐渡市豊田560番地',
  tel: 'TEL：050-3634-5251',
  mail: 'MAIL：info@ikevege.com',
  registrationNumber: '登録番号：T2020001115396',
};

const ReceiptPage = () => {
  const routeParams = useParams<{ orderId: string; itemId: string }>();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<ReceiptOrder | null>(null);
  const [item, setItem] = useState<ReceiptOrderItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const searchParams = new URLSearchParams(window.location.search);
    setCustomName(searchParams.get('name') || '');
  }, []);

  useEffect(() => {
    const fetchReceipt = async () => {
      if (!supabase || !routeParams?.orderId || !routeParams?.itemId) {
        setError('注文情報が指定されていません');
        setLoading(false);
        return;
      }
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          setError('ログインが必要です');
          setLoading(false);
          return;
        }

        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(
            `
            id, order_number, first_name, last_name, created_at,
            order_items ( id, product_title, product_price, quantity, line_total, tax_rate, shipping_status )
          `
          )
          .eq('id', routeParams.orderId)
          .eq('auth_user_id', session.user.id)
          .single();

        if (orderError || !orderData) {
          setError('注文が見つかりませんでした');
          setLoading(false);
          return;
        }

        const targetItem = ((orderData as any).order_items || []).find(
          (it: ReceiptOrderItem) => it.id === routeParams.itemId
        );
        if (!targetItem) {
          setError('商品明細が見つかりませんでした');
          setLoading(false);
          return;
        }

        setOrder(orderData as unknown as ReceiptOrder);
        setItem(targetItem as ReceiptOrderItem);
      } catch (err) {
        console.error('領収書データ取得エラー:', err);
        setError('領収書データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [routeParams?.orderId, routeParams?.itemId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-4 text-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4" />
          <p className="text-sm text-gray-500">読み込み中...</p>
        </div>
      </main>
    );
  }

  if (error || !order || !item) {
    return (
      <main className="min-h-screen bg-white pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-4 text-center py-16">
          <p className="text-red-600 mb-4">{error || '領収書を表示できませんでした'}</p>
          <Link href="/mypage?tab=orders" className="text-sm text-primary hover:underline">
            購入履歴に戻る
          </Link>
        </div>
      </main>
    );
  }

  if (item.shipping_status !== 'shipped') {
    return (
      <main className="min-h-screen bg-white pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-4 text-center py-16">
          <p className="text-gray-700 mb-4">この商品はまだ発送されていないため、領収書は発行できません。</p>
          <Link href={`/mypage/orders/${order.id}`} className="text-sm text-primary hover:underline">
            注文詳細に戻る
          </Link>
        </div>
      </main>
    );
  }

  const taxRate = item.tax_rate === 8 ? 8 : 10;
  const amountInclTax = item.line_total;
  const amountExclTax = Math.round(amountInclTax / (1 + taxRate / 100));
  const taxAmount = amountInclTax - amountExclTax;
  const recipientName = customName.trim() || `${order.last_name} ${order.first_name}`;
  const orderNumber = order.order_number || order.id.slice(0, 8);

  return (
    <main className="min-h-screen bg-white pt-24 pb-16 print:pt-0 print:pb-0">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center print:hidden">
          <Link
            href={`/mypage/orders/${order.id}`}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            注文詳細に戻る
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm hover:bg-gray-800 transition-colors"
          >
            印刷する
          </button>
        </div>

        <div className="border border-gray-200 rounded-lg p-8 print:border-0">
          <div className="flex justify-between items-start mb-8">
            <h1 className="text-2xl font-serif font-medium text-gray-900">領収書</h1>
            <p className="text-sm text-gray-600">注文日：{formatDate(order.created_at)}</p>
          </div>

          <p className="text-sm text-gray-700 mb-4">下記正に領収致しました。</p>

          <div className="flex items-end justify-between border-b border-gray-300 pb-3 mb-4">
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-gray-600">宛名：</span>
              <span className="text-lg font-medium text-gray-900">{recipientName}</span>
              <span className="text-sm text-gray-600">様</span>
            </div>
            <span className="text-sm text-gray-600">支払方法：クレジットカード</span>
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm text-gray-600">金額</span>
            <span className="text-2xl font-semibold text-gray-900">¥{amountInclTax.toLocaleString()}（税込）</span>
          </div>
          <p className="text-sm text-gray-700 mb-6">但し、お品代として</p>

          <div className="border border-gray-300 rounded-md p-4 mb-6">
            <div className="text-xs text-gray-500 mb-2">内訳</div>
            <div className="flex justify-between text-sm text-gray-900">
              <span>税率 {taxRate}%　金額（税別）</span>
              <span>¥{amountExclTax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-900 mt-1">
              <span>消費税額</span>
              <span>¥{taxAmount.toLocaleString()}</span>
            </div>
          </div>

          <div className="text-sm text-gray-700 mb-8">
            <div>商品名: {item.product_title}</div>
            <div className="mt-1">注文番号: {orderNumber}</div>
          </div>

          <div className="flex justify-end">
            <div className="text-xs text-gray-700 text-right leading-relaxed">
              <div className="font-medium text-gray-900">{COMPANY_INFO.storeName}</div>
              <div>{COMPANY_INFO.companyName}</div>
              <div>{COMPANY_INFO.postalCode}</div>
              <div>{COMPANY_INFO.address}</div>
              <div>{COMPANY_INFO.tel}</div>
              <div>{COMPANY_INFO.mail}</div>
              <div>{COMPANY_INFO.registrationNumber}</div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-gray-200 text-[10px] text-gray-400 leading-relaxed">
            <p>※本紙は、電子的に保持しているご注文データを画面表示したものです。</p>
            <p>
              ※領収書は、商品出荷後（注文履歴に）表示されます。金額はご注文を受付けた時点のもので、ご注文後に変更があった場合は反映されません。
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ReceiptPage;
