import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { convertImageToWebP } from '../../lib/imageUtils';
import { IconPlus, IconTrash, IconEdit, IconLoader2 } from '../../components/Icons';
import { LoadingButton } from '../../components/UI';

interface Review {
  id: string;
  name: string;
  role: string | null;
  comment: string;
  rating: number;
  date: string;
  product_name: string | null;
  images: string[] | null;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

const Reviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // フォームの状態
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    comment: '',
    rating: 5,
    date: new Date().toISOString().split('T')[0],
    product_name: '',
    images: [] as string[],
    status: 'published' as 'draft' | 'published' | 'archived',
  });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    if (!supabase) {
      setError('Supabaseが設定されていません');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('reviews')
        .select('*')
        .order('date', { ascending: false });

      if (fetchError) throw fetchError;
      setReviews(data || []);
    } catch (err: any) {
      console.error('レビュー取得エラー:', err);
      setError(err.message || 'レビューの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!supabase) return;

    setSaving(true);
    try {
      const reviewData = {
        ...formData,
        role: formData.role || null,
        product_name: formData.product_name || null,
        images: formData.images.length > 0 ? formData.images : null,
      };

      if (editingReview) {
        const { error: updateError } = await supabase
          .from('reviews')
          .update(reviewData)
          .eq('id', editingReview.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('reviews')
          .insert([reviewData]);

        if (insertError) throw insertError;
      }

      await fetchReviews();
      resetForm();
      alert(editingReview ? 'レビューを更新しました' : 'レビューを追加しました');
    } catch (err: any) {
      console.error('レビュー保存エラー:', err);
      alert(`保存に失敗しました: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('このレビューを削除しますか？')) return;
    if (!supabase) return;

    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchReviews();
    } catch (err: any) {
      console.error('レビュー削除エラー:', err);
      alert(`削除に失敗しました: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const uploadImageToStorage = async (file: File): Promise<string> => {
    if (!supabase) throw new Error('Supabaseが設定されていません');
    
    const webpFile = await convertImageToWebP(file);
    const fileName = `review-${Math.random().toString(36).substring(2)}.webp`;
    const filePath = `reviews/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, webpFile, {
        cacheControl: 'public, max-age=31536000, immutable',
        upsert: true,
        contentType: 'image/webp',
      });

    if (uploadError) {
      console.error('画像アップロードエラー:', uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map((file) => uploadImageToStorage(file as File));
      const newImageUrls = await Promise.all(uploadPromises);
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newImageUrls]
      }));
    } catch (error) {
      alert('画像のアップロードに失敗しました。');
    } finally {
      setUploading(false);
      // Inputをリセットして同じファイルを再度選べるようにする
      e.target.value = '';
    }
  };

  const removeImage = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleEdit = (review: Review) => {
    setEditingReview(review);
    setFormData({
      name: review.name,
      role: review.role || '',
      comment: review.comment,
      rating: review.rating,
      date: review.date,
      product_name: review.product_name || '',
      images: review.images || [],
      status: review.status,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingReview(null);
    setShowForm(false);
    setFormData({
      name: '',
      role: '',
      comment: '',
      rating: 5,
      date: new Date().toISOString().split('T')[0],
      product_name: '',
      images: [],
      status: 'published',
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <span key={i} className={i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}>
        ★
      </span>
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <IconLoader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold text-gray-900">レビュー管理</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-black text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-all shadow-sm hover:shadow flex items-center gap-2"
        >
          <IconPlus className="w-4 h-4" />
          レビューを追加
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingReview ? 'レビューを編集' : 'レビューを追加'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">お名前 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">役割</label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="例: 年間契約のお客様"
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">コメント *</label>
              <textarea
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                rows={4}
                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all resize-y"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">評価 *</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">日付 *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">商品名</label>
                <input
                  type="text"
                  value={formData.product_name}
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                  placeholder="例: 約5kg"
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">公開状態</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' | 'archived' })}
                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
              >
                <option value="published">公開</option>
                <option value="draft">下書き</option>
                <option value="archived">アーカイブ</option>
              </select>
            </div>

            {/* 画像アップロード */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">画像</label>
              <div className="space-y-4">
                {/* 画像プレビュー */}
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.images.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                          <img
                            src={imageUrl}
                            alt={`レビュー画像 ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          title="画像を削除"
                        >
                          <IconTrash className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* アップロードボタン */}
                <div>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {uploading ? (
                        <>
                          <IconLoader2 className="w-8 h-8 mb-2 text-gray-400 animate-spin" />
                          <p className="text-sm text-gray-500">アップロード中...</p>
                        </>
                      ) : (
                        <>
                          <IconPlus className="w-8 h-8 mb-2 text-gray-400" />
                          <p className="text-sm text-gray-500">
                            <span className="font-semibold">画像を追加</span> または ドラッグ&ドロップ
                          </p>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF (最大10MB)</p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <LoadingButton
                type="submit"
                loading={saving}
                className="bg-black text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-all"
              >
                {editingReview ? '更新する' : '追加する'}
              </LoadingButton>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {reviews.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p>レビューがありません</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reviews.map((review) => (
              <div key={review.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-gray-900">{review.name}</h3>
                      {review.role && (
                        <span className="text-xs text-gray-500">({review.role})</span>
                      )}
                      <span className="text-xs text-gray-400">{review.date}</span>
                      <span className={`px-2 py-0.5 text-xs rounded ${
                        review.status === 'published' 
                          ? 'bg-green-100 text-green-700' 
                          : review.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {review.status === 'published' ? '公開' : review.status === 'draft' ? '下書き' : 'アーカイブ'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">{renderStars(review.rating)}</div>
                      <span className="text-sm font-medium text-gray-700">{review.rating.toFixed(1)}</span>
                      {review.product_name && (
                        <span className="text-xs text-gray-500">・{review.product_name}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">{review.comment}</p>
                    
                    {/* 画像表示 */}
                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {review.images.map((imageUrl, index) => (
                          <div key={index} className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                            <img
                              src={imageUrl}
                              alt={`レビュー画像 ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(review)}
                      className="p-2 hover:bg-gray-100 rounded transition-colors text-gray-500 hover:text-black"
                    >
                      <IconEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(review.id)}
                      disabled={deletingId === review.id}
                      className="p-2 hover:bg-red-50 rounded transition-colors text-gray-500 hover:text-red-500 disabled:opacity-50"
                    >
                      {deletingId === review.id ? (
                        <IconLoader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <IconTrash className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Reviews;

