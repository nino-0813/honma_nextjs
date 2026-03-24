'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAdmin } from '@/hooks/useAdmin';
import AdminLayout from '@/admin/AdminLayout';

const AdminLoadingPlaceholder = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-gray-900" />
  </div>
);

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { isAdmin, loading } = useAdmin();
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isLoginPage || typeof window === 'undefined') return;

    const hostname = window.location.hostname;
    const isLocalhost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.includes('localhost');

    if (isLocalhost) return;

    const currentPath = pathname || '/';
    if (currentPath === '/admin') {
      sessionStorage.setItem('basic_auth_passed', 'true');
      return;
    }

    const basicAuthPassed = sessionStorage.getItem('basic_auth_passed');
    if (basicAuthPassed === 'true') return;

    if (currentPath.startsWith('/admin')) {
      sessionStorage.setItem('admin_return_path', currentPath);
      window.location.href = '/admin';
    }
  }, [mounted, pathname, isLoginPage]);

  useEffect(() => {
    if (!mounted || loading || isLoginPage) return;
    if (isAdmin === false) {
      window.location.href = '/admin/login';
    }
  }, [mounted, loading, isAdmin, isLoginPage]);

  // サーバーとクライアントの初期描画を一致させてハイドレーションエラーを防ぐ
  if (!mounted) {
    return isLoginPage ? <>{children}</> : <AdminLoadingPlaceholder />;
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return <AdminLoadingPlaceholder />;
  }

  if (!isAdmin) {
    return <AdminLoadingPlaceholder />;
  }

  return <AdminLayout>{children}</AdminLayout>;
}
