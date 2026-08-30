import type { Metadata } from 'next';
import HeroVideo from '@/components/HeroVideo';
import AnnouncementPopup from '@/components/AnnouncementPopup';
import Topics from '@/components/home/Topics';
import Lineup from '@/components/home/Lineup';
import Ranking from '@/components/home/Ranking';
import BrandAbout from '@/components/home/BrandAbout';
import LearnMore from '@/components/home/LearnMore';
import NoteSection from '@/components/home/NoteSection';
import Activities from '@/components/home/Activities';
import SubscriptionCTA from '@/components/home/SubscriptionCTA';
import News from '@/components/home/News';

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

/** トピックス・ニュースはSupabaseから取得するため5分ごとに再生成 */
export const revalidate = 300;

/**
 * トップページ。
 *
 * 構成はベースフードのトップページに準拠:
 *   トップ動画 → トピックス → ラインナップ → 商品 → ブランドについて
 *   → もっと知る → 定期便 → お知らせ
 *
 * 要件定義（2026-08-26）の心理導線
 * 「信頼 → 試す → 知る → 承認される → 一員になる」に対応している。
 */
export default function HomePage() {
  return (
    <div className="animate-fade-in overflow-x-hidden w-full">
      <AnnouncementPopup />

      {/* ページの主題を検索エンジンに伝えるH1（デザイン上は非表示） */}
      <h1 className="sr-only">
        佐渡島の自然栽培米・無農薬玄米｜イケベジ（IKEVEGE）公式オンラインショップ
      </h1>

      {/* 1. トップ動画（テロップ入りの新素材が届いたら差し替え） */}
      <HeroVideo />

      {/* 2. トピックス */}
      <Topics />

      {/* 3. ラインナップ */}
      <Lineup />

      {/* 4. 人気の商品（告知ポップアップの表示トリガーもこのセクション） */}
      <Ranking />

      {/* 5. ブランドについて */}
      <BrandAbout />

      {/* 6. もっと知る */}
      <LearnMore />

      {/* 7. note の記事 */}
      <NoteSection />

      {/* 8. 取り組み */}
      <Activities />

      {/* 9. 定期便 */}
      <SubscriptionCTA />

      {/* 10. お知らせ */}
      <News />

    </div>
  );
}
