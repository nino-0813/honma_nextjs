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
  {
    title: '決済について',
    items: [
      {
        question: '利用できる決済方法は何ですか？',
        answer: '現在、クレジットカード、銀行振込をご利用いただけます。\nただし、定期便商品についてはクレジットカードでのお支払いのみとなっております。',
      },
      {
        question: '領収書はどこでダウンロードできますか？',
        answer: 'マイページにログインしていただき、購入履歴から該当の注文を選択していただくと領収書をダウンロードすることができます。宛名の変更が必要な場合はダウンロード前に変更することができます。また商品の発送以降、ダウンロードは可能となります。',
      },
    ],
  },
  {
    title: '銀行振込について',
    items: [
      { question: '銀行振込で支払うことはできますか？', answer: 'はい。お支払い方法選択時に「銀行振込」をお選びいただけます。\nご注文後に表示される専用の振込先口座へ、ご注文金額をお振り込みください。' },
      { question: '振込先はイケベジの銀行口座ですか？', answer: 'いいえ。\n銀行振込による決済には、決済サービス「Stripe」を利用しています。ご注文後に、Stripeが発行するお客様専用の振込先口座をご案内します。\n表示された口座へお振り込みください。' },
      { question: '注文するたびに振込先口座は変わりますか？', answer: '振込先口座は、お客様ごとに発行される専用口座です。\n原則として、同じお客様には同じ専用口座が使用される場合がありますが、お振り込みの際は必ずそのご注文時に表示された振込先をご確認ください。' },
      { question: '振込手数料はかかりますか？', answer: '金融機関からの振込手数料は、お客様のご負担となります。\n振込手数料の金額は、ご利用の銀行や振込方法によって異なります。' },
      { question: '銀行振込を選択したら、すぐに注文は確定しますか？', answer: 'ご注文受付後、お振り込みいただいた金額の入金確認が取れ次第、お支払い完了となります。\n商品の発送準備は、原則として入金確認後に開始します。' },
      { question: '振り込んでからどのくらいで入金が確認されますか？', answer: '金融機関やお振り込みいただいた時間帯によって、入金確認まで時間がかかる場合があります。\n土日祝日や金融機関の営業時間外にお振り込みいただいた場合などは、反映までお時間をいただくことがあります。' },
      { question: '振込名義は注文者本人でないといけませんか？', answer: 'ご注文者様ご本人名義でのお振り込みをお願いいたします。\nご注文者様と異なる名義でお振り込みいただいた場合でも確認できる場合がありますが、入金確認に時間がかかる可能性があります。\n異なる名義でお振り込みされた場合は、お問い合わせフォームよりご連絡ください。' },
      { question: '振込金額を間違えてしまいました。', answer: '表示されているご請求金額と同額をお振り込みください。\n金額を間違えてお振り込みされた場合は、追加のお振り込みや返金等の対応が必要になる場合がありますので、お問い合わせフォームよりご連絡ください。' },
      { question: '振込後に連絡する必要はありますか？', answer: '通常は必要ありません。\nStripe側で入金が確認されると、自動的にお支払い状況へ反映されます。\nただし、振込金額や振込名義を間違えた場合などはご連絡をお願いいたします。' },
      { question: '銀行振込後にキャンセル・返金することはできますか？', answer: '銀行振込後、発送準備に入らせていただくため、原則キャンセルは不可となります。\n詳しくはお問い合わせください。' },
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
    <div className="page-top-offset min-h-screen bg-white pb-24">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        <div className="mb-12">
          <p className="text-[13px] font-medium text-primary mb-3">
            よくあるご質問
          </p>
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
                      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[1200px] opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
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
          <a href="/contact" className="inline-block text-primary hover:text-gray-600 transition-colors text-sm">
            info@ikevege.com
          </a>
        </div>
      </div>
    </div>
  );
}
