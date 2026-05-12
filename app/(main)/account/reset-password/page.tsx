'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { IconLock, IconLoader2 } from '@/components/Icons';

/**
 * メール内のパスワード再設定リンクの遷移先。
 * Supabase ダッシュボード → Authentication → URL Configuration の Redirect URLs に
 * 本番: https://あなたのドメイン/account/reset-password
 * ローカル: http://localhost:3018/account/reset-password
 * を追加してください。
 */
const ResetPassword = () => {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [canReset, setCanReset] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!supabase) {
      setChecking(false);
      return;
    }

    let cancelled = false;
    let recovered = false;

    const hash = window.location.hash || '';
    const search = window.location.search || '';
    const looksLikeRecoveryLink =
      hash.includes('type=recovery') || new URLSearchParams(search).has('code');

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        recovered = true;
        if (!cancelled) {
          setCanReset(true);
          setChecking(false);
        }
      }
    });

    const finish = () => {
      if (cancelled) return;
      if (!recovered && looksLikeRecoveryLink) {
        setCanReset(true);
      }
      setChecking(false);
    };

    const t = window.setTimeout(finish, looksLikeRecoveryLink ? 2000 : 1200);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.clearTimeout(t);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください。');
      return;
    }
    if (password !== passwordConfirm) {
      setError('パスワードが一致しません。');
      return;
    }
    if (!supabase) {
      setError('設定エラーです。');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
      window.history.replaceState(null, '', window.location.pathname);
      setTimeout(() => router.replace('/mypage'), 2000);
    } catch (err: any) {
      setError(
        err?.message || 'パスワードの更新に失敗しました。リンクの有効期限が切れている可能性があります。'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="pt-24 md:pt-32 pb-24 w-full overflow-x-hidden">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="mb-8 text-center">
          <h1 className="text-xl md:text-2xl font-serif tracking-[0.15em] font-normal mb-2">
            パスワードの再設定
          </h1>
          <p className="text-sm text-gray-500">新しいパスワードを設定してください</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-8">
          {checking ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <IconLoader2 className="w-8 h-8 animate-spin text-gray-600" />
              <p className="text-sm text-gray-500">確認しています...</p>
            </div>
          ) : done ? (
            <div className="space-y-4 text-center">
              <div className="bg-green-50 border border-green-200 text-gray-900 px-4 py-4 rounded-lg text-sm">
                パスワードを更新しました。マイページへ移動します。
              </div>
            </div>
          ) : !supabase ? (
            <div className="text-sm text-red-600 space-y-4">
              <p>Supabase が設定されていません。</p>
              <Link href="/mypage" className="text-black underline">
                ログインへ戻る
              </Link>
            </div>
          ) : !canReset ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                再設定用のリンクが無効か、有効期限が切れています。お手数ですが、再度「パスワードをお忘れの方」からメールを送信してください。
              </p>
              <Link
                href="/mypage"
                className="inline-block w-full py-3 bg-black text-white text-sm tracking-widest uppercase hover:bg-gray-800 transition-colors text-center"
              >
                ログイン画面へ
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-2">
                  新しいパスワード
                </label>
                <div className="relative">
                  <IconLock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-black transition-colors"
                    placeholder="6文字以上"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="new-password-confirm"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  新しいパスワード（確認）
                </label>
                <div className="relative">
                  <IconLock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="new-password-confirm"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-black transition-colors"
                    placeholder="もう一度入力"
                  />
                </div>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-white text-sm tracking-widest uppercase hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <IconLoader2 className="w-4 h-4 animate-spin" />
                    更新中...
                  </>
                ) : (
                  'パスワードを更新'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
};

export default ResetPassword;
