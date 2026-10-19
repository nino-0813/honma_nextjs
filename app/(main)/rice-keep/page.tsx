import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getPublishedProductByHandle } from '@/lib/supabase';
import RiceKeepPurchasePanel from '@/components/rice-keep/RiceKeepPurchasePanel';

export const metadata: Metadata = { title: 'ライスキープ', description: '保存袋のプロとお米のプロが共同開発した、お米の保存袋ライスキープ。' };

export const dynamic = 'force-dynamic';

const PURCHASE_NOTICE = `※こちらの商品は対象商品をカートに入れている場合のみご注文が可能となっております。対象商品については下記をご確認ください。
1枚入り：コシヒカリ・亀の尾・にこまる 各種5kg 商品
2枚入り：コシヒカリ・亀の尾・にこまる 各種10kg 20kg 商品
上記対象商品の数量に応じて複数ご注文いただけます。
例）コシヒカリ 5kg 2個 にこまる 10kg 1個カートに入れている場合、ライスキープを最大1枚入りを2個・2枚入りを1個ご注文することができます。`;

const PURCHASE_NOTICE_END = 'ご注文することができます。';

export default async function RiceKeepPage() {
  const product = await getPublishedProductByHandle('ricekeep');
  const description = product?.description?.trim() ?? '';
  const noticeEndIndex = description.indexOf(PURCHASE_NOTICE_END);
  const productDetails = noticeEndIndex >= 0
    ? description.slice(noticeEndIndex + PURCHASE_NOTICE_END.length).trim()
    : description;
  return (
    <main className="page-top-offset min-h-screen bg-white px-5 pb-28 md:px-12">
      <div className="mx-auto grid max-w-6xl items-start gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="relative aspect-[4/5] w-full self-start overflow-hidden bg-gray-50"><Image src="/images/rice-keep-bag.jpg" alt="お米保存袋 ライスキープ" fill className="object-cover" sizes="(max-width:1024px) 100vw, 50vw" priority /></div>
        <div>
          <p className="mb-4 text-sm text-yuunagi-ink">お米をおいしく保つ保存袋</p>
          <h1 className="font-serif text-4xl tracking-wider text-primary md:text-6xl">ライスキープ</h1>
          <div className="mt-10 space-y-6 text-base leading-loose text-gray-700">
            <p>保存袋のプロとお米のプロが共同開発した、常温保存が可能な究極のお米の保存袋です。</p>
            <p>これまで冷蔵が必須だったお米保存の常識を覆し、「新米のまま備蓄」を可能にしてくれます。</p>
          </div>
          {product ? (
            <RiceKeepPurchasePanel product={product} />
          ) : (
            <p className="mt-10 rounded-sm bg-gray-50 p-5 text-sm leading-loose text-gray-600">現在はご購入いただけません。</p>
          )}
          <Link href="/collections/rice" className="mt-8 inline-flex min-h-12 items-center rounded-full border border-primary px-6 text-sm text-primary hover:bg-primary hover:text-white">対象のお米を見る →</Link>
          {product && (
            <div className="mt-12 border-t border-gray-200 pt-8">
              <h2 className="font-serif text-xl tracking-wider text-primary">商品について</h2>
              <p className="mt-5 whitespace-pre-line text-sm leading-loose text-gray-700">{PURCHASE_NOTICE}</p>
              {productDetails && (
                <details className="group mt-5">
                  <summary className="flex cursor-pointer list-none justify-end [&::-webkit-details-marker]:hidden">
                    <span className="inline-flex min-h-10 shrink-0 items-center rounded-full border border-primary px-5 text-xs text-primary transition-colors group-open:bg-primary group-open:text-white">
                      <span className="group-open:hidden">詳しく見る</span>
                      <span className="hidden group-open:inline">閉じる</span>
                    </span>
                  </summary>
                  <p className="mt-5 whitespace-pre-line text-sm leading-loose text-gray-700">{productDetails}</p>
                </details>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
