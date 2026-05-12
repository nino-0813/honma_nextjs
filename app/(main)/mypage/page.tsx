import { Suspense } from 'react';
import MyPageClient from './MyPageClient';

export const dynamic = 'force-dynamic';

export default function MyPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4" />
            <p className="text-sm text-gray-500">読み込み中...</p>
          </div>
        </div>
      }
    >
      <MyPageClient />
    </Suspense>
  );
}
