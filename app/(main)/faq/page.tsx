'use client';

import { useState, useEffect } from 'react';
import { IconChevronDown } from '@/components/Icons';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  items: FAQItem[];
}

const faqData: FAQCategory[] = [
  {
    title: '配送について',
    items: [
      { question: '商品の代金に送料は含まれていますか？', answer: '商品ページに記載されている金額には送料は含まれておりません。カートに追加後、決済ページにて配達先のご住所を記載いただければ、送料をご確認いただけます。' },
      { question: '海外への発送は可能ですか？', answer: '申し訳ありません。現在、海外への発送はご対応しておりません。' },
      { question: '配送までにどれくらい時間がかかりますか？', answer: '小規模農家であり、天候や他業務に左右される場合がございますので、ご注文確定後7日以内にご発送させていただいております。お急ぎの場合はご注文前にお問い合わせいただければ発送日の目処をお伝えさせていただきます。' },
    ],
  },
  {
    title: '商品について',
    items: [
      { question: '自然栽培と記載されていますが、農薬や肥料は本当に使っていませんか？', answer: 'はい、「自然栽培」と記載しているものに関しては、栽培期間中農薬・肥料不使用にて栽培を行っております。全てのお米に農薬や化学肥料は一切使用しておりません。' },
      { question: '「栽培期間中　◯◯不使用」と記載されているものは、栽培期間外には使用しているということでしょうか？', answer: 'いいえ、1年を通して一切使用しておりません。農林水産省のガイドライン上、記載が必要なためとなっております。' },
    ],
  },
];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const toggleItem = (categoryIndex: number, itemIndex: number) => {
    const key = `${categoryIndex}-${itemIndex}`;
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="pt-28 pb-24 min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-serif tracking-widest text-primary mb-4">FAQ</h1>
          <div className="w-12 h-px bg-primary" />
        </div>
        <div className="space-y-12">
          {faqData.map((category, categoryIndex) => (
            <div key={categoryIndex} className="space-y-4">
              <h2 className="text-xl md:text-2xl font-serif tracking-widest text-primary border-b border-gray-200 pb-3">
                {category.title}
              </h2>
              <div className="space-y-2">
                {category.items.map((item, itemIndex) => {
                  const key = `${categoryIndex}-${itemIndex}`;
                  const isOpen = openItems.has(key);
                  return (
                    <div key={itemIndex} className="border-b border-gray-100">
                      <button
                        type="button"
                        onClick={() => toggleItem(categoryIndex, itemIndex)}
                        className="w-full py-4 flex justify-between items-start text-left hover:text-gray-600 transition-colors"
                      >
                        <span className="text-sm md:text-base font-medium text-gray-900 pr-4">{item.question}</span>
                        <IconChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
                        <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">{item.answer}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-16 pt-8 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500 mb-4">上記で解決しない場合は、お気軽にお問い合わせください。</p>
          <a href="mailto:info@ikevege.com" className="inline-block text-primary hover:text-gray-600 transition-colors text-sm">
            info@ikevege.com
          </a>
        </div>
      </div>
    </div>
  );
}
