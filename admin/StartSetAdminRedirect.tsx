'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/** 既存のスタートセットを編集し、未登録なら入力済みの新規作成画面へ案内する。 */
export default function StartSetAdminRedirect() {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase) {
      setError('商品データベースに接続できません。');
      return;
    }

    let active = true;
    supabase
      .from('products')
      .select('id')
      .eq('handle', 'start-set')
      .maybeSingle()
      .then(({ data, error: fetchError }) => {
        if (!active) return;
        if (fetchError) {
          setError(`スタートセットの確認に失敗しました: ${fetchError.message}`);
          return;
        }
        router.replace(data ? '/admin/products/start-set' : '/admin/products/new?template=start-set');
      });

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      {error ? (
        <p role="alert" className="text-sm text-red-600">{error}</p>
      ) : (
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          スタートセット設定を読み込み中…
        </div>
      )}
    </div>
  );
}
