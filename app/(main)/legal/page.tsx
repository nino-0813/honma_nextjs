'use client';

import { useEffect } from 'react';
import Image from 'next/image';

export default function LegalPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-28 pb-24 min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-serif tracking-widest text-primary mb-4">特定商取引法に基づく表記</h1>
          <div className="w-12 h-px bg-primary" />
        </div>
        <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-8">
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-serif tracking-widest text-primary mt-12 mb-6">事業者情報</h2>
            <dl className="space-y-3 text-sm md:text-base leading-relaxed">
              <div className="flex flex-col md:flex-row">
                <dt className="font-medium text-gray-900 w-32 flex-shrink-0 mb-1 md:mb-0">会社名</dt>
                <dd className="text-gray-700">株式会社naco</dd>
              </div>
              <div className="flex flex-col md:flex-row">
                <dt className="font-medium text-gray-900 w-32 flex-shrink-0 mb-1 md:mb-0">事業者の名称</dt>
                <dd className="text-gray-700">本間 涼</dd>
              </div>
              <div className="flex flex-col md:flex-row">
                <dt className="font-medium text-gray-900 w-32 flex-shrink-0 mb-1 md:mb-0">事業者の所在地</dt>
                <dd className="text-gray-700">〒952-0317<br />新潟県佐渡市豊田560</dd>
              </div>
              <div className="flex flex-col md:flex-row">
                <dt className="font-medium text-gray-900 w-32 flex-shrink-0 mb-1 md:mb-0">事業者の連絡先</dt>
                <dd className="text-gray-700">
                  Tel: <a href="tel:050-3634-5251" className="text-primary hover:underline">050-3634-5251</a><br />
                  Mail: <a href="mailto:info@ikevege.com" className="text-primary hover:underline">info@ikevege.com</a>
                </dd>
              </div>
            </dl>
          </section>
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-serif tracking-widest text-primary mt-12 mb-6">販売価格</h2>
            <p className="text-sm md:text-base leading-relaxed">
              販売価格は、税込み表記となっております。<br />
              また、別途配送料が掛かります。配送料に関しては商品詳細ページをご確認ください。
            </p>
          </section>
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-serif tracking-widest text-primary mt-12 mb-6">送料に関して</h2>
            <p className="text-sm md:text-base leading-relaxed mb-4">下記の金額をご確認ください。</p>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">【佐渡発】</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Image
                    src="/images/features/feature_screenshot_2025_12_08.webp"
                    alt="佐渡発送料表"
                    width={800}
                    height={600}
                    className="w-full h-auto rounded border border-gray-200"
                  />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">【淡路発】</h3>
                <p className="text-sm text-gray-500 italic">（準備中）</p>
              </div>
            </div>
          </section>
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-serif tracking-widest text-primary mt-12 mb-6">発送に関して</h2>
            <p className="text-sm md:text-base leading-relaxed">発送場所：ご購入された商品は、国内発送に限ります。</p>
          </section>
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-serif tracking-widest text-primary mt-12 mb-6">代金の支払方法・時期</h2>
            <dl className="space-y-3 text-sm md:text-base leading-relaxed">
              <div className="flex flex-col md:flex-row">
                <dt className="font-medium text-gray-900 w-40 flex-shrink-0 mb-1 md:mb-0">支払方法</dt>
                <dd className="text-gray-700">クレジットカードによる決済がご利用いただけます。</dd>
              </div>
              <div className="flex flex-col md:flex-row">
                <dt className="font-medium text-gray-900 w-40 flex-shrink-0 mb-1 md:mb-0">支払時期</dt>
                <dd className="text-gray-700">商品注文確定時にお支払いが確定いたします。</dd>
              </div>
            </dl>
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">※現在、クレジットカード以外の決済方法については対応しておりません。</p>
            </div>
          </section>
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-serif tracking-widest text-primary mt-12 mb-6">商品のお届け時期</h2>
            <p className="text-sm md:text-base leading-relaxed">
              代金のお支払い確定後、5営業日以内に発送予定となっております。農業の繁忙期等で発送が遅れる可能性もございますのでご了承くださいませ。
            </p>
          </section>
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-serif tracking-widest text-primary mt-12 mb-6">返品について</h2>
            <p className="text-sm md:text-base leading-relaxed">商品に欠陥がある場合をのぞき、基本的には返品には応じません。</p>
          </section>
        </div>
      </div>
    </div>
  );
}
