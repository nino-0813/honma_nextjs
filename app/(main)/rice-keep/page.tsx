import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = { title: 'ライスキープ', description: '保存袋のプロとお米のプロが共同開発した、お米の保存袋ライスキープ。' };

export default function RiceKeepPage() {
  return (
    <main className="min-h-screen bg-white px-5 pb-28 pt-32 md:px-12 md:pt-40">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="relative aspect-[4/5] overflow-hidden bg-gray-50"><Image src="/images/rice-keep-bag.jpg" alt="お米保存袋 ライスキープ" fill className="object-cover" sizes="(max-width:1024px) 100vw, 50vw" priority /></div>
        <div>
          <p className="mb-4 text-sm text-yuunagi-ink">お米をおいしく保つ保存袋</p>
          <h1 className="font-serif text-4xl tracking-wider text-primary md:text-6xl">ライスキープ</h1>
          <div className="mt-10 space-y-6 text-base leading-loose text-gray-700">
            <p>保存袋のプロとお米のプロが共同開発した、常温保存が可能な究極のお米の保存袋です。</p>
            <p>これまで冷蔵が必須だったお米保存の常識を覆し、「新米のまま備蓄」を可能にしてくれます。</p>
          </div>
          <p className="mt-10 rounded-sm bg-gray-50 p-5 text-sm leading-loose text-gray-600">商品登録後、こちらから購入できるようになります。</p>
          <Link href="/collections" className="mt-8 inline-flex min-h-12 items-center rounded-full border border-primary px-6 text-sm text-primary hover:bg-primary hover:text-white">商品一覧を見る →</Link>
        </div>
      </div>
    </main>
  );
}
