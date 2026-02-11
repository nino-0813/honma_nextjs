import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { IconPlus, IconSearch, IconFilter, IconEdit, IconTrash, IconUpload, IconDownload, IconEye, IconEyeOff, IconGripVertical } from '../../components/Icons';
import { FadeInImage } from '../../components/UI';

interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  category: string;
  subcategory?: string;
  handle: string;
  stock: number;
  has_variants?: boolean;
  is_active: boolean;
  created_at: string;
  description?: string;
  sku?: string;
  variants_config?: any;
  status?: string;
  display_order?: number;
  is_visible?: boolean;
}

const ProductList = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [hasUnsavedReorder, setHasUnsavedReorder] = useState(false);
  const originalOrderRef = useRef<Product[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('display_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) {
        // カラムが存在しない場合のエラーを無視して続行
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          console.warn('display_orderまたはis_visibleカラムが存在しません。データベースを更新してください。');
          // カラムなしで再取得
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (fallbackError) throw fallbackError;
          
          const productsWithOrder = (fallbackData || []).map((product: any, index) => ({
            ...product,
            display_order: index,
            is_visible: true
          }));
          
          setProducts(productsWithOrder);
          return;
        }
        throw error;
      }
      
      // display_orderがnullまたは0の商品に初期値を設定（created_at順）
      const sortedData = [...(data || [])].sort((a: any, b: any) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA; // 新しい順
      });
      
      const productsWithOrder = sortedData.map((product: any, index) => ({
        ...product,
        display_order: product.display_order !== null && product.display_order !== undefined ? product.display_order : index,
        is_visible: product.is_visible !== null && product.is_visible !== undefined ? product.is_visible : true
      }));
      
      // 初期化が必要な商品を更新（display_orderがnull、undefined、またはすべて0の場合）
      const allHaveSameOrder = productsWithOrder.every((p: any) => p.display_order === 0);
      const needsUpdate = productsWithOrder.filter((p: any, i: number) => 
        p.display_order === null || 
        p.display_order === undefined || 
        (allHaveSameOrder && p.display_order === 0) ||
        p.is_visible === null || 
        p.is_visible === undefined
      );
      
      if (needsUpdate.length > 0) {
        // バックグラウンドで更新（エラーは無視）
        for (const product of needsUpdate) {
          try {
            const newOrder = allHaveSameOrder ? productsWithOrder.indexOf(product) : (product.display_order ?? productsWithOrder.indexOf(product));
            await supabase
              .from('products')
              .update({ 
                display_order: newOrder,
                is_visible: product.is_visible ?? true
              })
              .eq('id', product.id);
          } catch (updateError) {
            // カラムが存在しない場合は無視
            console.warn('商品の初期化に失敗しました（カラムが存在しない可能性があります）:', updateError);
          }
        }
        // 更新後に再取得
        const { data: refreshedData, error: refreshError } = await supabase
          .from('products')
          .select('*')
          .order('display_order', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: false });
        
        if (!refreshError && refreshedData) {
          const refreshedProducts = refreshedData.map((product: any, index) => ({
            ...product,
            display_order: product.display_order ?? index,
            is_visible: product.is_visible ?? true
          }));
          setProducts(refreshedProducts);
          return;
        }
      }
      
      setProducts(productsWithOrder);
    } catch (error) {
      console.error('商品データの取得に失敗しました:', error);
      alert('商品データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('本当にこの商品を削除しますか？\n※この操作は取り消せません。')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setProducts(products.filter(p => p.id !== id));
      setSelectedProducts(selectedProducts.filter(pid => pid !== id));
      alert('商品を削除しました');
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  // バリエーション在庫を計算する関数（各バリエーションタイプは独立して在庫管理）
  const calculateVariantStock = (product: Product): number => {
    const variantsConfig = product.variants_config;
    const hasVariants = Boolean(
      (product as any).hasVariants ||
      product.has_variants ||
      (Array.isArray(variantsConfig) && variantsConfig.length > 0)
    );

    if (!hasVariants || !Array.isArray(variantsConfig) || variantsConfig.length === 0) {
      // バリエーションがない（または設定がない）場合は基本在庫を返す
      return product.stock ?? 0;
    }

    // 各バリエーションタイプの在庫を計算（独立して管理）
    const variantStocks: number[] = [];

    for (const vt of variantsConfig) {
      if (vt.stockManagement === 'none') {
        // 在庫管理しない場合はスキップ
        continue;
      } else if (vt.stockManagement === 'individual' || vt.stockManagement === 'shared') {
        let typeStock = 0;
        // 在庫共有が有効な場合
        if (vt.sharedStock !== null && vt.sharedStock !== undefined) {
          typeStock = Number(vt.sharedStock);
        } else {
          // 個別在庫の場合、各選択肢の在庫を合計
          for (const opt of vt.options || []) {
            if (opt.stock !== null && opt.stock !== undefined) {
              typeStock += Number(opt.stock);
            }
          }
        }
        // 各バリエーションタイプの在庫を配列に追加
        if (typeStock > 0) {
          variantStocks.push(typeStock);
        }
      }
    }

    // 複数のバリエーションタイプがある場合、最小値を返す（最も制限的な在庫）
    // または、すべてのバリエーションタイプの在庫を合計する
    // ここでは、各バリエーションタイプが独立しているため、最小値を返す
    if (variantStocks.length === 0) {
      return 0;
    } else if (variantStocks.length === 1) {
      return variantStocks[0];
    } else {
      // 複数のバリエーションタイプがある場合、最小値を返す
      return Math.min(...variantStocks);
    }
  };

  const filteredProducts = products
    .filter(product => 
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      // 表示順でソート（display_orderが小さい順、nullは最後）
      const orderA = a.display_order ?? 999999;
      const orderB = b.display_order ?? 999999;
      return orderA - orderB;
    });

  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedProducts.includes(id)) {
      setSelectedProducts(selectedProducts.filter(pid => pid !== id));
    } else {
      setSelectedProducts([...selectedProducts, id]);
    }
  };

  // ドラッグ&ドロップ処理
  const handleDragStart = (e: React.DragEvent, productId: string) => {
    if (!isReorderMode) return;
    setDraggedItem(productId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, productId: string) => {
    if (!isReorderMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedItem && draggedItem !== productId) {
      setDragOverItem(productId);
    }
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = async (e: React.DragEvent, targetProductId: string) => {
    e.preventDefault();
    setDragOverItem(null);

    if (!isReorderMode) {
      setDraggedItem(null);
      return;
    }

    if (!draggedItem || draggedItem === targetProductId) {
      setDraggedItem(null);
      return;
    }

    // filteredProductsのインデックスを取得（表示されている順序）
    const draggedIndex = filteredProducts.findIndex(p => p.id === draggedItem);
    const targetIndex = filteredProducts.findIndex(p => p.id === targetProductId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItem(null);
      return;
    }

    // filteredProductsの順序を変更（表示されている順序に基づく）
    const newFilteredProducts = [...filteredProducts];
    const [removed] = newFilteredProducts.splice(draggedIndex, 1);
    newFilteredProducts.splice(targetIndex, 0, removed);

    // 現在のproducts全体をソート
    const sortedProducts = [...products].sort((a, b) => {
      const orderA = a.display_order ?? 999999;
      const orderB = b.display_order ?? 999999;
      return orderA - orderB;
    });

    // filteredProductsの新しい順序に基づいて、全商品のdisplay_orderを再計算
    // まず、filteredProducts内の商品の新しい順序を決定
    const filteredProductIds = newFilteredProducts.map(p => p.id);
    
    // 全商品のdisplay_orderを更新
    // filteredProducts内の商品は、filteredProducts内での順序に基づいてdisplay_orderを設定
    // filteredProducts外の商品は、元のdisplay_orderを維持
    const updates: { id: string; display_order: number }[] = [];
    let currentOrder = 0;

    // filteredProducts内の商品を新しい順序で更新
    for (const filteredProduct of newFilteredProducts) {
      updates.push({
        id: filteredProduct.id,
        display_order: currentOrder
      });
      currentOrder++;
    }

    // filteredProducts外の商品は、元の順序を維持（ただし、filteredProductsの後に配置）
    for (const product of sortedProducts) {
      if (!filteredProductIds.includes(product.id)) {
        updates.push({
          id: product.id,
          display_order: currentOrder
        });
        currentOrder++;
      }
    }

    // ローカル状態のみ更新（保存時にまとめて反映）
    const updatedProducts = updates.map(u => {
      const target = products.find(p => p.id === u.id);
      return target ? { ...target, display_order: u.display_order } : null;
    }).filter(Boolean) as Product[];

    // 未更新の商品を既存順序で後ろに付ける
    const untouchedProducts = products
      .filter(p => !updates.find(u => u.id === p.id))
      .sort((a, b) => (a.display_order ?? 999999) - (b.display_order ?? 999999));

    const merged = [...updatedProducts, ...untouchedProducts].map((p, idx) => ({
      ...p,
      display_order: idx
    }));

    setProducts(merged);
    setHasUnsavedReorder(true);
    setDraggedItem(null);
  };

  // 並び替えモード
  const startReorderMode = () => {
    originalOrderRef.current = [...products];
    setIsReorderMode(true);
    setHasUnsavedReorder(false);
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const cancelReorder = () => {
    if (originalOrderRef.current.length > 0) {
      setProducts(originalOrderRef.current);
    }
    setIsReorderMode(false);
    setHasUnsavedReorder(false);
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const saveReorder = async () => {
    if (!hasUnsavedReorder) {
      setIsReorderMode(false);
      return;
    }

    if (!supabase) {
      alert('保存に失敗しました（Supabase未設定）');
      return;
    }

    const ordered = [...products].sort((a, b) => (a.display_order ?? 999999) - (b.display_order ?? 999999));

    try {
      // RLSでINSERTが禁止されている場合があるため、upsertではなく個別updateで対応
      for (let idx = 0; idx < ordered.length; idx++) {
        const item = ordered[idx];
        const { error } = await supabase
          .from('products')
          .update({ display_order: idx })
          .eq('id', item.id);
        if (error) {
          throw new Error(error.message || '更新エラー');
        }
      }

      await fetchProducts();
      setIsReorderMode(false);
      setHasUnsavedReorder(false);
      alert('表示順を保存しました。');
    } catch (error) {
      console.error('並び替え保存エラー:', error);
      const message = error instanceof Error ? error.message : JSON.stringify(error);
      alert(`表示順の保存に失敗しました: ${message}`);
    }
  };

  // 一括操作
  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) {
      alert('商品を選択してください');
      return;
    }
    if (!window.confirm('選択した商品を削除しますか？\nこの操作は取り消せません。')) return;
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', selectedProducts);
      if (error) throw error;
      setProducts(products.filter(p => !selectedProducts.includes(p.id)));
      setSelectedProducts([]);
      alert('削除しました');
    } catch (error) {
      console.error('一括削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  const handleBulkVisibility = async (visible: boolean) => {
    if (selectedProducts.length === 0) {
      alert('商品を選択してください');
      return;
    }
    try {
      // is_visibleとis_activeを連動させる
      const { error } = await supabase
        .from('products')
        .update({ 
          is_visible: visible,
          is_active: visible,
          status: visible ? 'active' : 'draft'
        })
        .in('id', selectedProducts);
      if (error) throw error;
      setProducts(products.map(p => 
        selectedProducts.includes(p.id) 
          ? { ...p, is_visible: visible, is_active: visible, status: visible ? 'active' : 'draft' } 
          : p
      ));
      setSelectedProducts([]);
      alert(visible ? '公開にしました' : '非公開にしました');
    } catch (error) {
      console.error('一括公開/非公開エラー:', error);
      alert('更新に失敗しました');
    }
  };

  // 表示/非表示のトグル（ステータスも連動）
  const toggleVisibility = async (productId: string, currentVisibility: boolean) => {
    try {
      const newVisibility = !currentVisibility;
      // is_visibleとis_activeを連動させる
      const { error } = await supabase
        .from('products')
        .update({ 
          is_visible: newVisibility,
          is_active: newVisibility,
          status: newVisibility ? 'active' : 'draft'
        })
        .eq('id', productId);

      if (error) throw error;

      // ローカル状態を更新
      setProducts(products.map(p => 
        p.id === productId ? { 
          ...p, 
          is_visible: newVisibility,
          is_active: newVisibility,
          status: newVisibility ? 'active' : 'draft'
        } : p
      ));
    } catch (error) {
      console.error('表示状態の更新エラー:', error);
      alert('表示状態の更新に失敗しました');
    }
  };

  // ステータス変更（is_visibleも連動）
  const toggleStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      // is_activeとis_visibleを連動させる
      const { error } = await supabase
        .from('products')
        .update({ 
          is_active: newStatus,
          is_visible: newStatus,
          status: newStatus ? 'active' : 'draft'
        })
        .eq('id', productId);

      if (error) throw error;

      // ローカル状態を更新
      setProducts(products.map(p => 
        p.id === productId ? { 
          ...p, 
          is_active: newStatus,
          is_visible: newStatus,
          status: newStatus ? 'active' : 'draft'
        } : p
      ));
    } catch (error) {
      console.error('ステータスの更新エラー:', error);
      alert('ステータスの更新に失敗しました');
    }
  };

  const handleExportCSV = () => {
    const productsToExport = selectedProducts.length > 0 
      ? products.filter(p => selectedProducts.includes(p.id))
      : products;

    const csvHeader = [
      'id（変更不要・自動生成）',
      'title（必須）',
      'description（改行可能）',
      'status（active または draft）',
      'category（お米、その他）',
      'subcategory（カテゴリーに応じたサブカテゴリー）',
      'handle（URL末尾・英数字とハイフンのみ推奨）',
      'price（必須・数値）',
      'stock（数値）',
      'sku（必須・数字の先頭に\'をつける）'
    ];
    const csvRows = productsToExport.map(product => [
      product.id,
      `"${(product.title || '').replace(/"/g, '""')}"`,
      `"${(product.description || '').replace(/"/g, '""')}"`,
      product.is_active ? 'active' : 'draft',
      product.category || '',
      product.subcategory || '',
      product.handle || '',
      product.price || 0,
      product.stock || 0,
      product.sku || ''
    ]);

    const csvContent = [
      csvHeader.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `products_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        
        // セル内改行を正しく処理するCSVパース
        const parseCSV = (csvText: string): string[][] => {
          const rows: string[][] = [];
          let currentRow: string[] = [];
          let currentCell = '';
          let inQuote = false;
          
          for (let i = 0; i < csvText.length; i++) {
            const char = csvText[i];
            const nextChar = csvText[i + 1];
            
            if (char === '"') {
              if (inQuote && nextChar === '"') {
                // エスケープされたダブルクォート
                currentCell += '"';
                i++; // 次の文字をスキップ
              } else {
                // クォートの開始/終了
                inQuote = !inQuote;
              }
            } else if (char === ',' && !inQuote) {
              // セルの終了
              currentRow.push(currentCell);
              currentCell = '';
            } else if ((char === '\n' || char === '\r') && !inQuote) {
              // 行の終了（セル内改行ではない）
              if (char === '\r' && nextChar === '\n') {
                i++; // \r\nをスキップ
              }
              if (currentCell || currentRow.length > 0) {
                currentRow.push(currentCell);
                rows.push(currentRow);
                currentRow = [];
                currentCell = '';
              }
            } else {
              // 通常の文字（セル内改行も含む）
              currentCell += char;
            }
          }
          
          // 最後の行を追加
          if (currentCell || currentRow.length > 0) {
            currentRow.push(currentCell);
            rows.push(currentRow);
          }
          
          return rows;
        };
        
        const rows = parseCSV(text);

        // ヘッダー行から補足を除去して列名を取得
        const header = rows[0].map(h => {
          const trimmed = h.trim();
          // 補足（（）内）を除去
          const match = trimmed.match(/^([^(（]+)/);
          return match ? match[1].trim() : trimmed;
        });
        const dataRows = rows.slice(1).filter(r => r.length === header.length);

        const updates = [];
        const errors = [];

        for (const row of dataRows) {
          const productData: any = {};
          header.forEach((key, index) => {
            productData[key] = row[index];
          });

          // SKUチェック
          if (!productData.sku || productData.sku.trim() === '') {
            errors.push(`SKUが設定されていない行があります: ${productData.title || '不明な商品'}`);
            continue;
          }

          // 必須フィールドチェック
          if (!productData.title || productData.title.trim() === '') {
            errors.push(`タイトルが設定されていない行があります: SKU ${productData.sku}`);
            continue;
          }

          if (!productData.price || isNaN(parseInt(productData.price))) {
            errors.push(`価格が無効な行があります: ${productData.title || productData.sku}`);
            continue;
          }

          // データの整形
          const statusValue = productData.status || 'active';
          const isActive = statusValue === 'active' || statusValue === 'true';
          
          // descriptionの改行を保持（そのまま反映）
          let description = productData.description ? productData.description.trim() : null;
          // 改行文字をそのまま保持（\nを\nとして保存）
          
          const cleanData: any = {
            title: productData.title.trim(),
            description: description,
            is_active: isActive,
            status: isActive ? 'active' : 'draft',
            category: productData.category || 'お米',
            subcategory: productData.subcategory || null,
            handle: productData.handle ? productData.handle.trim() : null,
            price: parseInt(productData.price) || 0,
            stock: parseInt(productData.stock) || 0,
            sku: productData.sku.trim(),
          };

          // handleがない場合はSKUから生成（新規作成時のみ使用）
          if (!cleanData.handle) {
            cleanData.handle = cleanData.sku.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          }

          updates.push(cleanData);
        }

        if (errors.length > 0) {
          alert(`インポートエラー:\n${errors.join('\n')}`);
          if (!window.confirm('エラーのある行を除いてインポートを続けますか？')) {
             setUploading(false);
             if (fileInputRef.current) fileInputRef.current.value = '';
             return;
          }
        }

        // 一括更新処理
        let successCount = 0;
        let failureCount = 0;
        const failureDetails: string[] = [];

        for (const product of updates) {
          try {
            // SKUで既存商品を検索
            const { data: existing, error: searchError } = await supabase
              .from('products')
              .select('id, has_variants, variants_config')
              .eq('sku', product.sku)
              .single();

            if (searchError && searchError.code !== 'PGRST116') {
              // PGRST116は「行が見つからない」エラー（新規作成の場合に正常）
              throw searchError;
            }

            // ガード: バリエーション有りの商品は stock を常に0に固定（CSVで入ってきても無視）
            const existingHasVariantsFromConfig =
              existing && Array.isArray((existing as any).variants_config) && (existing as any).variants_config.length > 0;
            const existingHasVariants =
              Boolean(existing && (((existing as any).has_variants) || existingHasVariantsFromConfig));
            if (existingHasVariants) {
              product.stock = 0;
            }

            if (existing) {
              // 更新
              const { error: updateError } = await supabase
                .from('products')
                .update(product)
                .eq('id', existing.id);

              if (updateError) {
                throw updateError;
              }
              successCount++;
            } else {
              // 新規作成
              // handleの重複チェック
              if (!product.handle) {
                // handleがない場合はSKUから生成
                product.handle = product.sku.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `prod-${Date.now()}`;
              }
              
              // handleの重複を確認
              const { data: existingHandle } = await supabase
                .from('products')
                .select('id')
                .eq('handle', product.handle)
                .single();

              if (existingHandle) {
                // handleが重複している場合はタイムスタンプを追加
                product.handle = `${product.handle}-${Date.now()}`;
              }
              
              const { error: insertError } = await supabase
                .from('products')
                .insert(product);

              if (insertError) {
                throw insertError;
              }
              successCount++;
            }
          } catch (error: any) {
            failureCount++;
            const errorMessage = error?.message || '不明なエラー';
            failureDetails.push(`SKU: ${product.sku} (${product.title || 'タイトル不明'}) - ${errorMessage}`);
            console.error(`商品更新エラー (SKU: ${product.sku}):`, error);
          }
        }

        // 結果を表示
        if (failureCount > 0) {
          const message = `CSVインポートが完了しました。\n\n成功: ${successCount}件\n失敗: ${failureCount}件\n\n失敗した商品:\n${failureDetails.slice(0, 10).join('\n')}${failureDetails.length > 10 ? `\n...他${failureDetails.length - 10}件` : ''}`;
          alert(message);
        } else {
          alert(`CSVインポートが完了しました。\n\n成功: ${successCount}件`);
        }
        
        fetchProducts();

      } catch (error) {
        console.error('CSV Import Error:', error);
        alert('CSVの読み込み中にエラーが発生しました');
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsText(file);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold text-gray-900">商品管理</h1>
        <div className="flex gap-2">
          <button 
            onClick={handleExportCSV}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
          >
            <IconDownload className="w-4 h-4" />
            CSVエクスポート
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
            disabled={uploading}
          >
            <IconUpload className="w-4 h-4" />
            {uploading ? '読み込み中...' : 'CSVインポート'}
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportCSV} 
            accept=".csv" 
            className="hidden" 
          />
          <Link to="/admin/products/new">
            <a className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-all shadow-sm hover:shadow flex items-center gap-2">
              <IconPlus className="w-4 h-4" />
              商品を追加
            </a>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col gap-3 md:flex-row md:items-center md:gap-4 md:justify-between">
          <div className="flex-1 relative">
             <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
             <input 
               type="text" 
               placeholder="商品を検索 (タイトル、SKU、ハンドル)..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all bg-white"
             />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleBulkVisibility(true)}
              className="px-3 py-2 text-xs md:text-sm rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
              disabled={selectedProducts.length === 0}
            >
              一括公開
            </button>
            <button
              onClick={() => handleBulkVisibility(false)}
              className="px-3 py-2 text-xs md:text-sm rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
              disabled={selectedProducts.length === 0}
            >
              一括非公開
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-2 text-xs md:text-sm rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
              disabled={selectedProducts.length === 0}
            >
              一括削除
            </button>
            {!isReorderMode ? (
              <button
                onClick={startReorderMode}
                className="px-3 py-2 text-xs md:text-sm rounded-md border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 transition-all"
              >
                並び替えモード
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={saveReorder}
                  className="px-3 py-2 text-xs md:text-sm rounded-md border border-purple-600 text-white bg-purple-600 hover:bg-purple-700 transition-all"
                >
                  保存
                </button>
                <button
                  onClick={cancelReorder}
                  className="px-3 py-2 text-xs md:text-sm rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all"
                >
                  キャンセル
                </button>
                {hasUnsavedReorder && (
                  <span className="text-xs text-purple-700 self-center px-2">未保存の変更あり</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-gray-500">読み込み中...</div>
          ) : filteredProducts.length === 0 ? (
             <div className="p-12 text-center text-gray-500">商品が見つかりませんでした</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 w-12"></th>
                  <th className="px-6 py-3 w-16">
                     <input 
                       type="checkbox" 
                       className="rounded border-gray-300 text-black focus:ring-black" 
                       checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                       onChange={toggleSelectAll}
                     />
                  </th>
                  <th className="px-6 py-3">商品</th>
                  <th className="px-6 py-3">SKU</th>
                  <th className="px-6 py-3">ステータス</th>
                  <th className="px-6 py-3">在庫</th>
                  <th className="px-6 py-3">カテゴリー</th>
                  <th className="px-6 py-3 text-right">価格</th>
                  <th className="px-6 py-3 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => (
                  <tr 
                    key={product.id} 
                    className={`group hover:bg-gray-50/80 transition-colors cursor-pointer ${
                      draggedItem === product.id ? 'opacity-50' : ''
                    } ${
                      dragOverItem === product.id ? 'bg-blue-50 border-t-2 border-blue-400' : ''
                    } ${isReorderMode ? 'cursor-move' : ''}`}
                    draggable={isReorderMode}
                    onDragStart={(e) => handleDragStart(e, product.id)}
                    onDragOver={(e) => handleDragOver(e, product.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, product.id)}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a') || (e.target as HTMLElement).closest('input[type="checkbox"]') || (e.target as HTMLElement).closest('.drag-handle')) return;
                      navigate(`/admin/products/${product.id}`);
                    }}
                  >
                    <td className="px-2 py-4 cursor-move drag-handle" onClick={(e) => e.stopPropagation()}>
                      <IconGripVertical className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-black focus:ring-black" 
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => toggleSelect(product.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleVisibility(product.id, product.is_visible ?? true);
                          }}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                            product.is_visible !== false 
                              ? 'bg-purple-600' 
                              : 'bg-gray-200'
                          }`}
                          title={product.is_visible !== false ? '非表示にする' : '表示する'}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                              product.is_visible !== false ? 'translate-x-4' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-md overflow-hidden border border-gray-100 flex-shrink-0 bg-gray-100">
                          {product.image ? (
                            <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Img</div>
                          )}
                        </div>
                        <span className="font-medium text-gray-900 line-clamp-1 max-w-xs">{product.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                      <div className="leading-tight">
                        <div>{product.sku || '-'}</div>
                        <div className="text-[10px] text-gray-400">{product.id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStatus(product.id, product.is_active);
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${
                          !product.is_active
                            ? 'bg-gray-100 text-gray-600' 
                            : 'bg-green-50 text-green-700 border border-green-100'
                        }`}
                        title={product.is_active ? '非公開にする' : '販売中にする'}
                      >
                        {product.is_active && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                        {product.is_active ? '販売中' : '非公開'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {calculateVariantStock(product)}
                    </td>
                     <td className="px-6 py-4 text-gray-500">
                      {product.category}
                      {product.subcategory && <span className="text-xs text-gray-400 ml-1">({product.subcategory})</span>}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      ¥{product.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             navigate(`/admin/products/${product.id}`);
                           }}
                           className="p-1 text-gray-400 hover:text-gray-600"
                           title="編集"
                         >
                           <IconEdit className="w-4 h-4" />
                         </button>
                         <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             handleDelete(product.id);
                           }}
                           className="p-1 text-gray-400 hover:text-red-600"
                           title="削除"
                         >
                           <IconTrash className="w-4 h-4" />
                         </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
          <span>{filteredProducts.length} 件を表示</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50" disabled>前へ</button>
            <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50" disabled>次へ</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductList;