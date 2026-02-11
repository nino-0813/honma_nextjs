'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { convertImageToWebP } from '@/lib/imageUtils';
import { IconEdit, IconTrash, IconRefreshCw, IconPlus, IconExternalLink, IconFileText } from '@/components/Icons';
import { IconX, IconImage, IconList, IconHash, IconQuote, IconCode, IconMinus, IconPaperclip, IconTable, IconMic, IconSparkles, IconDollarSign, IconLink } from '@/components/Icons';
import { LoadingButton } from '@/components/UI';

interface BlogArticle {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  image_url?: string;
  note_url?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
  is_published: boolean;
}

const BlogManagement = () => {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [noteRssUrl, setNoteRssUrl] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [inlineLoading, setInlineLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // インライン作成用のブロックエディタ状態
  type BlockType = 'paragraph' | 'heading1' | 'heading2' | 'image' | 'bulletList' | 'numberedList' | 'quote' | 'code' | 'divider' | 'toc' | 'embed' | 'file';
  interface Block {
    id: string;
    type: BlockType;
    content: string;
    imageUrl?: string;
    listItems?: string[];
    embedUrl?: string;
    fileUrl?: string;
    fileName?: string;
  }

  const generateId = () => `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const [inlineTitle, setInlineTitle] = useState('');
  const [inlineExcerpt, setInlineExcerpt] = useState('');
  const [inlineImageUrl, setInlineImageUrl] = useState('');
  const [inlineNoteUrl, setInlineNoteUrl] = useState('');
  const [inlinePublishedAt, setInlinePublishedAt] = useState('');
  const [inlineIsPublished, setInlineIsPublished] = useState(false);
  const [inlineBlocks, setInlineBlocks] = useState<Block[]>([
    { id: generateId(), type: 'paragraph', content: '' },
  ]);
  const [inlineBlockMenu, setInlineBlockMenu] = useState<string | null>(null);
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_articles')
        .select('*')
        .order('published_at', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('記事の取得に失敗しました:', error);
      setMessage({ type: 'error', text: '記事の取得に失敗しました' });
    } finally {
      setLoading(false);
    }
  };

  const fetchFromNote = async () => {
    if (!noteRssUrl.trim()) {
      setMessage({ type: 'error', text: 'noteのRSS URLを入力してください' });
      return;
    }

    try {
      setFetching(true);
      setMessage(null);

      // APIエンドポイントを呼び出し
      const response = await fetch('/api/fetch-note-articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rssUrl: noteRssUrl }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '記事の取得に失敗しました');
      }

      setMessage({ 
        type: 'success', 
        text: `${result.count || 0}件の記事を取得しました` 
      });
      
      // 記事一覧を再取得
      await fetchArticles();
    } catch (error) {
      console.error('noteからの記事取得に失敗しました:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : '記事の取得に失敗しました' 
      });
    } finally {
      setFetching(false);
    }
  };

  const togglePublish = async (articleId: string, currentStatus: boolean) => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('blog_articles')
        .update({ is_published: !currentStatus })
        .eq('id', articleId);

      if (error) throw error;
      await fetchArticles();
      setMessage({ type: 'success', text: '公開状態を更新しました' });
    } catch (error) {
      console.error('公開状態の更新に失敗しました:', error);
      setMessage({ type: 'error', text: '公開状態の更新に失敗しました' });
    }
  };

  const deleteArticle = async (articleId: string) => {
    if (!window.confirm('本当にこの記事を削除しますか？')) return;

    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('blog_articles')
        .delete()
        .eq('id', articleId);

      if (error) throw error;
      await fetchArticles();
      setMessage({ type: 'success', text: '記事を削除しました' });
    } catch (error) {
      console.error('記事の削除に失敗しました:', error);
      setMessage({ type: 'error', text: '記事の削除に失敗しました' });
    }
  };

  const hiddenFileInput = React.useRef<HTMLInputElement>(null);

  // Supabase Storage に画像をアップロードして公開URLを返す（WebP形式で保存）
  const uploadImageFile = async (file: File) => {
    if (!supabase) {
      throw new Error('Supabaseが未設定です');
    }
    const webpFile = await convertImageToWebP(file);
    const fileName = `blog/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
    const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, webpFile, {
    cacheControl: 'public, max-age=31536000, immutable',
    upsert: true,
    contentType: 'image/webp',
  });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
    return data.publicUrl;
  };

  // 画像アップロード処理（ファイル選択時）
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, blockId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const imageUrl = await uploadImageFile(file);
      if (blockId) {
        updateInlineBlock(blockId, { imageUrl });
      }
    } catch (err: any) {
      console.error('画像アップロードに失敗しました:', err);
      alert('画像のアップロードに失敗しました。時間をおいて再度お試しください。');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const hiddenHeaderFileInput = React.useRef<HTMLInputElement>(null);
  const hiddenFileUploadInput = React.useRef<HTMLInputElement>(null);

  // 汎用ファイルアップロード（埋め込み以外のファイル：動画mp4など）
  const uploadAnyFile = async (file: File) => {
    if (!supabase) throw new Error('Supabaseが未設定です');
    const ext = (file.name.split('.').pop() || 'dat').toLowerCase();
    const contentTypeMap: Record<string, string> = {
      mp4: 'video/mp4',
      webm: 'video/webm',
      webp: 'image/webp',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
    };
    const contentType = contentTypeMap[ext] || file.type || 'application/octet-stream';
    const fileName = `blog/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file, {
      cacheControl: 'public, max-age=31536000, immutable',
      upsert: true,
      contentType,
    });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
    return { publicUrl: data.publicUrl, fileName };
  };

  const handleHeaderImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const url = await uploadImageFile(file);
      setInlineImageUrl(url);
    } catch (err: any) {
      console.error('ヘッダー画像アップロードに失敗しました:', err);
      alert('ヘッダー画像のアップロードに失敗しました。時間をおいて再度お試しください。');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // ブロックエディタユーティリティ（インライン）
  const addInlineBlock = (afterId: string, type: BlockType) => {
    const newBlock: Block = {
      id: generateId(),
      type,
      content: '',
      ...(type === 'bulletList' || type === 'numberedList' ? { listItems: [''] } : {}),
    };
    const idx = inlineBlocks.findIndex((b) => b.id === afterId);
    const next = [...inlineBlocks];
    next.splice(idx + 1, 0, newBlock);
    setInlineBlocks(next);
    setInlineBlockMenu(null);
    return newBlock.id;
  };

  const isBlockEmpty = (block: Block) => {
    const noText = !block.content || block.content.trim() === '';
    const noImg = !block.imageUrl;
    const noList = !block.listItems || block.listItems.every(i => !i || i.trim() === '');
    const noEmbed = !block.embedUrl;
    const noFile = !block.fileUrl;
    if (block.type === 'embed') return noEmbed && noText;
    if (block.type === 'file') return noFile && noText;
    if (block.type === 'toc') return false; // toc は明示的に削除しない限り残す（空扱いしない）
    return noText && noImg && noList;
  };

  const resetForType = (type: BlockType): Partial<Block> => {
    if (type === 'bulletList' || type === 'numberedList') {
      return { type, content: '', listItems: [''], imageUrl: undefined };
    }
    return { type, content: '', listItems: undefined, imageUrl: undefined };
  };

  const openImagePicker = (blockId: string) => {
    if (hiddenFileInput.current) {
      hiddenFileInput.current.setAttribute('data-block-id', blockId);
      hiddenFileInput.current.click();
    }
  };

  const focusBlock = (blockId?: string) => {
    if (!blockId) return;
    const el = document.querySelector<HTMLElement>(`[data-block-id="${blockId}"]`);
    if (el) {
      el.focus();
    }
  };

  const getPrevBlockId = (blockId: string) => {
    const idx = inlineBlocks.findIndex(b => b.id === blockId);
    if (idx > 0) return inlineBlocks[idx - 1].id;
    return undefined;
  };

  const handleSelectBlockType = (blockId: string, type: BlockType, options?: { openImagePicker?: boolean }) => {
    const target = inlineBlocks.find(b => b.id === blockId);
    if (!target) return;

    // 空ブロックならタイプを置き換え、そうでなければ新しいブロックを追加
    if (isBlockEmpty(target)) {
      updateInlineBlock(blockId, resetForType(type));
      setInlineBlockMenu(null);
      if (type === 'image' && options?.openImagePicker) {
        // 少し遅延させてからファイルピッカーを開く
        setTimeout(() => openImagePicker(blockId), 10);
      }
    } else {
      const newId = addInlineBlock(blockId, type);
      if (type === 'image' && options?.openImagePicker) {
        setTimeout(() => openImagePicker(newId), 10);
      } else {
        setTimeout(() => focusBlock(newId), 10);
      }
    }
  };

  const handleEnterBackspace = (e: React.KeyboardEvent, block: Block) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const newId = addInlineBlock(block.id, 'paragraph');
      setTimeout(() => focusBlock(newId), 10);
      return;
    }
    if ((e.key === 'Backspace' || e.key === 'Delete') && isBlockEmpty(block) && inlineBlocks.length > 1) {
      e.preventDefault();
      const prevId = getPrevBlockId(block.id);
      deleteInlineBlock(block.id);
      setTimeout(() => focusBlock(prevId), 10);
    }
  };

  // Drag & Drop for blocks
  const handleDragStart = (blockId: string) => {
    setDraggingBlockId(blockId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, overId: string) => {
    e.preventDefault();
    if (draggingBlockId === overId) return;
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    const sourceId = draggingBlockId;
    setDraggingBlockId(null);
    if (!sourceId || sourceId === targetId) return;
    const current = [...inlineBlocks];
    const from = current.findIndex(b => b.id === sourceId);
    const to = current.findIndex(b => b.id === targetId);
    if (from === -1 || to === -1) return;
    const [moved] = current.splice(from, 1);
    current.splice(to, 0, moved);
    setInlineBlocks(current);
  };

  const deleteInlineBlock = (blockId: string) => {
    if (inlineBlocks.length === 1) {
      alert('最低1つのブロックが必要です');
      return;
    }
    setInlineBlocks(inlineBlocks.filter((b) => b.id !== blockId));
  };

  const updateInlineBlock = (blockId: string, updates: Partial<Block>) => {
    setInlineBlocks(inlineBlocks.map((b) => (b.id === blockId ? { ...b, ...updates } : b)));
  };

  const addInlineListItem = (blockId: string) => {
    setInlineBlocks(
      inlineBlocks.map((b) =>
        b.id === blockId ? { ...b, listItems: [...(b.listItems || []), ''] } : b
      )
    );
  };

  const updateInlineListItem = (blockId: string, idx: number, value: string) => {
    setInlineBlocks(
      inlineBlocks.map((b) =>
        b.id === blockId
          ? { ...b, listItems: (b.listItems || []).map((item, i) => (i === idx ? value : item)) }
          : b
      )
    );
  };

  const deleteInlineListItem = (blockId: string, idx: number) => {
    setInlineBlocks(
      inlineBlocks.map((b) =>
        b.id === blockId
          ? { ...b, listItems: (b.listItems || []).filter((_, i) => i !== idx) }
          : b
      )
    );
  };

  const inlineContentJson = () => JSON.stringify(inlineBlocks);

  const inlineFirstImage = () =>
    inlineImageUrl.trim() ||
    inlineBlocks.find((b) => b.type === 'image' && b.imageUrl)?.imageUrl ||
    '';

  const handleInlineSave = async () => {
    if (!inlineTitle.trim()) {
      alert('タイトルを入力してください');
      return;
    }
    if (inlineBlocks.length === 0 || inlineBlocks.every((b) => !b.content.trim() && !b.imageUrl)) {
      alert('本文を入力してください');
      return;
    }
    if (!supabase) {
      alert('Supabaseが未設定です');
      return;
    }

    try {
      setInlineLoading(true);
      setMessage(null);

      const payload: any = {
        title: inlineTitle.trim(),
        content: inlineContentJson(),
        excerpt: inlineExcerpt.trim() || null,
        image_url: inlineFirstImage() || null,
        note_url: inlineNoteUrl.trim() || null,
        published_at: inlinePublishedAt ? new Date(inlinePublishedAt).toISOString() : null,
        is_published: inlineIsPublished,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('blog_articles').insert(payload);
      if (error) throw error;

      setMessage({ type: 'success', text: '記事を作成しました' });
      // リセット
      setInlineTitle('');
      setInlineExcerpt('');
      setInlineImageUrl('');
      setInlineNoteUrl('');
      setInlinePublishedAt('');
      setInlineIsPublished(false);
      setInlineBlocks([{ id: generateId(), type: 'paragraph', content: '' }]);

      await fetchArticles();
    } catch (error) {
      console.error('インライン作成エラー:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : '記事の作成に失敗しました',
      });
    } finally {
      setInlineLoading(false);
    }
  };

  const InlineBlockMenu = ({ blockId }: { blockId: string }) => (
    <div className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-100 z-50 w-64 overflow-hidden animate-fade-in-up">
      <div className="p-2 grid grid-cols-1 gap-0.5 max-h-[400px] overflow-y-auto">
        <p className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">挿入</p>
        
        <button
          onClick={() => alert('AIアシスタント機能は準備中です')}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
        >
          <IconSparkles className="w-4 h-4" />
          <span>AIアシスタント</span>
        </button>

        <button
          onClick={() => handleSelectBlockType(blockId, 'image', { openImagePicker: true })}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
        >
          <IconImage className="w-4 h-4" />
          <span>画像</span>
        </button>

        <button
          onClick={() => alert('音声機能は準備中です')}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
        >
          <IconMic className="w-4 h-4" />
          <span>音声</span>
        </button>

        <button
          onClick={() => alert('埋め込み機能は準備中です')}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
        >
          <IconLink className="w-4 h-4" />
          <span>埋め込み</span>
        </button>

        <button
          onClick={() => alert('ファイル機能は準備中です')}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
        >
          <IconPaperclip className="w-4 h-4" />
          <span>ファイル</span>
        </button>

        <button
          onClick={() => alert('目次機能は準備中です')}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
        >
          <IconTable className="w-4 h-4" />
          <span>目次</span>
        </button>

        <button
          onClick={() => { addInlineBlock(blockId, 'paragraph'); setInlineBlockMenu(null); }}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
        >
          <IconFileText className="w-4 h-4" />
          <span>段落</span>
        </button>

        <button
          onClick={() => { addInlineBlock(blockId, 'heading1'); setInlineBlockMenu(null); }}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
        >
          <IconHash className="w-4 h-4" />
          <span>大見出し</span>
        </button>

        <button
          onClick={() => { addInlineBlock(blockId, 'heading2'); setInlineBlockMenu(null); }}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
        >
          <IconHash className="w-4 h-4" />
          <span>小見出し</span>
        </button>

        <button
          onClick={() => { addInlineBlock(blockId, 'bulletList'); setInlineBlockMenu(null); }}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
        >
          <IconList className="w-4 h-4" />
          <span>箇条書きリスト</span>
        </button>

        <button
          onClick={() => { addInlineBlock(blockId, 'numberedList'); setInlineBlockMenu(null); }}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
        >
          <IconList className="w-4 h-4" />
          <span>番号付きリスト</span>
        </button>

        <button
          onClick={() => { addInlineBlock(blockId, 'quote'); setInlineBlockMenu(null); }}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
        >
          <IconQuote className="w-4 h-4" />
          <span>引用</span>
        </button>

        <button
          onClick={() => { addInlineBlock(blockId, 'code'); setInlineBlockMenu(null); }}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
        >
          <IconCode className="w-4 h-4" />
          <span>コード</span>
        </button>

        <button
          onClick={() => { addInlineBlock(blockId, 'divider'); setInlineBlockMenu(null); }}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
        >
          <IconMinus className="w-4 h-4" />
          <span>区切り線</span>
        </button>

        <button
          onClick={() => alert('有料エリア指定は準備中です')}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
        >
          <IconDollarSign className="w-4 h-4" />
          <span>有料エリア指定</span>
        </button>

        <div className="h-px bg-gray-100 my-1"></div>
        
        <button
          onClick={() => deleteInlineBlock(blockId)}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors text-left"
        >
          <IconTrash className="w-4 h-4" />
          <span>このブロックを削除</span>
        </button>
      </div>
    </div>
  );

  const renderInlineBlock = (block: Block) => {
    const commonInputClass = "w-full border-none outline-none bg-transparent leading-relaxed placeholder-gray-300";
    
    switch (block.type) {
      case 'heading1':
        return (
          <input
            type="text"
            value={block.content}
            data-block-id={block.id}
            onChange={(e) => updateInlineBlock(block.id, { content: e.target.value })}
            onKeyDown={(e) => {
              handleEnterBackspace(e, block);
            }}
            placeholder="大見出し"
            className={`${commonInputClass} text-2xl font-bold py-2`}
          />
        );
      case 'heading2':
        return (
          <input
            type="text"
            value={block.content}
            data-block-id={block.id}
            onChange={(e) => updateInlineBlock(block.id, { content: e.target.value })}
            onKeyDown={(e) => {
              handleEnterBackspace(e, block);
            }}
            placeholder="見出し"
            className={`${commonInputClass} text-xl font-bold py-2`}
          />
        );
      case 'image':
        return (
          <div className="space-y-2 my-4">
            <input 
              type="file" 
              className="hidden" 
              ref={hiddenFileInput} 
              accept="image/*"
              onChange={(e) => {
                // refに保存されたblockIdを使って更新
                const blockId = hiddenFileInput.current?.getAttribute('data-block-id');
                if (blockId) handleImageUpload(e, blockId);
              }}
            />
            {!block.imageUrl ? (
              <div 
                className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer group" 
                onClick={() => {
                  // ファイル選択を開く
                  if (hiddenFileInput.current) {
                    hiddenFileInput.current.setAttribute('data-block-id', block.id);
                    hiddenFileInput.current.click();
                  }
                }}
                data-block-id={block.id}
                onKeyDown={(e) => {
                  handleEnterBackspace(e, block);
                }}
                tabIndex={0}
              >
                <IconImage className="w-8 h-8 text-gray-300 mx-auto mb-2 group-hover:text-gray-400" />
                <p className="text-gray-400 text-sm group-hover:text-gray-600">クリックして画像をアップロード</p>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const url = prompt('画像URLを入力してください');
                    if (url) updateInlineBlock(block.id, { imageUrl: url });
                  }}
                  className="mt-2 text-xs text-gray-300 hover:text-blue-500 underline"
                >
                  またはURLを入力
                </button>
              </div>
            ) : (
              <div 
                className="relative rounded-lg overflow-hidden group outline-none" 
                tabIndex={0}
                data-block-id={block.id}
                onKeyDown={(e) => {
                  handleEnterBackspace(e, block);
                }}
              >
                <img
                  src={block.imageUrl}
                  alt=""
                  className="max-w-full h-auto rounded-lg mx-auto"
                />
                <button
                  onClick={() => updateInlineBlock(block.id, { imageUrl: '' })}
                  className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <IconX className="w-4 h-4" />
                </button>
              </div>
            )}
            <input
               type="text"
               value={block.content} // キャプションとして利用
               onChange={(e) => updateInlineBlock(block.id, { content: e.target.value })}
               onKeyDown={(e) => {
                 if (e.key === 'Enter' && !e.shiftKey) {
                   e.preventDefault();
                   addInlineBlock(block.id, 'paragraph');
                 }
                 // キャプションが空なら画像ごと削除はせず、キャプションの文字削除のみ（標準動作）
               }}
               placeholder="キャプションを入力（任意）"
               className="w-full text-center text-sm text-gray-500 border-none outline-none bg-transparent"
             />
          </div>
        );
      case 'bulletList':
      case 'numberedList':
        return (
          <div className="space-y-1 my-2">
            {(block.listItems || ['']).map((item, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-gray-400 mt-1.5 w-5 text-right flex-shrink-0 select-none">
                  {block.type === 'bulletList' ? '•' : `${idx + 1}.`}
                </span>
              <textarea
                  value={item}
                  onChange={(e) => {
                     updateInlineListItem(block.id, idx, e.target.value);
                     e.target.style.height = 'auto';
                     e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                data-block-id={block.id}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                    addInlineListItem(block.id);
                    }
                    if (e.key === 'Backspace' && item === '') {
                      e.preventDefault();
                      if ((block.listItems?.length || 0) > 1) {
                        deleteInlineListItem(block.id, idx);
                      } else {
                        // リスト項目が1つしかなく、かつ空の場合はブロックごと削除
                        if (inlineBlocks.length > 1) {
                        const prevId = getPrevBlockId(block.id);
                        deleteInlineBlock(block.id);
                        setTimeout(() => focusBlock(prevId), 10);
                        }
                      }
                    }
                  }}
                  placeholder="リスト項目"
                  rows={1}
                  className={`${commonInputClass} resize-none py-1`}
                  style={{ minHeight: '32px' }}
                />
              </div>
            ))}
          </div>
        );
      case 'quote':
        return (
          <div className="border-l-4 border-gray-300 pl-4 italic my-4">
            <textarea
              value={block.content}
              data-block-id={block.id}
              onChange={(e) => {
                 updateInlineBlock(block.id, { content: e.target.value });
                 e.target.style.height = 'auto';
                 e.target.style.height = e.target.scrollHeight + 'px';
              }}
              onKeyDown={(e) => handleEnterBackspace(e, block)}
              placeholder="引用文"
              rows={1}
              className={`${commonInputClass} resize-none text-gray-600`}
              style={{ minHeight: '32px' }}
            />
          </div>
        );
      case 'toc': {
        // Heading preview (H1/H2) from current blocks
        const headings = inlineBlocks
          .filter(b => b.type === 'heading1' || b.type === 'heading2')
          .map((b) => ({
            text: b.content || '(無題)',
            level: b.type === 'heading1' ? 1 : 2,
            id: b.id,
          }));
        return (
          <div
            className="my-4 p-4 rounded-lg border border-dashed border-gray-300 bg-gray-50"
            data-block-id={block.id}
            tabIndex={0}
            onKeyDown={(e) => handleEnterBackspace(e, block)}
          >
            <div className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <IconTable className="w-4 h-4" />
              目次（公開時に自動リンク）
            </div>
            {headings.length === 0 ? (
              <p className="text-xs text-gray-500">見出しがありません。見出しを追加すると目次に表示されます。</p>
            ) : (
              <ul className="space-y-1 text-sm text-gray-700">
                {headings.map((h, idx) => (
                  <li key={idx} className={h.level === 2 ? 'pl-4 text-gray-600' : ''}>
                    {h.text}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      }
      case 'embed': {
        return (
          <div
            className="my-4 p-4 rounded-lg border border-gray-200 bg-gray-50 space-y-3"
            data-block-id={block.id}
            tabIndex={0}
            onKeyDown={(e) => handleEnterBackspace(e, block)}
          >
            <p className="text-sm font-semibold text-gray-700">埋め込みURL</p>
            <input
              type="url"
              data-block-id={block.id}
              value={block.embedUrl || ''}
              onChange={(e) => updateInlineBlock(block.id, { embedUrl: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 bg-white"
            />
            {block.embedUrl && (
              <div className="text-sm text-blue-600 break-all">
                <a href={block.embedUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {block.embedUrl}
                </a>
              </div>
            )}
            <input
              type="text"
              data-block-id={block.id}
              value={block.content}
              onChange={(e) => updateInlineBlock(block.id, { content: e.target.value })}
              placeholder="説明（任意）"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 bg-white"
            />
          </div>
        );
      }
      case 'file': {
        return (
          <div
            className="my-4 p-4 rounded-lg border border-gray-200 bg-gray-50 space-y-3"
            data-block-id={block.id}
            tabIndex={0}
            onKeyDown={(e) => handleEnterBackspace(e, block)}
          >
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <IconPaperclip className="w-4 h-4" />
              ファイル
            </p>
            <input
              type="file"
              ref={hiddenFileUploadInput}
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  setUploadingFile(true);
                  const { publicUrl } = await uploadAnyFile(file);
                  updateInlineBlock(block.id, { fileUrl: publicUrl, fileName: file.name });
                } catch (err: any) {
                  console.error('ファイルアップロードに失敗しました:', err);
                  alert('ファイルのアップロードに失敗しました。時間をおいて再度お試しください。');
                } finally {
                  setUploadingFile(false);
                  e.target.value = '';
                }
              }}
            />
            {!block.fileUrl ? (
              <button
                type="button"
                onClick={() => hiddenFileUploadInput.current?.click()}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
                disabled={uploadingFile}
              >
                {uploadingFile ? 'アップロード中...' : 'ファイルを選択'}
              </button>
            ) : (
              <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2">
                <div className="text-sm text-gray-800 break-all">
                  <a href={block.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {block.fileName || 'ダウンロード'}
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => updateInlineBlock(block.id, { fileUrl: undefined, fileName: undefined })}
                  className="text-xs text-gray-500 hover:text-red-500"
                >
                  削除
                </button>
              </div>
            )}
            <input
              type="text"
              data-block-id={block.id}
              value={block.content}
              onChange={(e) => updateInlineBlock(block.id, { content: e.target.value })}
              placeholder="説明（任意）"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 bg-white"
            />
          </div>
        );
      }
      case 'code':
        return (
          <div className="bg-gray-800 text-gray-100 rounded-lg p-4 my-4 font-mono text-sm relative group">
            <textarea
              value={block.content}
              data-block-id={block.id}
              onChange={(e) => {
                 updateInlineBlock(block.id, { content: e.target.value });
                 e.target.style.height = 'auto';
                 e.target.style.height = e.target.scrollHeight + 'px';
              }}
              onKeyDown={(e) => {
                // Shift+Enter で改行、Enterのみで次ブロック
                if (e.key === 'Enter' && e.shiftKey) {
                  return;
                }
                handleEnterBackspace(e, block);
              }}
              placeholder="コードを入力"
              rows={3}
              className="w-full bg-transparent border-none outline-none resize-none placeholder-gray-500"
              style={{ minHeight: '60px' }}
            />
            <button 
              onClick={() => deleteInlineBlock(block.id)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <IconX className="w-4 h-4" />
            </button>
          </div>
        );
      case 'divider':
        return (
          <div 
            className="py-4 cursor-pointer group" 
            onClick={() => {
              // 選択時に削除しやすくするなど（今回は簡易的にクリックで何もしない）
            }}
            tabIndex={0}
            data-block-id={block.id}
            onKeyDown={(e) => {
              handleEnterBackspace(e, block);
            }}
          >
            <hr className="border-t border-gray-200 group-hover:border-gray-400 transition-colors" />
          </div>
        );
      default:
        // Paragraph
        return (
          <textarea
            value={block.content}
            data-block-id={block.id}
            onChange={(e) => {
               updateInlineBlock(block.id, { content: e.target.value });
               e.target.style.height = 'auto';
               e.target.style.height = e.target.scrollHeight + 'px';
            }}
            placeholder="気軽に記録を残してみてください"
            rows={1}
            className={`${commonInputClass} text-lg resize-none`}
            style={{ minHeight: '32px' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const newId = addInlineBlock(block.id, 'paragraph');
                setTimeout(() => focusBlock(newId), 10);
              }
              if (e.key === 'Backspace' && block.content === '' && inlineBlocks.length > 1) {
                 e.preventDefault();
                 const prevId = getPrevBlockId(block.id);
                 deleteInlineBlock(block.id);
                 setTimeout(() => focusBlock(prevId), 10);
              }
            }}
          />
        );
    }
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">BLOG管理</h1>
          <p className="text-sm text-gray-500">noteから記事を取得するか、手動で記事を作成できます</p>
        </div>
        <Link href="/admin/blog/new" className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2">
          <IconPlus className="w-4 h-4" />
          新規記事作成
        </Link>
      </div>

      {/* インラインで新規記事作成（note風UI） */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-12 overflow-hidden">
        {/* ヘッダー: 下書き保存・公開・キャンセル */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">記事作成</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setInlineTitle('');
                setInlineExcerpt('');
                setInlineImageUrl('');
                setInlineNoteUrl('');
                setInlinePublishedAt('');
                setInlineIsPublished(false);
                setInlineBlocks([{ id: generateId(), type: 'paragraph', content: '' }]);
              }}
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors px-3 py-2"
            >
              キャンセル
            </button>
            <div className="h-4 w-px bg-gray-200 mx-1"></div>
            <LoadingButton
              onClick={() => {
                setInlineIsPublished(false);
                handleInlineSave();
              }}
              loading={inlineLoading && !inlineIsPublished}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-2"
            >
              下書き保存
            </LoadingButton>
            <LoadingButton
              onClick={() => {
                setInlineIsPublished(true);
                handleInlineSave();
              }}
              loading={inlineLoading && inlineIsPublished}
              className="bg-[#2cb696] hover:bg-[#259b80] text-white text-sm font-bold px-6 py-2 rounded-full transition-colors shadow-sm"
            >
              公開に進む
            </LoadingButton>
          </div>
        </div>

        {/* エディタエリア */}
        <div className="max-w-3xl mx-auto px-6 py-12">
          {/* メイン画像設定（任意） */}
          <div className="mb-8 group relative">
             <input 
               type="file" 
               className="hidden" 
               ref={hiddenHeaderFileInput} 
               accept="image/*"
               onChange={handleHeaderImageUpload}
             />
             {!inlineImageUrl ? (
               <button 
                 onClick={() => hiddenHeaderFileInput.current?.click()}
                 className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors text-sm py-2 px-3 rounded-lg hover:bg-gray-50"
               >
                 <IconImage className="w-4 h-4" />
                 <span>記事のヘッダー画像を追加</span>
               </button>
             ) : (
               <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-50 border border-gray-100 group">
                 <img src={inlineImageUrl} alt="Header" className="w-full h-full object-cover" />
                 <button 
                   onClick={() => setInlineImageUrl('')}
                   className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                 >
                   <IconX className="w-4 h-4" />
                 </button>
               </div>
             )}
          </div>

          {/* タイトル */}
          <div className="mb-8">
            <textarea
              value={inlineTitle}
              onChange={(e) => {
                setInlineTitle(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              placeholder="記事タイトル"
              rows={1}
              className="w-full text-4xl font-bold border-none outline-none placeholder-gray-300 resize-none overflow-hidden bg-transparent leading-tight"
              style={{ minHeight: '60px' }}
            />
          </div>

          {/* 本文ブロック */}
          <div className="space-y-2 min-h-[300px]">
            {inlineBlocks.length === 0 && (
               <div className="text-gray-300 text-lg">気軽に記録を残してみてください</div>
            )}
            
            {inlineBlocks.map((block, index) => (
              <div
                key={block.id}
                className="group relative flex items-start -ml-12 pl-12"
                draggable
                onDragStart={() => handleDragStart(block.id)}
                onDragOver={(e) => handleDragOver(e, block.id)}
                onDrop={(e) => handleDrop(e, block.id)}
              >
                {/* 左側の＋ボタン（常に表示） */}
                <div className={`absolute left-0 top-1.5 transition-opacity duration-200 ${
                  inlineBlockMenu === block.id ? 'opacity-100 z-30' : 'opacity-100'
                }`}>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setInlineBlockMenu(inlineBlockMenu === block.id ? null : block.id)}
                      className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                        inlineBlockMenu === block.id 
                          ? 'bg-gray-800 text-white transform rotate-45' 
                          : 'border border-gray-300 text-gray-400 hover:border-gray-800 hover:text-gray-800'
                      }`}
                    >
                      <IconPlus className="w-4 h-4" />
                    </button>
                    
                    {/* ポップアップメニュー */}
                    {inlineBlockMenu === block.id && (
                      <div className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-100 z-50 w-64 overflow-hidden animate-fade-in-up">
                        <div className="p-2 grid grid-cols-1 gap-0.5 max-h-[400px] overflow-y-auto">
                          <p className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">挿入</p>
                          
                          <button
                            onClick={() => alert('AIアシスタント機能は準備中です')}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
                          >
                            <IconSparkles className="w-4 h-4" />
                            <span>AIアシスタント</span>
                          </button>

                          <button
                            onClick={() => handleSelectBlockType(block.id, 'image', { openImagePicker: true })}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
                          >
                            <IconImage className="w-4 h-4" />
                            <span>画像</span>
                          </button>

                          <button
                            onClick={() => alert('音声機能は準備中です')}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
                          >
                            <IconMic className="w-4 h-4" />
                            <span>音声</span>
                          </button>

                          <button
                            onClick={() => handleSelectBlockType(block.id, 'embed')}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
                          >
                            <IconLink className="w-4 h-4" />
                            <span>埋め込み</span>
                          </button>

                          <button
                            onClick={() => handleSelectBlockType(block.id, 'file')}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
                          >
                            <IconPaperclip className="w-4 h-4" />
                            <span>ファイル</span>
                          </button>

                          <button
                            onClick={() => handleSelectBlockType(block.id, 'toc')}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
                          >
                            <IconTable className="w-4 h-4" />
                            <span>目次</span>
                          </button>

                          <button
                            onClick={() => { addInlineBlock(block.id, 'paragraph'); setInlineBlockMenu(null); }}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
                          >
                            <IconFileText className="w-4 h-4" />
                            <span>段落</span>
                          </button>

                          <button
                            onClick={() => handleSelectBlockType(block.id, 'heading1')}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
                          >
                            <IconHash className="w-4 h-4" />
                            <span>大見出し</span>
                          </button>

                          <button
                            onClick={() => handleSelectBlockType(block.id, 'heading2')}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
                          >
                            <IconHash className="w-4 h-4" />
                            <span>小見出し</span>
                          </button>

                          <button
                            onClick={() => handleSelectBlockType(block.id, 'bulletList')}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
                          >
                            <IconList className="w-4 h-4" />
                            <span>箇条書きリスト</span>
                          </button>

                          <button
                            onClick={() => handleSelectBlockType(block.id, 'numberedList')}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
                          >
                            <IconList className="w-4 h-4" />
                            <span>番号付きリスト</span>
                          </button>

                          <button
                            onClick={() => handleSelectBlockType(block.id, 'quote')}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
                          >
                            <IconQuote className="w-4 h-4" />
                            <span>引用</span>
                          </button>

                          <button
                            onClick={() => handleSelectBlockType(block.id, 'code')}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
                          >
                            <IconCode className="w-4 h-4" />
                            <span>コード</span>
                          </button>

                          <button
                            onClick={() => handleSelectBlockType(block.id, 'divider')}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
                          >
                            <IconMinus className="w-4 h-4" />
                            <span>区切り線</span>
                          </button>

                          <button
                            onClick={() => alert('有料エリア指定は準備中です')}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
                          >
                            <IconDollarSign className="w-4 h-4" />
                            <span>有料エリア指定</span>
                          </button>

                          <div className="h-px bg-gray-100 my-1"></div>
                          <button
                            onClick={() => deleteInlineBlock(block.id)}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors text-left"
                          >
                            <IconTrash className="w-4 h-4" />
                            <span>このブロックを削除</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ブロックコンテンツ */}
                <div className="flex-1 w-full">
                  {renderInlineBlock(block)}
                </div>
              </div>
            ))}
            
            {/* 最後のブロックの下をクリックして新しい段落を追加するためのエリア */}
            <div 
              className="h-32 cursor-text"
              onClick={() => {
                // 常に最後に段落を追加できるようにする（目次や空ブロックの後も追加可）
                const lastBlock = inlineBlocks[inlineBlocks.length - 1];
                addInlineBlock(lastBlock.id, 'paragraph');
                setTimeout(() => focusBlock(), 10);
              }}
            ></div>
          </div>
        </div>

        {/* 詳細設定（公開時などに表示してもいいが、今回は下に配置） */}
        <div className="border-t border-gray-100 px-6 py-8 bg-gray-50/50">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-sm font-bold text-gray-900 mb-4">詳細設定</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">抜粋（記事一覧に表示）</label>
                <textarea
                  value={inlineExcerpt}
                  onChange={(e) => setInlineExcerpt(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 bg-white resize-none"
                  placeholder="記事の概要を入力..."
                />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">公開日時</label>
                  <input
                    type="date"
                    value={inlinePublishedAt}
                    onChange={(e) => setInlinePublishedAt(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 bg-white"
                  />
                </div>
                <div>
                   <label className="block text-xs font-medium text-gray-500 mb-1.5">note URL (任意)</label>
                   <input
                     type="url"
                     value={inlineNoteUrl}
                     onChange={(e) => setInlineNoteUrl(e.target.value)}
                     className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 bg-white"
                     placeholder="https://note.com/..."
                   />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Note RSS URL Input */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">noteから記事を取得</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              noteのRSS URL
            </label>
            <input
              type="text"
              value={noteRssUrl}
              onChange={(e) => setNoteRssUrl(e.target.value)}
              placeholder="https://note.com/[ユーザー名]/rss"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
            />
            <p className="mt-2 text-xs text-gray-500">
              noteのユーザーページのRSS URLを入力してください（例: https://note.com/username/rss）
            </p>
          </div>
          <button
            onClick={fetchFromNote}
            disabled={fetching || !noteRssUrl.trim()}
            className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <IconRefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
            {fetching ? '取得中...' : '記事を取得'}
          </button>
        </div>
      </div>

      {/* Articles List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">記事一覧</h2>
          <span className="text-sm text-gray-500">{articles.length}件</span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-sm text-gray-500">読み込み中...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-gray-500">記事がありません</p>
            <p className="text-xs text-gray-400 mt-2">noteから記事を取得してください</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {articles.map((article) => (
              <div key={article.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  {article.image_url && (
                    <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      <img 
                        src={article.image_url} 
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2 py-1 text-xs rounded ${
                          article.is_published 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {article.is_published ? '公開中' : '非公開'}
                        </span>
                      </div>
                    </div>
                    {article.excerpt && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {article.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {article.published_at && (
                        <span>公開日: {new Date(article.published_at).toLocaleDateString('ja-JP')}</span>
                      )}
                      {article.note_url && (
                        <a 
                          href={article.note_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                        >
                          <IconExternalLink className="w-3 h-3" />
                          noteで見る
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <Link href={`/admin/blog/${article.id}`} className="px-4 py-2 text-xs rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors flex items-center gap-1">
                        <IconEdit className="w-3 h-3" />
                        編集
                      </Link>
                      <button
                        onClick={() => togglePublish(article.id, article.is_published)}
                        className={`px-4 py-2 text-xs rounded-lg transition-colors ${
                          article.is_published
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {article.is_published ? '非公開にする' : '公開する'}
                      </button>
                      <button
                        onClick={() => deleteArticle(article.id)}
                        className="px-4 py-2 text-xs rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors flex items-center gap-1"
                      >
                        <IconTrash className="w-3 h-3" />
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogManagement;

