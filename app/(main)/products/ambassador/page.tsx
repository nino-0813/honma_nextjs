'use client';

import React, { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { FadeInImage, LoadingButton } from '@/components/UI';
import { CartContext } from '@/providers/CartProvider';
import { checkStockAvailability } from '@/lib/supabase';

const AmbassadorProductDetail = () => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const { addToCart, openCart } = useContext(CartContext);
  const [stockError, setStockError] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    window.scrollTo(0, 0);

    const defaultProduct: Product = {
      id: 'ambassador-default',
      title: 'アンバサダー',
      price: 120000,
      image: '/images/joinus/crowdfunding-1052.webp',
      images: ['/images/joinus/crowdfunding-1052.webp'],
      soldOut: false,
      handle: 'ambassador',
      category: 'その他',
      description: 'イケベジ版のオーナー制度。都市部にいながら里山を共に作っていくプログラムです。',
      hasVariants: false,
      stock: undefined,
      is_visible: true,
    };

    setProduct(defaultProduct);
    setCalculatedPrice(120000);
    setLoading(false);
  }, []);

  const handleAddToCart = () => {
    if (!product) return;
    setStockError('');

    const stockCheck = checkStockAvailability(product, {}, quantity, 0);
    if (!stockCheck.available) {
      setStockError(stockCheck.message);
      return;
    }

    addToCart(product, quantity, { finalPrice: calculatedPrice, selectedOptions: {} });
    openCart();
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="h-screen flex items-center justify-center text-center">
        <p className="text-gray-500 mb-4">商品なし</p>
        <Link href="/collections" className="text-primary hover:underline">
          一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 bg-white min-h-screen animate-fade-in overflow-x-hidden w-full">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-[10px] text-gray-400 mb-8 md:mb-12 tracking-widest uppercase">
          <Link href="/" className="hover:text-black transition-colors">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/ambassador" className="hover:text-black transition-colors">
            JOIN US
          </Link>
          <span className="mx-2">/</span>
          <span className="text-black">{product.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-7 flex flex-col-reverse lg:flex-row gap-4 lg:gap-6 items-start">
            {product.images && product.images.length > 0 && (
              <div className="w-full lg:w-24 flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto scrollbar-hide lg:max-h-[80vh] lg:sticky lg:top-32">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative aspect-square w-20 lg:w-full flex-shrink-0 overflow-hidden border transition-all duration-300 ${
                      selectedImage === idx
                        ? 'border-black opacity-100'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <FadeInImage src={img} alt="" className="w-full h-full object-cover" width={160} height={160} />
                  </button>
                ))}
              </div>
            )}
            <div className="flex-1 w-full relative">
              <FadeInImage
                src={
                  product.images && product.images.length > 0
                    ? product.images[selectedImage]
                    : product.image || ''
                }
                alt={product.title}
                priority
                width={1200}
                height={1200}
                className="w-full h-auto object-contain block"
              />
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-32">
              <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-1 h-12 bg-blue-600" />
                  <h1 className="text-2xl md:text-3xl font-serif font-medium">アンバサダー</h1>
                </div>
                <div className="mb-4">
                  <img
                    src="/images/joinus/Iketeru_partner_logo_RGB_2409005.webp"
                    alt="イケてるパートナーズ"
                    className="h-16 md:h-24 w-auto object-contain mb-2"
                  />
                </div>
                <p className="text-sm md:text-base text-gray-600 mb-6">
                  ~都市部にいながら里山を共に作っていく〜
                </p>
              </div>

              <div className="mb-8 border-b border-gray-100 pb-8">
                <span className="text-xl md:text-2xl font-serif text-primary block mb-1">
                  ¥{calculatedPrice.toLocaleString()}
                </span>
                <span className="text-xs text-gray-500 block">税込</span>
                <p className="text-sm text-gray-600 mt-2">+ オプション: 60,000円(税込)</p>
              </div>

              <div className="flex items-center gap-2 mb-8">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm text-gray-600">在庫あり</span>
              </div>

              <div className="space-y-4 mb-12">
                <div className="flex items-center justify-between border border-gray-200 p-1 max-w-[140px] mb-6">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setQuantity(Math.max(1, quantity - 1));
                      setStockError('');
                    }}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-black transition-colors"
                  >
                    −
                  </button>
                  <span className="text-sm font-serif w-8 text-center">{quantity}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setStockError('');
                      setQuantity(quantity + 1);
                    }}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-black transition-colors"
                  >
                    +
                  </button>
                </div>
                <LoadingButton
                  onClick={handleAddToCart}
                  className="w-full py-4 text-sm tracking-widest bg-white text-black border border-black hover:bg-gray-50 transition-colors group relative"
                >
                  <div className="flex items-center justify-center w-full">
                    <span>カートに追加する</span>
                    <span className="absolute right-4 text-lg transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </LoadingButton>
                {stockError && <p className="text-sm text-red-600 mt-2 text-center">{stockError}</p>}
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden mb-8">
                <table className="w-full">
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="bg-gray-50 px-4 py-4 md:px-6 md:py-5 text-sm font-medium text-gray-700 w-1/3 md:w-1/4">
                        面積
                      </td>
                      <td className="px-4 py-4 md:px-6 md:py-5 text-sm text-gray-900">
                        0.1反(=1a) 学校の教室より少し広い
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-gray-50 px-4 py-4 md:px-6 md:py-5 text-sm font-medium text-gray-700">
                        収穫量
                      </td>
                      <td className="px-4 py-4 md:px-6 md:py-5 text-sm text-gray-900">
                        各年の収穫量に対する面積分(1a)のお米(今年コシヒカリで30kg)
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-gray-50 px-4 py-4 md:px-6 md:py-5 text-sm font-medium text-gray-700 align-top">
                        内容
                      </td>
                      <td className="px-4 py-4 md:px-6 md:py-5 text-sm text-gray-900">
                        <ul className="space-y-2">
                          <li>・アンバサダー指定の複数パターンでの発送</li>
                          <li className="pl-4">2合(最大30袋)</li>
                          <li className="pl-4">その他(1.5、5、10、20kgから選択)</li>
                          <li className="pl-4">対応期間 12月~2月</li>
                          <li>・イケベジ新嘗祭inTokyoのご招待</li>
                          <li>・ホームページへの企業ロゴ掲載</li>
                          <li>・全農業体験プログラム無料参加権</li>
                        </ul>
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 px-4 py-4 md:px-6 md:py-5 text-sm font-medium text-gray-700 border-t-2 border-dashed border-gray-300">
                        オプション
                      </td>
                      <td className="px-4 py-4 md:px-6 md:py-5 text-sm text-gray-900">
                        <ul className="space-y-2">
                          <li>・企業ロゴ入りオリジナルパッケージ(2合)</li>
                          <li>・2合(最大90袋)</li>
                        </ul>
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-gray-50 px-4 py-4 md:px-6 md:py-5 text-sm font-medium text-gray-700">
                        金額
                      </td>
                      <td className="px-4 py-4 md:px-6 md:py-5 text-sm text-gray-900">
                        <div className="space-y-1">
                          <p className="text-lg font-serif font-medium">120,000円(税込)</p>
                          <p className="text-sm text-gray-600">+ 60,000円(税込)</p>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-gray-50 px-4 py-4 md:px-6 md:py-5 text-sm font-medium text-gray-700">
                        契約
                      </td>
                      <td className="px-4 py-4 md:px-6 md:py-5 text-sm text-gray-900">
                        年単位で継続可(前年参加企業優先)
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-gray-50 px-4 py-4 md:px-6 md:py-5 text-sm font-medium text-gray-700 align-top">
                        備考
                      </td>
                      <td className="px-4 py-4 md:px-6 md:py-5 text-sm text-gray-900">
                        <ul className="space-y-1">
                          <li>・佐渡への宿泊交通費は含まれません</li>
                          <li>・最低過去3年の平均反収の半量を保証します</li>
                        </ul>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-8 text-center">
                <Link
                  href="/contact"
                  className="inline-block bg-black text-white px-8 py-3 text-sm tracking-widest hover:bg-gray-800 transition-colors uppercase"
                >
                  お問い合わせ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AmbassadorProductDetail;
