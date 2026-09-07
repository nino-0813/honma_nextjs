import type { Metadata } from 'next';
import HeroVideo from '@/components/HeroVideo';
import Lineup from '@/components/home/Lineup';
import BrandAbout from '@/components/home/BrandAbout';
import LearnMore from '@/components/home/LearnMore';
import SubscriptionCTA from '@/components/home/SubscriptionCTA';
import News from '@/components/home/News';
import HomeFilm from '@/components/home/HomeFilm';
import HomeJoin from '@/components/home/HomeJoin';
import ProductGrid from '@/components/ProductGrid';

export const metadata: Metadata = {
  description:
    '自然栽培の考えをベースに、品種が秘めた旨みと香りをまっすぐに届けるため、島の有機資源で土を磨き上げ、農薬に頼らず育てました。新潟県佐渡産の自然栽培米を販売するIKEVEGE（イケベジ）の公式サイト。',
  openGraph: {
    title: 'イケベジ | 佐渡ヶ島のオーガニックファーム',
    description:
      '自然栽培の考えをベースに、品種が秘めた旨みと香りをまっすぐに届けるため、島の有機資源で土を磨き上げ、農薬に頼らず育てました。新潟県佐渡産の自然栽培米を販売するIKEVEGE（イケベジ）の公式サイト。',
    url: '/',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'イケベジ | 佐渡ヶ島のオーガニックファーム' }],
  },
  alternates: { canonical: '/' },
};

/** お知らせはSupabaseから取得するため5分ごとに再生成 */
export const revalidate = 300;

/**
 * トップページ。
 *
 * 構成はベースフードのトップページに準拠:
 *   トップ動画 → イケベジとは → ラインナップ → 定期便
 *   → もっと知る → お知らせ
 *
 * 要件定義（2026-08-26）の心理導線
 * 「信頼 → 試す → 知る → 承認される → 一員になる」に対応している。
 */
export default function HomePage() {
  return (
    <div className="animate-fade-in overflow-x-hidden w-full">
      {/* ページの主題を検索エンジンに伝えるH1（デザイン上は非表示） */}
      <h1 className="sr-only">
        佐渡島の自然栽培米・無農薬玄米｜イケベジ（IKEVEGE）公式オンラインショップ
      </h1>

      {/* 1. トップ動画（テロップ入りの新素材が届いたら差し替え） */}
      <HeroVideo />

      {/* 2. イケベジのメッセージ */}
      <BrandAbout />

      {/* 3. 3つの小特集 */}
      <LearnMore />

      {/* 4. 横長ムービー */}
      <HomeFilm />

      {/* 5. 商品モザイク */}
      <Lineup />

      {/* 6. 2列のお知らせ */}
      <News />

      {/* 7. 実商品一覧 */}
      <ProductGrid />

      {/* 8. 定期便 */}
      <SubscriptionCTA />

      {/* 9. 仲間・活動への入口 */}
      <HomeJoin />

    </div>
  );
}
