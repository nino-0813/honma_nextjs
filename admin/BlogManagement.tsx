'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { IconPlus, IconEdit, IconFileText } from '@/components/Icons';

type BlogArticleRow = {
  id: string;
  title: string;
  excerpt: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
};

const BlogManagement = () => {
  const [articles, setArticles] = useState<BlogArticleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data, error: e } = await supabase
        .from('blog_articles')
        .select('id, title, excerpt, is_published, published_at, created_at')
        .order('created_at', { ascending: false });
      if (e) throw e;
      setArticles((data || []) as BlogArticleRow[]);
    } catch (err: any) {
      setError(err?.message || '記事の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">BLOG管理</h1>
          <p className="text-sm text-gray-500 mt-1">ブログ記事の一覧・編集</p>
        </div>
        <Link
          href="/admin/blog/new"
          className="inline-flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
        >
          <IconPlus className="w-4 h-4" />
          新規記事作成
        </Link>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500">読み込み中...</div>
        ) : error ? (
          <div className="p-10 text-center text-red-600">{error}</div>
        ) : articles.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            <IconFileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="mb-4">記事がまだありません</p>
            <Link href="/admin/blog/new" className="text-gray-900 font-medium underline">
              最初の記事を作成
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">タイトル</th>
                  <th className="px-6 py-3">公開</th>
                  <th className="px-6 py-3">作成日</th>
                  <th className="px-6 py-3 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {articles.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{a.title}</span>
                      {a.excerpt && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{a.excerpt}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs ${
                          a.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {a.is_published ? '公開' : '下書き'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(a.created_at).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/blog/${a.id}`}
                        className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900"
                      >
                        <IconEdit className="w-4 h-4" />
                        編集
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default BlogManagement;
