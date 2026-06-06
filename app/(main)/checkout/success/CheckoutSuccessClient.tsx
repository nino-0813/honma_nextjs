'use client';

import React, { useEffect, useState, useContext, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CartContext } from '@/providers/CartProvider';
import { trackPurchase, toAnalyticsItem } from '@/lib/analytics';

const CheckoutSuccess = () => {
  const searchParams = useSearchParams();
  const { clearCart } = useContext(CartContext);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const didClearCartRef = useRef(false);
  // GA4 purchase イベント重複送信防止
  const didFirePurchaseRef = useRef(false);

  // ページ表示時にカートをクリア（初回のみ実行して無限レンダーを防止）
  useEffect(() => {
    if (didClearCartRef.current) return;
    didClearCartRef.current = true;
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    const paymentIntentId = searchParams?.get('payment_intent') ?? null;

    if (paymentIntentId && supabase) {
      const client = supabase;
      const fetchOrder = async () => {
        for (let attempt = 0; attempt < 10; attempt++) {
          try {
            const { data, error } = await client
              .from('orders')
              .select(
                'id, order_number, total, subtotal, shipping_cost, created_at, payment_status, order_items(product_id, product_title, product_price, quantity)'
              )
              .eq('payment_intent_id', paymentIntentId)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (!error && data) {
              if (data.order_number) {
                setOrderNumber(data.order_number);

                // GA4: 購入完了イベント（1回だけ送信、リロード時の重複もガード）
                if (!didFirePurchaseRef.current) {
                  didFirePurchaseRef.current = true;
                  try {
                    const items = Array.isArray((data as any).order_items)
                      ? (data as any).order_items.map((it: any) =>
                          toAnalyticsItem({
                            id: it.product_id ?? 'unknown',
                            title: it.product_title ?? '',
                            price: Number(it.product_price ?? 0),
                            quantity: Number(it.quantity ?? 1),
                          }),
                        )
                      : [];
                    // 同じ payment_intent_id で1回しか送らないよう localStorage で多重送信防止
                    const seenKey = `ga4_purchase_${paymentIntentId}`;
                    if (typeof window !== 'undefined' && !localStorage.getItem(seenKey)) {
                      trackPurchase({
                        transactionId: data.order_number as string,
                        value: Number(data.total ?? 0),
                        shipping: Number((data as any).shipping_cost ?? 0),
                        items,
                      });
                      localStorage.setItem(seenKey, '1');
                    }
                  } catch (gaErr) {
                    console.warn('[GA4 purchase] failed', gaErr);
                  }
                }
                break;
              }
            }
          } catch (err) {
            console.error('注文情報の取得に失敗しました:', err);
          }
          await new Promise((r) => setTimeout(r, 1000));
        }
        setLoading(false);
      };

      fetchOrder();
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  return (
    <main className="min-h-screen bg-white pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* 成功アイコン */}
          <div className="mb-8">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-serif font-medium text-gray-900 mb-4">
            <span className="sm:hidden">
              ご注文
              <br />
              ありがとうございます
            </span>
            <span className="hidden sm:inline">ご注文ありがとうございます</span>
          </h1>

          <p className="text-base md:text-lg text-gray-600 mb-8 leading-relaxed">
            お客様のご注文内容を担当者が確認次第
            <br />
            メールをお送りさせていただきます。
          </p>

          {loading ? (
            <div className="mb-8">
              <div className="inline-block animate-pulse bg-gray-200 h-6 w-48 rounded" />
            </div>
          ) : orderNumber ? (
            <div className="mb-8">
              <p className="text-sm text-gray-500 mb-2">注文番号</p>
              <p className="text-lg font-semibold text-gray-900">{orderNumber}</p>
            </div>
          ) : null}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-primary text-white text-sm tracking-widest uppercase hover:bg-gray-800 transition-colors"
            >
              トップページに戻る
            </Link>
            <Link
              href="/mypage?tab=orders"
              className="inline-block px-8 py-3 bg-white text-gray-900 border border-gray-300 text-sm tracking-widest uppercase hover:bg-gray-50 transition-colors"
            >
              注文履歴を確認
            </Link>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 leading-relaxed">
              ご不明点がございましたら、
              <br />
              <Link href="/contact" className="text-primary hover:underline">
                お問い合わせページ
              </Link>
              よりご連絡ください。
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CheckoutSuccess;
