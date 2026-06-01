'use client';

import React, { useEffect, useState } from 'react';
import { loadStripe, type Stripe as StripeJsType } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { supabase } from '@/lib/supabase';

const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise: Promise<StripeJsType | null> | null = STRIPE_PUBLISHABLE_KEY
  ? loadStripe(STRIPE_PUBLISHABLE_KEY)
  : null;

interface SubscriptionCardChangeModalProps {
  isOpen: boolean;
  subscriptionId: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * カード入力 → 確定 → /api/update-payment-method を呼んで
 * subscription の default_payment_method を新カードに切り替える。
 */
function CardForm({
  subscriptionId,
  onSuccess,
  onError,
  onProcessing,
}: {
  subscriptionId: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
  onProcessing: (b: boolean) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    onProcessing(true);
    onError('');
    try {
      const { error: confirmError, setupIntent } = await stripe.confirmSetup({
        elements,
        redirect: 'if_required',
      });
      if (confirmError) {
        throw new Error(confirmError.message || 'カードの登録に失敗しました');
      }
      const pmId =
        typeof setupIntent?.payment_method === 'string'
          ? setupIntent.payment_method
          : setupIntent?.payment_method?.id;
      if (!pmId) {
        throw new Error('支払い方法のIDを取得できませんでした');
      }

      // バックエンドで Customer / Subscription に紐付け
      if (!supabase) throw new Error('supabase 未初期化');
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('セッションが切れています。再ログインしてください。');

      const res = await fetch('/api/update-payment-method', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subscription_id: subscriptionId,
          payment_method_id: pmId,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || 'カード切り替えに失敗しました');
      onSuccess();
    } catch (e: any) {
      onError(e?.message || 'カードの更新に失敗しました');
    } finally {
      setSubmitting(false);
      onProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement onReady={() => setReady(true)} />
      <button
        type="submit"
        disabled={!ready || submitting}
        className="w-full py-2.5 px-4 bg-primary text-white text-sm tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {submitting ? '更新中…' : 'このカードに切り替える'}
      </button>
    </form>
  );
}

export default function SubscriptionCardChangeModal({
  isOpen,
  subscriptionId,
  onClose,
  onSuccess,
}: SubscriptionCardChangeModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [step, setStep] = useState<'loading' | 'form' | 'completed' | 'error'>('loading');
  const [error, setError] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  // モーダルを開いた時 SetupIntent を作成
  useEffect(() => {
    if (!isOpen || !subscriptionId) return;
    setStep('loading');
    setError('');
    setClientSecret(null);
    (async () => {
      try {
        if (!supabase) throw new Error('supabase 未初期化');
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) throw new Error('セッションが切れています。再ログインしてください。');
        const res = await fetch('/api/create-setup-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ subscription_id: subscriptionId }),
        });
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.error || 'カード入力の準備に失敗しました');
        setClientSecret(json.clientSecret);
        setStep('form');
      } catch (e: any) {
        setError(e?.message || 'カード入力の準備に失敗しました');
        setStep('error');
      }
    })();
  }, [isOpen, subscriptionId]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
      onClick={() => {
        if (step === 'completed' || (!processing && step !== 'loading')) onClose();
      }}
    >
      <div
        className="bg-white max-w-md w-full max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {step === 'loading' && (
          <div className="py-8 text-center text-sm text-gray-500">準備中…</div>
        )}
        {step === 'error' && (
          <>
            <h3 className="text-base font-medium mb-3">エラー</h3>
            <p className="text-sm text-red-600 mb-5">{error}</p>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-primary text-white text-sm tracking-widest hover:bg-gray-800 transition-colors"
            >
              閉じる
            </button>
          </>
        )}
        {step === 'form' && clientSecret && stripePromise && (
          <>
            <h3 className="text-base font-medium mb-3">お支払いカードを変更</h3>
            <p className="text-xs text-gray-600 leading-relaxed mb-4">
              新しいクレジットカードを登録すると、次回の決済からこのカードに切り替わります。
            </p>
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: { theme: 'stripe' },
                locale: 'ja',
              }}
            >
              <CardForm
                subscriptionId={subscriptionId!}
                onSuccess={() => {
                  setStep('completed');
                  onSuccess?.();
                }}
                onError={(msg) => setError(msg)}
                onProcessing={(p) => setProcessing(p)}
              />
            </Elements>
            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
            <button
              type="button"
              onClick={onClose}
              disabled={processing}
              className="w-full mt-3 py-2 px-4 bg-white text-primary border border-gray-300 text-sm tracking-widest hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              キャンセル
            </button>
          </>
        )}
        {step === 'form' && !stripePromise && (
          <p className="text-sm text-red-600 py-6">
            Stripe Publishable Key が設定されていないため、カード入力フォームを表示できません。
          </p>
        )}
        {step === 'completed' && (
          <>
            <h3 className="text-base font-medium mb-3">カードを更新しました</h3>
            <p className="text-sm text-gray-700 leading-relaxed mb-5">
              次回の決済から新しいカードでお支払いされます。
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-primary text-white text-sm tracking-widest hover:bg-gray-800 transition-colors"
            >
              閉じる
            </button>
          </>
        )}
      </div>
    </div>
  );
}
