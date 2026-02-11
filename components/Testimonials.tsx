'use client';

import React, { useState, useEffect } from 'react';
import { Star, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const renderStars = (score: number, size: 'sm' | 'md' | 'lg' = 'md') => {
  const fullStars = Math.floor(score);
  const hasHalfStar = score % 1 >= 0.5;
  
  const starSize = size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5';
  const gapSize = size === 'sm' ? 'gap-0.5' : 'gap-1';

  return (
    <div className={`flex items-center ${gapSize}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${starSize} ${
            i < fullStars 
              ? 'fill-yellow-400 text-yellow-400'
              : i === fullStars && hasHalfStar
                ? 'fill-yellow-400 text-yellow-400 opacity-50'
                : 'fill-gray-200 text-gray-200'
          }`}
        />
      ))}
    </div>
  );
};

interface Review {
  id: string;
  name: string;
  role: string | null;
  comment: string;
  rating: number;
  date: string;
  product_name: string | null;
  images: string[] | null;
}

const Testimonials = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('status', 'published')
        .order('date', { ascending: false });

      if (error) {
        console.error('レビュー取得エラー:', error);
        // エラー時は空配列を設定
        setReviews([]);
      } else {
        setReviews(data || []);
      }
    } catch (err) {
      console.error('レビュー取得エラー:', err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (!reviews.length) return null;

  const average = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
  const count = reviews.length;

  return (
    <section className="py-8 md:py-16 bg-white border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Simple Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-serif font-medium tracking-widest mb-4">お客様の声</h2>
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              {renderStars(average, 'md')}
              <span className="text-2xl font-bold text-gray-900 ml-2">{average.toFixed(1)}</span>
            </div>
            <span className="text-sm text-gray-500">({count}件のレビュー)</span>
          </div>
        </div>

        {/* Simple Review List */}
        <div className="space-y-8">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white border-b border-gray-100 pb-8 last:border-b-0 last:pb-0"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium text-sm text-gray-900">
                      {review.name}
                      {review.role && (
                        <span className="ml-2 text-xs text-gray-500">({review.role})</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{review.date.replace(/-/g, '.')}</div>
                  </div>
                </div>
                {review.product_name && (
                  <div className="text-xs text-gray-500">{review.product_name}</div>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-3">
                {renderStars(review.rating, 'sm')}
                <span className="text-sm font-medium text-gray-700">{review.rating.toFixed(1)}</span>
              </div>

              {/* Content */}
              <p className="text-sm text-gray-700 leading-relaxed">
                {review.comment}
              </p>

              {/* Images */}
              {review.images && review.images.length > 0 && (
                <div className="mt-4 flex gap-2">
                  {review.images.map((img, i) => (
                    <div key={i} className="w-20 h-20 rounded overflow-hidden border border-gray-200">
                      <img 
                        src={img} 
                        alt="Review" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Testimonials;
