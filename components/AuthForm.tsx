import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { IconMail, IconLock, IconLoader2 } from './Icons';

interface AuthFormProps {
  onAuthSuccess: (email: string, userData: any) => void;
  initialEmail?: string;
}

const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess, initialEmail = '' }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [signUpCompleted, setSignUpCompleted] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [lastResendTime, setLastResendTime] = useState<number | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  // 再送クールタイムの管理（60秒）
  const RESEND_COOLDOWN_SECONDS = 60;
  
  useEffect(() => {
    if (lastResendTime === null) return;
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastResendTime) / 1000);
      const remaining = RESEND_COOLDOWN_SECONDS - elapsed;
      
      if (remaining <= 0) {
        setResendCooldown(0);
        setLastResendTime(null);
        clearInterval(interval);
      } else {
        setResendCooldown(remaining);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [lastResendTime]);

  // エラーメッセージを日本語に変換
  const translateError = (errorMessage: string): string => {
    const message = errorMessage.toLowerCase();
    
    if (message.includes('email rate limit exceeded') || message.includes('rate limit')) {
      return 'メール送信の回数制限に達しました。しばらく時間をおいてから再度お試しください。';
    }
    if (message.includes('user already registered') || message.includes('already registered')) {
      return 'このメールアドレスは既に登録されています。ログインしてください。';
    }
    if (message.includes('invalid email')) {
      return 'メールアドレスの形式が正しくありません。';
    }
    if (message.includes('password')) {
      return 'パスワードが正しくありません。';
    }
    if (message.includes('email not confirmed')) {
      return 'メールアドレスが認証されていません。';
    }
    
    // その他のエラーはそのまま返す（既に日本語の可能性もある）
    return errorMessage;
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setResendError(null);
    setEmailNotConfirmed(false);
    setShowResendButton(false);

    if (!supabase) {
      setError('Supabaseが設定されていません。.env.local に NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY を設定してください。');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // サインアップ（メール認証なしで即座にログイン状態にする）
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // 確認メールを送らない設定（Supabaseダッシュボードで「Email confirmation required」を無効にする必要あり）
            emailRedirectTo: undefined,
          },
        });

        if (signUpError) throw signUpError;

        // 新規登録成功時、sessionがあれば即座にログイン状態にする（ただし遷移はしない）
        if (data?.session && data?.user) {
          setSignUpCompleted(true);
          setSignUpSuccess(true);
          setPassword('');
          // 新規登録成功フラグを保存（MyPage側でマイページの内容を表示しないようにするため）
          localStorage.setItem('signUpSuccess', 'true');
          // ログイン状態にするが、マイページには遷移しない
          // onAuthSuccessは呼ばない（遷移を防ぐため）
        } else if (data?.user) {
          // sessionが無い場合（Supabase設定で確認メール必須の場合）でも、ユーザー情報は返される
          setSignUpCompleted(true);
          setSignUpSuccess(true);
          setPassword('');
          // 新規登録成功フラグを保存
          localStorage.setItem('signUpSuccess', 'true');
          // ログイン状態にするが、マイページには遷移しない
          // onAuthSuccessは呼ばない（遷移を防ぐため）
        }
      } else {
        // ログイン
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        if (data.user) {
          onAuthSuccess(email, data.user);
        }
      }
    } catch (err: any) {
      console.error('認証エラー:', err);
      const errorMessage = err?.message || '認証に失敗しました';
      const translatedError = translateError(errorMessage);
      
      if (!isSignUp && err?.message === 'Email not confirmed') {
        setEmailNotConfirmed(true);
        setShowResendButton(true);
        setError(null);
      } else {
        // 新規登録時はメール認証なしなので、レート制限エラーでも再送ボタンは表示しない
        setError(translatedError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!supabase) {
      setResendError('Supabaseが設定されていません');
      return;
    }
    if (!email) {
      setResendError('メールアドレスを入力してください');
      return;
    }
    
    // クールタイムチェック
    if (resendCooldown > 0) {
      setResendError(`${resendCooldown}秒後に再度お試しください。`);
      return;
    }

    setResendLoading(true);
    setResendError(null);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      if (error) throw error;
      
      // 送信成功時、クールタイムを開始
      setLastResendTime(Date.now());
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      alert('確認メールを再送しました。メールをご確認ください。');
    } catch (err: any) {
      console.error('確認メール再送エラー:', err);
      const errorMessage = err?.message || 'メールの再送に失敗しました。時間をおいて再度お試しください。';
      setResendError(translateError(errorMessage));
      
      // レート制限エラーの場合もクールタイムを開始
      if (errorMessage.toLowerCase().includes('rate limit')) {
        setLastResendTime(Date.now());
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
      }
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    setEmailNotConfirmed(false);
    setResendError(null);

    if (!supabase) {
      setError('Supabaseが設定されていません。.env.local に NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY を設定してください。');
      setLoading(false);
      return;
    }

    try {
      // ログイン後のリダイレクト先を保存
      // 現在のパスが /checkout を含む場合、明示的に保存
      if (typeof window !== 'undefined' && (window.location.pathname || '').includes('checkout')) {
        localStorage.setItem('auth_redirect', '/checkout');
      }

      // ハッシュを含まないベースURLをリダイレクト先に指定
      // Google等のプロバイダはハッシュ(#)を含むURLへのリダイレクトをサポートしていない場合があるため
      const redirectUrl = window.location.origin;
      
      const { data, error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (googleError) throw googleError;
      // OAuth認証はリダイレクトが発生するため、ここでloadingをfalseにしない
    } catch (err: any) {
      console.error('Google認証エラー:', err);
      setError(err.message || 'Google認証に失敗しました');
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-6 w-full overflow-x-hidden ${isSignUp ? 'bg-white p-6 md:p-8 rounded-lg border border-gray-200 shadow-md' : ''}`}>
      <div>
        {isSignUp ? (
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">新規登録</h2>
              <span className="text-xs font-semibold text-white bg-black px-3 py-1 rounded-full">NEW</span>
            </div>
            <p className="text-sm md:text-base text-gray-600">
              新規アカウントを作成して始めましょう
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-medium mb-2">アカウント</h2>
            <p className="text-sm text-gray-500">
              既存のアカウントでログイン
            </p>
          </div>
        )}
      </div>

      {/* 新規登録成功時のメッセージとボタン */}
      {isSignUp && signUpSuccess ? (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 text-gray-900 px-6 py-4 rounded-lg">
            <p className="text-sm md:text-base font-medium">
              会員登録ありがとうございます。
            </p>
            <p className="text-sm md:text-base mt-1">
              引き続きお買い物をお楽しみください。
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="/collections"
              className="flex-1 py-3 bg-black text-white text-sm tracking-widest uppercase hover:bg-gray-800 transition-colors text-center"
            >
              商品ページへ
            </a>
            <a
              href="/"
              className="flex-1 py-3 bg-white text-black border border-gray-200 text-sm tracking-widest uppercase hover:bg-gray-50 transition-colors text-center"
            >
              ホームへ
            </a>
          </div>
        </div>
      ) : (
        <>
          {/* Google認証 */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="font-medium text-gray-700">Googleで続ける</span>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">または</span>
            </div>
          </div>

          {/* メール/パスワード認証 */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
        <div>
          <label htmlFor="auth-email" className="block text-sm font-medium text-gray-700 mb-2">
            メールアドレス
          </label>
          <div className="relative">
            <IconMail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              id="auth-email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailNotConfirmed(false);
                setResendError(null);
              }}
              required
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-black transition-colors"
              placeholder="example@email.com"
            />
          </div>
        </div>

        {!signUpCompleted && (
          <div>
            <label htmlFor="auth-password" className="block text-sm font-medium text-gray-700 mb-2">
              パスワード
            </label>
            <div className="relative">
              <IconLock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                id="auth-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-black transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-gray-50 border border-gray-200 text-gray-900 px-4 py-4 rounded-lg text-sm md:text-base whitespace-pre-line leading-relaxed">
            {message}
          </div>
        )}

        {!signUpCompleted && (
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white text-sm tracking-widest uppercase hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <IconLoader2 className="w-4 h-4 animate-spin" />
                <span>処理中...</span>
              </>
            ) : (
              <span>{isSignUp ? 'アカウントを作成' : 'ログイン'}</span>
            )}
          </button>
        )}
      </form>
        </>
      )}

      {/* Email not confirmed の場合のUI（ログイン時のみ） */}
      {!isSignUp && showResendButton && emailNotConfirmed && (
        <div className="space-y-3">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm whitespace-pre-line">
            このメールアドレスはまだ認証されていません。
            {'\n'}
            登録時に送信されたメールをご確認ください。
          </div>
          <button
            type="button"
            onClick={handleResendConfirmation}
            disabled={resendLoading || !email || resendCooldown > 0}
            className="w-full py-3 bg-white text-black border border-gray-200 text-sm tracking-widest hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendLoading ? '再送中...' : resendCooldown > 0 ? `確認メールを再送する（${resendCooldown}秒後）` : '確認メールを再送する'}
          </button>
          {resendError && <p className="text-sm text-red-600 mt-2">{resendError}</p>}
          {resendCooldown > 0 && !resendError && (
            <p className="text-sm text-gray-500 mt-2">
              メール送信の回数制限のため、{resendCooldown}秒後に再度お試しください。
            </p>
          )}
        </div>
      )}

      {/* ログイン/新規登録切り替えボタン（新規登録成功時は非表示） */}
      {!signUpSuccess && (
        <div className="text-center">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError(null);
            setMessage(null);
            setSignUpCompleted(false);
            setSignUpSuccess(false);
            setShowResendButton(false);
            setEmailNotConfirmed(false);
            setResendError(null);
            setResendCooldown(0);
            setLastResendTime(null);
            setEmailNotConfirmed(false);
            setResendError(null);
            // 新規登録成功フラグをクリア
            localStorage.removeItem('signUpSuccess');
          }}
          className="text-sm text-gray-500 hover:text-black transition-colors"
        >
            {isSignUp ? (
              <>既にアカウントをお持ちですか？ <span className="font-medium text-primary">ログイン</span></>
            ) : (
              <>アカウントをお持ちでない方は <span className="font-medium text-primary">新規登録</span></>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default AuthForm;

