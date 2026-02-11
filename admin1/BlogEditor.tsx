import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { convertImageToWebP } from '../../lib/imageUtils';
import { IconArrowLeft, IconLoader2, IconPlus, IconX, IconImage, IconList, IconHash, IconQuote, IconCode, IconMinus, IconPaperclip, IconTable, IconMic, IconSparkles, IconDollarSign, IconLink, IconFileText } from '../../components/Icons';
import { LoadingButton } from '../../components/UI';

type BlockType = 'paragraph' | 'heading1' | 'heading2' | 'image' | 'bulletList' | 'numberedList' | 'quote' | 'code' | 'divider' | 'embed';

interface EmbedData {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  favicon?: string;
}

interface Block {
  id: string;
  type: BlockType;
  content: string;
  imageUrl?: string;
  listItems?: string[];
  textAlign?: 'left' | 'center' | 'right';
  embedData?: EmbedData;
}

interface BlogArticle {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  image_url?: string;
  note_url?: string;
  published_at?: string;
  is_published: boolean;
}

const BlogEditor = () => {
  const params = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isNew = !params?.id || params.id === 'new';
  const articleId = params?.id;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!isNew);
  const [article, setArticle] = useState<BlogArticle | null>(null);

  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [excerpt, setExcerpt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [noteUrl, setNoteUrl] = useState('');
  const [publishedAt, setPublishedAt] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [showBlockMenu, setShowBlockMenu] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedText, setSelectedText] = useState<{ blockId: string; range: Range | null } | null>(null);
  const [toolbarPosition, setToolbarPosition] = useState<{ top: number; left: number } | null>(null);
  const [showAlignmentMenu, setShowAlignmentMenu] = useState(false);
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const [showHeadingAlignmentMenu, setShowHeadingAlignmentMenu] = useState<string | null>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const contentEditableRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const hiddenFileInput = useRef<HTMLInputElement>(null);
  // リンク挿入用に「選択範囲」を保持（モーダルにフォーカスが移っても失われないようにする）
  const linkSelectionRef = useRef<{ blockId: string; range: Range } | null>(null);

  useEffect(() => {
    if (!isNew && articleId) {
      fetchArticle();
    } else {
      setInitialLoading(false);
      // 新規作成時は初期ブロックを追加
      if (blocks.length === 0) {
        setBlocks([{ id: generateId(), type: 'paragraph', content: '' }]);
      }
    }
  }, [isNew, articleId]);

  const generateId = () => `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const fetchArticle = async () => {
    if (!supabase || !articleId) return;

    try {
      setInitialLoading(true);
      const { data, error } = await supabase
        .from('blog_articles')
        .select('*')
        .eq('id', articleId)
        .single();

      if (error) throw error;

      if (data) {
        setArticle(data);
        setTitle(data.title || '');
        setExcerpt(data.excerpt || '');
        setImageUrl(data.image_url || '');
        setNoteUrl(data.note_url || '');
        setPublishedAt(data.published_at ? new Date(data.published_at).toISOString().split('T')[0] : '');
        setIsPublished(data.is_published || false);
        
        // コンテンツをブロックに変換
        if (data.content) {
          try {
            const parsedBlocks = JSON.parse(data.content);
            if (Array.isArray(parsedBlocks)) {
              setBlocks(parsedBlocks);
            } else {
              // 旧形式のテキストを段落ブロックに変換
              setBlocks([{ id: generateId(), type: 'paragraph', content: data.content }]);
            }
          } catch {
            // JSONでない場合は段落ブロックに変換
            setBlocks([{ id: generateId(), type: 'paragraph', content: data.content }]);
          }
        } else {
          setBlocks([{ id: generateId(), type: 'paragraph', content: '' }]);
        }
      }
    } catch (error) {
      console.error('記事の取得に失敗しました:', error);
      alert('記事の取得に失敗しました');
    } finally {
      setInitialLoading(false);
    }
  };

  const addBlock = (afterBlockId: string, type: BlockType, url?: string) => {
    const newBlock: Block = {
      id: generateId(),
      type,
      content: url || '',
      ...(type === 'bulletList' || type === 'numberedList' ? { listItems: [''] } : {}),
      ...(type === 'embed' && url ? { embedData: { url } } : {}),
    };

    const index = blocks.findIndex(b => b.id === afterBlockId);
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    setBlocks(newBlocks);
    setShowBlockMenu(null);
  };

  const deleteBlock = (blockId: string) => {
    if (blocks.length === 1) {
      alert('最低1つのブロックが必要です');
      return;
    }
    setBlocks(blocks.filter(b => b.id !== blockId));
  };

  // URLからサイト情報を推測
  const guessSiteInfo = (url: string): Partial<EmbedData> => {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      const hostname = urlObj.hostname.replace('www.', '');
      
      // 主要なサービスの情報を推測
      const siteInfo: { [key: string]: { name: string; icon?: string } } = {
        'note.com': { name: 'note' },
        'lin.ee': { name: 'LINE' },
        'instagram.com': { name: 'Instagram' },
        'twitter.com': { name: 'Twitter' },
        'x.com': { name: 'X (Twitter)' },
        'youtube.com': { name: 'YouTube' },
        'youtu.be': { name: 'YouTube' },
        'facebook.com': { name: 'Facebook' },
        'lit.link': { name: 'lit.link' },
        'www.ikevege.com': { name: 'IKEVEGE Online Store' },
      };

      const matchedSite = Object.keys(siteInfo).find(key => hostname.includes(key));
      if (matchedSite) {
        return {
          siteName: siteInfo[matchedSite].name,
          title: `${siteInfo[matchedSite].name} - ${urlObj.pathname}`,
        };
      }

      // ドメイン名からサイト名を推測
      const domainParts = hostname.split('.');
      const siteName = domainParts.length > 1 
        ? domainParts[domainParts.length - 2].charAt(0).toUpperCase() + domainParts[domainParts.length - 2].slice(1)
        : hostname;

      return {
        siteName: siteName,
        title: url,
      };
    } catch {
      return {
        title: url,
        siteName: '',
      };
    }
  };

  // OGP情報を取得
  const fetchOGPData = async (url: string): Promise<EmbedData | null> => {
    // URLを正規化（プロトコルがない場合は追加）
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    console.log('OGP情報を取得中:', normalizedUrl);

    // まずURLから情報を推測（フォールバック用）
    const guessedInfo = guessSiteInfo(normalizedUrl);
    console.log('推測された情報:', guessedInfo);

    try {
      // 複数のCORSプロキシを試す
      const proxies = [
        `https://api.allorigins.win/get?url=${encodeURIComponent(normalizedUrl)}`,
        `https://corsproxy.io/?${encodeURIComponent(normalizedUrl)}`,
      ];

      let htmlContent = '';
      let lastError: Error | null = null;

      for (const proxyUrl of proxies) {
        try {
          const response = await fetch(proxyUrl, {
            method: 'GET',
            headers: {
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          // api.allorigins.winはJSON形式、corsproxy.ioは直接HTMLを返す可能性がある
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await response.json();
            htmlContent = data.contents || data || '';
          } else {
            htmlContent = await response.text();
          }
          
          if (htmlContent && htmlContent.trim()) {
            break; // 成功したらループを抜ける
          }
        } catch (error) {
          console.warn(`プロキシ ${proxyUrl} でエラー:`, error);
          lastError = error as Error;
          continue; // 次のプロキシを試す
        }
      }

      // OGP情報が取得できた場合
      if (htmlContent) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        
        const getMetaContent = (property: string) => {
          return doc.querySelector(`meta[property="${property}"]`)?.getAttribute('content') ||
                 doc.querySelector(`meta[name="${property}"]`)?.getAttribute('content') ||
                 '';
        };

        // 相対URLを絶対URLに変換
        const toAbsoluteUrl = (relativeUrl: string) => {
          if (!relativeUrl) return '';
          if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
            return relativeUrl;
          }
          try {
            const baseUrl = new URL(normalizedUrl);
            return new URL(relativeUrl, baseUrl.origin).href;
          } catch {
            return relativeUrl;
          }
        };

        const title = getMetaContent('og:title') || doc.querySelector('title')?.textContent || '';
        const description = getMetaContent('og:description') || getMetaContent('description') || '';
        const image = toAbsoluteUrl(getMetaContent('og:image'));
        const siteName = getMetaContent('og:site_name') || '';
        const favicon = toAbsoluteUrl(
          doc.querySelector('link[rel="icon"]')?.getAttribute('href') || 
          doc.querySelector('link[rel="shortcut icon"]')?.getAttribute('href') || ''
        );

        const result = {
          url: normalizedUrl,
          title: title || guessedInfo.title || normalizedUrl,
          description: description,
          image: image,
          siteName: siteName || guessedInfo.siteName || '',
          favicon: favicon,
        };
        console.log('OGP情報取得成功:', result);
        return result;
      }
    } catch (error) {
      console.error('OGP情報の取得に失敗しました:', error);
    }

    // OGP情報が取得できなかった場合でも、推測した情報を返す
    const fallbackResult = {
      url: normalizedUrl,
      title: guessedInfo.title || normalizedUrl,
      description: guessedInfo.description || '',
      image: guessedInfo.image || '',
      siteName: guessedInfo.siteName || '',
      favicon: guessedInfo.favicon || '',
    };
    console.log('フォールバック情報を返します:', fallbackResult);
    return fallbackResult;
  };

  const updateBlock = (blockId: string, updates: Partial<Block>) => {
    setBlocks(blocks.map(b => b.id === blockId ? { ...b, ...updates } : b));
  };

  const addListItem = (blockId: string) => {
    setBlocks(blocks.map(b => 
      b.id === blockId 
        ? { ...b, listItems: [...(b.listItems || []), ''] }
        : b
    ));
  };

  const updateListItem = (blockId: string, itemIndex: number, value: string) => {
    setBlocks(blocks.map(b => 
      b.id === blockId 
        ? { 
            ...b, 
            listItems: (b.listItems || []).map((item, idx) => idx === itemIndex ? value : item)
          }
        : b
    ));
  };

  // テキスト選択時の処理
  const handleTextSelection = (blockId: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setSelectedText(null);
      setToolbarPosition(null);
      linkSelectionRef.current = null;
      return;
    }

    const range = selection.getRangeAt(0);
    if (range.collapsed) {
      setSelectedText(null);
      setToolbarPosition(null);
      linkSelectionRef.current = null;
      return;
    }

    const cloned = range.cloneRange();
    setSelectedText({ blockId, range: cloned });
    // リンク用にも保存
    linkSelectionRef.current = { blockId, range: cloned };
    
    // ツールバーの位置を計算
    const rect = range.getBoundingClientRect();
    const toolbarWidth = 400; // ツールバーの推定幅
    const toolbarHeight = 50;
    
    let top = rect.top - toolbarHeight - 10;
    let left = rect.left + (rect.width / 2) - (toolbarWidth / 2);
    
    // 画面外に出ないように調整
    if (top < 0) {
      top = rect.bottom + 10;
    }
    if (left < 0) {
      left = 10;
    }
    if (left + toolbarWidth > window.innerWidth) {
      left = window.innerWidth - toolbarWidth - 10;
    }
    
    setToolbarPosition({ top, left });
  };

  // フォーマット適用
  const applyFormat = (command: string, value?: string) => {
    if (!selectedText) return;

    document.execCommand(command, false, value);
    
    // ブロックの内容を更新
    const element = contentEditableRefs.current[selectedText.blockId];
    if (element) {
      updateBlock(selectedText.blockId, { content: element.innerHTML });
    }

    // 選択を解除
    window.getSelection()?.removeAllRanges();
    setSelectedText(null);
    setToolbarPosition(null);
  };

  // 配置メニューの外側クリックで閉じる
  useEffect(() => {
    if (!showAlignmentMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      const el = e.target instanceof Element ? e.target : null;
      if (!el || !el.closest('.alignment-menu')) {
        setShowAlignmentMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAlignmentMenu]);

  // 見出しメニューの外側クリックで閉じる
  useEffect(() => {
    if (!showHeadingMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      const el = e.target instanceof Element ? e.target : null;
      if (!el || !el.closest('.heading-menu')) {
        setShowHeadingMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showHeadingMenu]);

  // 見出し配置メニューの外側クリックで閉じる
  useEffect(() => {
    if (!showHeadingAlignmentMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      const el = e.target instanceof Element ? e.target : null;
      if (!el || !el.closest('.heading-alignment-menu')) {
        setShowHeadingAlignmentMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showHeadingAlignmentMenu]);

  // クリック時にツールバーを閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selectedText && toolbarPosition) {
        const el = e.target instanceof Element ? e.target : null;
        if (!el) return;
        
        // contentEditable内での選択操作は妨げない
        if (el.closest('[contenteditable]')) {
          return;
        }
        
        // ツールバー外をクリックした場合のみ閉じる
        if (!el.closest('.text-toolbar')) {
          setSelectedText(null);
          setToolbarPosition(null);
        }
      }
    };

    // mousedownではなくclickで判定（選択操作を妨げない）
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [selectedText, toolbarPosition]);

  // 見出し適用
  const applyHeading = (headingType: 'h1' | 'h2' | 'p') => {
    if (!selectedText) return;

    // キャプション用IDの場合は実際のブロックIDを取得
    const actualBlockId = selectedText.blockId.endsWith('-caption') 
      ? selectedText.blockId.replace('-caption', '') 
      : selectedText.blockId;

    if (headingType === 'p') {
      document.execCommand('formatBlock', false, 'p');
    } else {
      document.execCommand('formatBlock', false, headingType);
    }
    
    const element = contentEditableRefs.current[selectedText.blockId];
    if (element) {
      updateBlock(actualBlockId, { content: element.innerHTML });
    }
    
    setShowHeadingMenu(false);
    
    // 選択を解除
    window.getSelection()?.removeAllRanges();
    setSelectedText(null);
    setToolbarPosition(null);
  };

  // 配置適用関数
  const applyAlignment = (align: 'left' | 'center' | 'right') => {
    if (!selectedText) return;
    
    // キャプション用IDの場合は実際のブロックIDを取得
    const actualBlockId = selectedText.blockId.endsWith('-caption') 
      ? selectedText.blockId.replace('-caption', '') 
      : selectedText.blockId;
    
    if (align === 'left') {
      document.execCommand('justifyLeft', false);
    } else if (align === 'center') {
      document.execCommand('justifyCenter', false);
    } else if (align === 'right') {
      document.execCommand('justifyRight', false);
    }
    const element = contentEditableRefs.current[selectedText.blockId];
    if (element) {
      updateBlock(actualBlockId, { content: element.innerHTML });
    }
    setShowAlignmentMenu(false);
  };

  // ツールバーコンポーネント
  const TextToolbar = () => {
    if (!selectedText || !toolbarPosition) return null;

    return (
      <div
        className="fixed bg-white rounded-lg shadow-xl border border-gray-200 z-50 flex items-center gap-1 p-1 text-toolbar"
        style={{
          top: `${toolbarPosition.top}px`,
          left: `${toolbarPosition.left}px`
        }}
      >
        <button
          onClick={() => applyFormat('bold')}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="太字"
        >
          <span className="font-bold text-sm">B</span>
        </button>
        <div className="w-px h-6 bg-gray-300"></div>
        <div className="relative heading-menu">
          <button
            onClick={() => setShowHeadingMenu(!showHeadingMenu)}
            className="px-3 py-2 hover:bg-gray-100 rounded transition-colors text-sm flex items-center gap-1"
            title="見出し"
          >
            <span>見出し</span>
            <span className="text-xs">▼</span>
          </button>
          {showHeadingMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[140px] z-50">
              <button
                onClick={() => applyHeading('h1')}
                className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                <span>大見出し</span>
              </button>
              <button
                onClick={() => applyHeading('h2')}
                className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                <span>小見出し</span>
              </button>
              <button
                onClick={() => applyHeading('p')}
                className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                <span>指定なし</span>
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>
        <div className="w-px h-6 bg-gray-300"></div>
        <div className="relative alignment-menu">
          <button
            onClick={() => setShowAlignmentMenu(!showAlignmentMenu)}
            className="px-3 py-2 hover:bg-gray-100 rounded transition-colors text-sm flex items-center gap-1"
            title="配置"
          >
            <span>配置</span>
            <span className="text-xs">▼</span>
          </button>
          {showAlignmentMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[120px] z-50">
              <button
                onClick={() => applyAlignment('left')}
                className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
              >
                左揃え
              </button>
              <button
                onClick={() => applyAlignment('center')}
                className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
              >
                中央揃え
              </button>
              <button
                onClick={() => applyAlignment('right')}
                className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
              >
                右揃え
              </button>
            </div>
          )}
        </div>
        <div className="w-px h-6 bg-gray-300"></div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            if (!selectedText) {
              alert('テキストを選択してからリンクボタンを押してください');
              return;
            }

            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              if (!range.collapsed) {
                const cloned = range.cloneRange();
                linkSelectionRef.current = { blockId: selectedText.blockId, range: cloned };
                setSelectedText({ blockId: selectedText.blockId, range: cloned });

                // 選択範囲の親がリンクならURLをプリセット
                const container =
                  (cloned.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
                    ? (cloned.commonAncestorContainer as Element)
                    : (cloned.commonAncestorContainer.parentElement as Element | null));
                const existingLink = container?.closest?.('a') as HTMLAnchorElement | null;
                if (existingLink?.href) {
                  setLinkUrl(existingLink.href);
                }

                setShowLinkDialog(true);
                return;
              }
            }

            // 保存されたrangeを使用
            if (selectedText.range) {
              const cloned = selectedText.range.cloneRange();
              linkSelectionRef.current = { blockId: selectedText.blockId, range: cloned };
              setShowLinkDialog(true);
              return;
            }

            // ここに来る場合は選択がない
            alert('テキストを選択してからリンクボタンを押してください');
          }}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="リンク"
        >
          <IconLink className="w-4 h-4" />
        </button>
      </div>
    );
  };

  // リンクを適用
  const applyLink = () => {
    if (!linkUrl.trim()) {
      alert('リンクURLを入力してください');
      return;
    }

    const saved = linkSelectionRef.current;
    if (!saved?.range) {
      alert('テキストを選択してからリンクを追加してください');
      return;
    }

    // キャプション用IDの場合は実際のブロックIDを取得
    const actualBlockId = saved.blockId.endsWith('-caption') 
      ? saved.blockId.replace('-caption', '') 
      : saved.blockId;

    const element = contentEditableRefs.current[saved.blockId];
    if (!element) {
      alert('エディタ要素が見つかりません');
      return;
    }

    const range = saved.range.cloneRange();
    const selectedTextContent = range.toString();
    if (!selectedTextContent || selectedTextContent.trim() === '') {
      alert('リンクを設定するテキストを選択してください');
      return;
    }

    const selection = window.getSelection();
    const normalizedUrl = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
    // 選択範囲を一時的に復元（execCommand系/DOM操作のため）
    if (selection) {
      selection.removeAllRanges();
      try {
        selection.addRange(range);
      } catch {
        // ignore
      }
    }

    // リンク要素を作成
    const linkElement = document.createElement('a');
    linkElement.href = normalizedUrl;
    linkElement.textContent = selectedTextContent;
    linkElement.target = '_blank';
    linkElement.rel = 'noopener noreferrer';

    try {
      // 選択範囲を削除してリンクを挿入
      range.deleteContents();
      range.insertNode(linkElement);
    } catch (e) {
      alert('リンクの適用に失敗しました。テキストを再度選択してください。');
      return;
    }

    // ブロックの内容を更新
    updateBlock(actualBlockId, { content: element.innerHTML });

    // ダイアログを閉じる
    setShowLinkDialog(false);
    setLinkUrl('');
    linkSelectionRef.current = null;
    
    // 選択を解除
    if (selection) {
      selection.removeAllRanges();
    }
    setSelectedText(null);
    setToolbarPosition(null);
  };

  const deleteListItem = (blockId: string, itemIndex: number) => {
    setBlocks(blocks.map(b => 
      b.id === blockId 
        ? { 
            ...b, 
            listItems: (b.listItems || []).filter((_, idx) => idx !== itemIndex)
          }
        : b
    ));
  };

  const blocksToContent = (): string => {
    // ブロックをJSON形式で保存
    return JSON.stringify(blocks);
  };

  const blocksToPlainText = (): string => {
    // プレーンテキストとしても保存（互換性のため）
    return blocks.map(block => {
      switch (block.type) {
        case 'heading1':
          return `# ${block.content}`;
        case 'heading2':
          return `## ${block.content}`;
        case 'image':
          return block.imageUrl || '';
        case 'bulletList':
          return block.listItems?.map(item => `- ${item}`).join('\n') || '';
        case 'numberedList':
          return block.listItems?.map((item, idx) => `${idx + 1}. ${item}`).join('\n') || '';
        case 'quote':
          return `> ${block.content}`;
        default:
          return block.content;
      }
    }).join('\n\n');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('タイトルを入力してください');
      return;
    }

    if (blocks.length === 0 || blocks.every(b => !b.content.trim() && !b.imageUrl)) {
      alert('本文を入力してください');
      return;
    }

    if (!supabase) {
      alert('Supabaseが設定されていません');
      return;
    }

    try {
      setLoading(true);

      const contentJson = blocksToContent();
      const contentPlain = blocksToPlainText();

      const articleData: any = {
        title: title.trim(),
        content: contentJson, // JSON形式で保存
        excerpt: excerpt.trim() || null,
        image_url: imageUrl.trim() || blocks.find(b => b.type === 'image' && b.imageUrl)?.imageUrl || null,
        note_url: noteUrl.trim() || null,
        published_at: publishedAt ? new Date(publishedAt).toISOString() : null,
        is_published: isPublished,
        updated_at: new Date().toISOString(),
      };

      if (isNew) {
        const { error } = await supabase
          .from('blog_articles')
          .insert(articleData);

        if (error) throw error;
        alert('記事を作成しました');
      } else {
        const { error } = await supabase
          .from('blog_articles')
          .update(articleData)
          .eq('id', articleId);

        if (error) throw error;
        alert('記事を更新しました');
      }

      navigate('/admin/blog');
    } catch (error) {
      console.error('記事の保存に失敗しました:', error);
      alert('記事の保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // Supabase Storage に画像をアップロードして公開URLを返す（WebP形式で保存）
  const uploadImageFile = async (file: File) => {
    if (!supabase) throw new Error('Supabaseが未設定です');
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, blockId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const imageUrl = await uploadImageFile(file);
      updateBlock(blockId, { imageUrl });
    } catch (err: any) {
      console.error('画像アップロードに失敗しました:', err);
      alert('画像のアップロードに失敗しました。時間をおいて再度お試しください。');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const BlockMenu = ({ blockId, onClose }: { blockId: string; onClose: () => void }) => (
    <div className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-100 z-50 w-64 overflow-hidden animate-fade-in-up">
      <div className="p-2 grid grid-cols-1 gap-0.5 max-h-[400px] overflow-y-auto">
        <p className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">挿入</p>
        
        <button
          onClick={() => { addBlock(blockId, 'paragraph'); onClose(); }}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
        >
          <IconFileText className="w-4 h-4" />
          <span>文章</span>
        </button>

        <button
          onClick={() => alert('AIアシスタント機能は準備中です')}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
        >
          <IconSparkles className="w-4 h-4" />
          <span>AIアシスタント</span>
        </button>

        <button
          onClick={() => { addBlock(blockId, 'image'); onClose(); }}
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
          onClick={async () => {
            const url = prompt('埋め込みたいURLを入力してください:');
            if (url && url.trim()) {
              const newBlockId = generateId();
              // まずブロックを作成（ローディング状態）
              const tempBlock: Block = {
                id: newBlockId,
                type: 'embed',
                content: url.trim(),
                embedData: { url: url.trim() }, // 一時的なデータ
              };
              const index = blocks.findIndex(b => b.id === blockId);
              const newBlocks = [...blocks];
              newBlocks.splice(index + 1, 0, tempBlock);
              setBlocks(newBlocks);
              onClose();
              
              // OGP情報を非同期で取得して更新
              try {
                const embedData = await fetchOGPData(url.trim());
                setBlocks(newBlocks.map(b => 
                  b.id === newBlockId 
                    ? { ...b, embedData: embedData || { url: url.trim() } }
                    : b
                ));
              } catch (error) {
                console.error('OGP情報の取得に失敗:', error);
                // エラーでも最低限の情報を保持
                setBlocks(newBlocks.map(b => 
                  b.id === newBlockId 
                    ? { ...b, embedData: { url: url.trim() } }
                    : b
                ));
              }
            }
          }}
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
          onClick={() => { addBlock(blockId, 'heading1'); onClose(); }}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
        >
          <IconHash className="w-4 h-4" />
          <span>大見出し</span>
        </button>

        <button
          onClick={() => { addBlock(blockId, 'heading2'); onClose(); }}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
        >
          <IconHash className="w-4 h-4" />
          <span>小見出し</span>
        </button>

        <button
          onClick={() => { addBlock(blockId, 'bulletList'); onClose(); }}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
        >
          <IconList className="w-4 h-4" />
          <span>箇条書きリスト</span>
        </button>

        <button
          onClick={() => { addBlock(blockId, 'numberedList'); onClose(); }}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
        >
          <IconList className="w-4 h-4" />
          <span>番号付きリスト</span>
        </button>

        <button
          onClick={() => { addBlock(blockId, 'quote'); onClose(); }}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
        >
          <IconQuote className="w-4 h-4" />
          <span>引用</span>
        </button>

        <button
          onClick={() => { addBlock(blockId, 'code'); onClose(); }}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
        >
          <IconCode className="w-4 h-4" />
          <span>コード</span>
        </button>

        <button
          onClick={() => { addBlock(blockId, 'divider'); onClose(); }}
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
      </div>
    </div>
  );

  const renderBlock = (block: Block) => {
    switch (block.type) {
      case 'heading1':
        return (
          <div className="group relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="relative heading-alignment-menu" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowHeadingAlignmentMenu(showHeadingAlignmentMenu === block.id ? null : block.id);
                  }}
                  className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  title="配置を変更"
                >
                  {block.textAlign === 'center' ? '中央' : block.textAlign === 'right' ? '右' : '左'} ▼
                </button>
                {showHeadingAlignmentMenu === block.id && (
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[120px] z-50" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        updateBlock(block.id, { textAlign: 'left' });
                        setShowHeadingAlignmentMenu(null);
                      }}
                      className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                        (block.textAlign || 'left') === 'left' ? 'bg-gray-50' : ''
                      }`}
                    >
                      左揃え
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        updateBlock(block.id, { textAlign: 'center' });
                        setShowHeadingAlignmentMenu(null);
                      }}
                      className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                        block.textAlign === 'center' ? 'bg-gray-50' : ''
                      }`}
                    >
                      中央揃え
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        updateBlock(block.id, { textAlign: 'right' });
                        setShowHeadingAlignmentMenu(null);
                      }}
                      className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                        block.textAlign === 'right' ? 'bg-gray-50' : ''
                      }`}
                    >
                      右揃え
                    </button>
                  </div>
                )}
              </div>
            </div>
            <input
              type="text"
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder="大見出し"
              className={`w-full text-3xl font-bold border-none outline-none bg-transparent ${
                block.textAlign === 'center' ? 'text-center' : block.textAlign === 'right' ? 'text-right' : 'text-left'
              }`}
            />
          </div>
        );
      case 'heading2':
        return (
          <div className="group relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="relative heading-alignment-menu" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowHeadingAlignmentMenu(showHeadingAlignmentMenu === block.id ? null : block.id);
                  }}
                  className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  title="配置を変更"
                >
                  {block.textAlign === 'center' ? '中央' : block.textAlign === 'right' ? '右' : '左'} ▼
                </button>
                {showHeadingAlignmentMenu === block.id && (
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[120px] z-50" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        updateBlock(block.id, { textAlign: 'left' });
                        setShowHeadingAlignmentMenu(null);
                      }}
                      className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                        (block.textAlign || 'left') === 'left' ? 'bg-gray-50' : ''
                      }`}
                    >
                      左揃え
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        updateBlock(block.id, { textAlign: 'center' });
                        setShowHeadingAlignmentMenu(null);
                      }}
                      className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                        block.textAlign === 'center' ? 'bg-gray-50' : ''
                      }`}
                    >
                      中央揃え
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        updateBlock(block.id, { textAlign: 'right' });
                        setShowHeadingAlignmentMenu(null);
                      }}
                      className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                        block.textAlign === 'right' ? 'bg-gray-50' : ''
                      }`}
                    >
                      右揃え
                    </button>
                  </div>
                )}
              </div>
            </div>
            <input
              type="text"
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder="小見出し"
              className={`w-full text-2xl font-semibold border-none outline-none bg-transparent ${
                block.textAlign === 'center' ? 'text-center' : block.textAlign === 'right' ? 'text-right' : 'text-left'
              }`}
            />
          </div>
        );
      case 'image':
        return (
          <div className="space-y-2">
            <input 
              type="file" 
              className="hidden" 
              ref={hiddenFileInput} 
              accept="image/*"
              onChange={(e) => {
                const targetId = hiddenFileInput.current?.getAttribute('data-block-id');
                if (targetId) handleImageUpload(e, targetId);
              }}
            />
            {!block.imageUrl ? (
              <div 
                className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer group"
                onClick={() => {
                  if (hiddenFileInput.current) {
                    hiddenFileInput.current.setAttribute('data-block-id', block.id);
                    hiddenFileInput.current.click();
                  }
                }}
              >
                <IconImage className="w-8 h-8 text-gray-300 mx-auto mb-2 group-hover:text-gray-400" />
                <p className="text-gray-400 text-sm group-hover:text-gray-600">
                  クリックして画像をアップロード
                </p>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const url = prompt('画像URLを入力してください');
                    if (url) updateBlock(block.id, { imageUrl: url });
                  }}
                  className="mt-2 text-xs text-gray-300 hover:text-blue-500 underline"
                >
                  またはURLを入力
                </button>
              </div>
            ) : (
              <div className="relative group">
                 <img
                  src={block.imageUrl}
                  alt=""
                  className="max-w-full h-auto rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => updateBlock(block.id, { imageUrl: '' })}
                  className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <IconX className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="relative">
              <div
                ref={(el) => {
                  if (el) {
                    contentEditableRefs.current[`${block.id}-caption`] = el;
                    if (el.innerHTML !== block.content) {
                      el.innerHTML = block.content || '';
                    }
                  }
                }}
                contentEditable
                onInput={(e) => {
                  const target = e.currentTarget;
                  updateBlock(block.id, { content: target.innerHTML });
                }}
                onMouseUp={() => handleTextSelection(`${block.id}-caption`)}
                onKeyUp={() => handleTextSelection(`${block.id}-caption`)}
                className="w-full text-center text-sm text-gray-500 border-none outline-none bg-transparent mt-2 min-h-[24px] select-text cursor-text"
                data-placeholder="キャプションを入力（任意）"
                style={{ 
                  minHeight: '24px',
                  wordBreak: 'break-word',
                  userSelect: 'text',
                  WebkitUserSelect: 'text'
                }}
              />
              <style>{`
                div[data-placeholder]:empty:before {
                  content: attr(data-placeholder);
                  color: #9ca3af;
                  pointer-events: none;
                }
                [contenteditable] {
                  -webkit-user-select: text !important;
                  -moz-user-select: text !important;
                  -ms-user-select: text !important;
                  user-select: text !important;
                }
                [contenteditable] * {
                  -webkit-user-select: text !important;
                  -moz-user-select: text !important;
                  -ms-user-select: text !important;
                  user-select: text !important;
                }
              `}</style>
            </div>
          </div>
        );
      case 'bulletList':
      case 'numberedList':
        return (
          <div className="space-y-2">
            {(block.listItems || ['']).map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-gray-400 w-6">
                  {block.type === 'bulletList' ? '•' : `${idx + 1}.`}
                </span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateListItem(block.id, idx, e.target.value)}
                  placeholder="リスト項目"
                  className="flex-1 border-none outline-none bg-transparent"
                />
                {(block.listItems?.length || 0) > 1 && (
                  <button
                    onClick={() => deleteListItem(block.id, idx)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <IconX className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => addListItem(block.id)}
              className="text-sm text-gray-500 hover:text-gray-700 ml-8"
            >
              + 項目を追加
            </button>
          </div>
        );
      case 'quote':
        return (
          <div className="border-l-4 border-gray-300 pl-4 italic">
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder="引用文"
              rows={3}
              className="w-full border-none outline-none bg-transparent resize-none"
            />
          </div>
        );
      case 'code':
        return (
          <div className="bg-gray-800 text-gray-100 rounded-lg p-4 font-mono text-sm">
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder="コードを入力"
              rows={3}
              className="w-full bg-transparent border-none outline-none resize-none placeholder-gray-500"
            />
          </div>
        );
      case 'divider':
        return (
          <div className="py-4">
            <hr className="border-t border-gray-200" />
          </div>
        );
      case 'embed':
        const embedUrl = block.embedData?.url || block.content || '';
        const normalizedEmbedUrl = embedUrl && !embedUrl.startsWith('http') ? `https://${embedUrl}` : embedUrl;
        
        return (
          <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
            {block.embedData && (block.embedData.title || block.embedData.siteName || block.embedData.url) ? (
              <div className="space-y-3">
                {block.embedData.image && (
                  <img 
                    src={block.embedData.image} 
                    alt={block.embedData.title || '埋め込み画像'}
                    className="w-full h-48 object-cover rounded-md"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <div>
                  {block.embedData.siteName && (
                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-medium">
                      {block.embedData.siteName}
                    </p>
                  )}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {block.embedData.title || block.content || normalizedEmbedUrl}
                  </h3>
                  {block.embedData.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">{block.embedData.description}</p>
                  )}
                  <a 
                    href={normalizedEmbedUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 mt-2 inline-block break-all"
                  >
                    {normalizedEmbedUrl}
                  </a>
                </div>
                <button
                  onClick={async () => {
                    const newUrl = prompt('URLを変更:', block.content || normalizedEmbedUrl);
                    if (newUrl && newUrl.trim() && newUrl !== (block.content || normalizedEmbedUrl)) {
                      const embedData = await fetchOGPData(newUrl.trim());
                      updateBlock(block.id, { 
                        content: newUrl.trim(),
                        embedData: embedData || { url: newUrl.trim() }
                      });
                    }
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  URLを変更
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-2">
                  {embedUrl ? 'OGP情報を読み込み中...' : '埋め込みURLがありません'}
                </p>
                {embedUrl && (
                  <p className="text-xs text-gray-400 mb-3 break-all">{normalizedEmbedUrl}</p>
                )}
                <button
                  onClick={async () => {
                    if (!embedUrl) {
                      const url = prompt('URLを入力してください:');
                      if (url && url.trim()) {
                        const embedData = await fetchOGPData(url.trim());
                        updateBlock(block.id, { 
                          content: url.trim(),
                          embedData: embedData || { url: url.trim() }
                        });
                      }
                    } else {
                      const embedData = await fetchOGPData(embedUrl);
                      updateBlock(block.id, { 
                        embedData: embedData || { url: embedUrl } 
                      });
                    }
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  {embedUrl ? '再読み込み' : 'URLを設定'}
                </button>
              </div>
            )}
          </div>
        );
      default:
        return (
          <div className="relative">
            <div
              ref={(el) => {
                contentEditableRefs.current[block.id] = el;
                if (el && el.innerHTML !== block.content) {
                  el.innerHTML = block.content || '';
                }
              }}
              contentEditable
              onInput={(e) => {
                const target = e.currentTarget;
                updateBlock(block.id, { content: target.innerHTML });
              }}
              onMouseUp={() => handleTextSelection(block.id)}
              onKeyUp={() => handleTextSelection(block.id)}
              className="w-full border-none outline-none bg-transparent min-h-[120px] leading-relaxed p-0 select-text cursor-text"
              style={{ 
                minHeight: '120px',
                userSelect: 'text',
                WebkitUserSelect: 'text'
              }}
              data-placeholder="テキストを入力...（改行はそのまま反映されます）"
              suppressContentEditableWarning
            />
            <style>{`
              [contenteditable][data-placeholder]:empty:before {
                content: attr(data-placeholder);
                color: #9ca3af;
                pointer-events: none;
              }
              [contenteditable] {
                -webkit-user-select: text !important;
                -moz-user-select: text !important;
                -ms-user-select: text !important;
                user-select: text !important;
              }
              [contenteditable] * {
                -webkit-user-select: text !important;
                -moz-user-select: text !important;
                -ms-user-select: text !important;
                user-select: text !important;
              }
            `}</style>
          </div>
        );
    }
  };

  if (initialLoading) {
    return (
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-sm text-gray-500">読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      <TextToolbar />
      {showLinkDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowLinkDialog(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">リンクを追加</h3>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  applyLink();
                } else if (e.key === 'Escape') {
                  setShowLinkDialog(false);
                  setLinkUrl('');
                }
              }}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowLinkDialog(false);
                  setLinkUrl('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Apply button clicked', { linkUrl, selectedText });
                  applyLink();
                }}
                disabled={!linkUrl.trim()}
                className={`px-4 py-2 bg-primary text-white rounded-md transition-colors ${
                  !linkUrl.trim()
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-primary/90'
                }`}
              >
                適用
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/blog')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <IconArrowLeft className="w-4 h-4" />
            <span>BLOG管理に戻る</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isNew ? '新規記事作成' : '記事編集'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 text-2xl font-bold border-none outline-none bg-transparent"
              placeholder="記事のタイトル"
              required
            />
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-8 min-h-[600px]">
            <div className="space-y-6">
              {blocks.map((block, index) => (
                <div key={block.id} className="group relative">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowBlockMenu(showBlockMenu === block.id ? null : block.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                      >
                        <IconPlus className="w-4 h-4" />
                      </button>
                      {showBlockMenu === block.id && (
                        <div className="relative">
                          <BlockMenu 
                            blockId={block.id} 
                            onClose={() => setShowBlockMenu(null)}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      {renderBlock(block)}
                    </div>
                    <div className="flex-shrink-0 pt-2">
                      <button
                        type="button"
                        onClick={() => deleteBlock(block.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                      >
                        <IconX className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                抜粋（記事一覧に表示される短い説明）
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
                placeholder="記事の概要を入力してください（200文字程度）"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メイン画像URL（記事一覧のサムネイル）
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                note URL（オプション）
              </label>
              <input
                type="url"
                value={noteUrl}
                onChange={(e) => setNoteUrl(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
                placeholder="https://note.com/username/article"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                公開日
              </label>
              <input
                type="date"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                />
                <span className="text-sm font-medium text-gray-700">公開する</span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-6">
            <LoadingButton
              type="submit"
              loading={loading}
              className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              {isNew ? '記事を作成' : '記事を更新'}
            </LoadingButton>
            <button
              type="button"
              onClick={() => navigate('/admin/blog')}
              className="px-8 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BlogEditor;
