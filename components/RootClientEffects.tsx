'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView } from '@/lib/analytics';

export default function RootClientEffects() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const currentPath = window.location.pathname || '/';
    const hash = window.location.hash;

    if (currentPath === '/' && hash && hash.startsWith('#/admin')) {
      const path = hash.slice(1);
      window.location.replace(path + window.location.search);
      return;
    }

    const isPasswordRecoveryHash = hash.includes('type=recovery');
    if (isPasswordRecoveryHash && !currentPath.includes('account/reset-password')) {
      window.location.replace(
        `${window.location.origin}/account/reset-password${window.location.search}${hash}`
      );
      return;
    }

    if (hash.includes('access_token=') && !isPasswordRecoveryHash) {
      const redirectPath = localStorage.getItem('auth_redirect');
      if (redirectPath) {
        const path = redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`;
        localStorage.removeItem('auth_redirect');
        window.location.replace(path + window.location.search + window.location.hash);
        return;
      }
    }

    const adminReturnPath = sessionStorage.getItem('admin_return_path');
    if (adminReturnPath && (currentPath === '/' || currentPath === '/index.html' || currentPath === '/admin')) {
      sessionStorage.setItem('basic_auth_passed', 'true');
      sessionStorage.removeItem('admin_return_path');
      const nextPath = adminReturnPath.startsWith('/') ? adminReturnPath : `/${adminReturnPath}`;
      window.location.replace(nextPath);
      return;
    }

    if (currentPath === '/admin' && !adminReturnPath) {
      sessionStorage.setItem('basic_auth_passed', 'true');
    }

    // GA4: 初回表示と Next.js のクライアント遷移を1回ずつ計測する。
    // layout 側は send_page_view: false のため、ここが page_view の唯一の送信元。
    trackPageView(`${currentPath}${window.location.search}`);
  }, [pathname]);

  return null;
}
