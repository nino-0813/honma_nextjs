'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { IconArrowLeft } from '@/components/Icons';
import { LoadingButton } from '@/components/UI';

const BlogEditor = () => {
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const id = params?.id as string | undefined;
  const isNew = !id || id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    if (isNew) {
      setLoading(false);
      return;
    }
    const client = supabase;
    if (!client || !id) return;
    const load = async () => {
      const { data, error: e } = await client
        .from('blog_articles')
        .select('*')
        .eq('id', id)
        .single();
      if (e) {
        setLoading(false);
        return;
      }
      if (data) {
        setTitle(data.title || '');
        setContent(data.content || '');
        setExcerpt(data.excerpt || '');
        setIsPublished(data.is_published ?? false);
      }
      setLoading(false);
    };
    load();
  }, [id, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = supabase;
    if (!client) return;
    if (!title.trim()) {
      alert('タイトルを入力してください');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        content: content.trim() || '',
        excerpt: excerpt.trim() || null,
        is_published: isPublished,
        published_at: isPublished ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };
      if (isNew) {
        const { error: insertErr } = await client.from('blog_articles').insert([payload]);
        if (insertErr) throw insertErr;
        router.push('/admin/blog');
        return;
      }
      const { error: updateErr } = await client
        .from('blog_articles')
        .update(payload)
        .eq('id', id);
      if (updateErr) throw updateErr;
      router.push('/admin/blog');
    } catch (err: any) {
      alert(err?.message || '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/blog" className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <IconArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">
            {isNew ? '新規記事' : '記事編集'}
          </h1>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="max-w-3xl space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">タイトル *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">抜粋</label>
          <input
            type="text"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="一覧表示用の短い説明"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">本文</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPublished"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="rounded border-gray-300"
          />
          <label htmlFor="isPublished" className="text-sm text-gray-700">公開する</label>
        </div>
        <div className="flex gap-3 pt-4">
          <LoadingButton
            type="submit"
            loading={saving}
            className="bg-gray-900 text-white px-6 py-2 rounded-md text-sm font-medium"
          >
            {isNew ? '作成' : '更新'}
          </LoadingButton>
          <Link href="/admin/blog" className="px-4 py-2 border border-gray-200 rounded-md text-sm hover:bg-gray-50">
            キャンセル
          </Link>
        </div>
      </form>
    </>
  );
};

export default BlogEditor;
