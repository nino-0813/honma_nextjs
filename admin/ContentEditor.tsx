'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  IconArrowLeft,
  IconCalendar,
  IconEdit,
  IconEye,
  IconMonitor,
  IconTrash,
} from '@/components/Icons';
import {
  mockContent,
  getContentTypeLabel,
  getContentStatusColor,
  getContentStatusLabel,
} from '@/admin/contentData';
import { LoadingButton } from '@/components/UI';

type ContentEditorProps = {
  contentId?: string;
};

const ContentEditor = ({ contentId }: ContentEditorProps) => {
  const router = useRouter();
  const isNew = !contentId || contentId === 'new';
  const existingContent = useMemo(
    () => mockContent.find((item) => item.id === contentId) ?? null,
    [contentId]
  );

  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(existingContent?.title ?? '');
  const [type, setType] = useState<'page' | 'blog' | 'announcement'>(existingContent?.type ?? 'page');
  const [status, setStatus] = useState<'published' | 'draft' | 'archived'>(existingContent?.status ?? 'draft');
  const [author, setAuthor] = useState(existingContent?.author ?? 'Admin');
  const [updatedAt, setUpdatedAt] = useState(existingContent?.updatedAt ?? new Date().toISOString().slice(0, 10));
  const [views, setViews] = useState(String(existingContent?.views ?? 0));
  const [summary, setSummary] = useState(
    existingContent
      ? `${existingContent.title}に関する説明文がここに入ります。`
      : '新しいコンテンツの概要を入力してください。'
  );
  const [body, setBody] = useState(
    existingContent
      ? 'これはモックのコンテンツ編集画面です。本文エリアの見た目と導線を合わせるための仮データを表示しています。'
      : '本文をここに入力します。ページ、ブログ、お知らせの下書き作成に使う想定です。'
  );

  const handleSave = async () => {
    if (!title.trim()) {
      alert('タイトルを入力してください');
      return;
    }

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    setLoading(false);
    alert('モックのため保存先は未接続ですが、編集画面は利用できるようにしました。');
    router.push('/admin/content');
  };

  const handleDelete = () => {
    if (!existingContent) {
      router.push('/admin/content');
      return;
    }
    if (window.confirm('このコンテンツを削除しますか？')) {
      alert('モックのため実データ削除は行っていません。');
      router.push('/admin/content');
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/content" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
            <IconArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{isNew ? '新規コンテンツ作成' : 'コンテンツ編集'}</h1>
            <p className="text-sm text-gray-500 mt-1">元の管理画面に合わせたモック編集ページです。</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isNew && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <IconTrash className="w-4 h-4" />
                削除
              </span>
            </button>
          )}
          <Link href="/admin/content" className="text-sm text-gray-500 hover:text-gray-900 transition-colors px-4 py-2">
            キャンセル
          </Link>
          <LoadingButton
            onClick={handleSave}
            loading={loading}
            className="bg-black text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-all shadow-sm hover:shadow"
          >
            保存する
          </LoadingButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">タイトル</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all bg-white"
                  placeholder="コンテンツのタイトル"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">概要</label>
                <textarea
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all bg-white resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">本文</label>
                <textarea
                  rows={14}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-base font-medium text-gray-900 mb-4">公開設定</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">タイプ</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as 'page' | 'blog' | 'announcement')}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all bg-white"
                >
                  <option value="page">ページ</option>
                  <option value="blog">ブログ</option>
                  <option value="announcement">お知らせ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'published' | 'draft' | 'archived')}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all bg-white"
                >
                  <option value="draft">下書き</option>
                  <option value="published">公開中</option>
                  <option value="archived">アーカイブ</option>
                </select>
              </div>

              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getContentStatusColor(status)}`}>
                {getContentStatusLabel(status)}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-base font-medium text-gray-900 mb-4">メタ情報</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">作成者</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">更新日</label>
                <div className="relative">
                  <IconCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={updatedAt}
                    onChange={(e) => setUpdatedAt(e.target.value)}
                    className="w-full pl-10 p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">閲覧数</label>
                <input
                  type="number"
                  min="0"
                  value={views}
                  onChange={(e) => setViews(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all bg-white"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-base font-medium text-gray-900 mb-4">プレビュー</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <IconMonitor className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">タイプ</p>
                  <p className="text-sm font-medium text-gray-900">{getContentTypeLabel(type)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <IconEye className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">閲覧数</p>
                  <p className="text-sm font-medium text-gray-900">{Number(views || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <IconEdit className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">タイトル長</p>
                  <p className="text-sm font-medium text-gray-900">{title.length} 文字</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContentEditor;
