import type { Metadata } from 'next';
import HeroVideo from '@/components/HeroVideo';
import Collections from '@/components/Collections';
import ParallaxSection from '@/components/ParallaxSection';
import ProductGrid from '@/components/ProductGrid';
import ContactSection from '@/components/ContactSection';
import Testimonials from '@/components/Testimonials';

export const metadata: Metadata = {
  description:
    '自然栽培の考えをベースに、品種が秘めた旨みと香りをまっすぐに届けるため、島の有機資源で土を磨き上げ、農薬に頼らず育てました。新潟県佐渡産の自然栽培米を販売するIKEVEGE（イケベジ）の公式サイト。',
  openGraph: {
    title: 'イケベジ | 佐渡ヶ島のオーガニックファーム',
    description:
      '自然栽培の考えをベースに、品種が秘めた旨みと香りをまっすぐに届けるため、島の有機資源で土を磨き上げ、農薬に頼らず育てました。新潟県佐渡産の自然栽培米を販売するIKEVEGE（イケベジ）の公式サイト。',
    url: '/',
  },
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return (
    <div className="animate-fade-in overflow-x-hidden w-full">
      <HeroVideo />

      <div className="pt-24 md:pt-32 pb-8 md:pb-16 text-left md:text-center px-4 animate-slide-up bg-white">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-2xl md:text-3xl font-serif font-medium tracking-normal mb-6 md:mb-8">
            余計なものは足さない
          </h2>
          <div className="text-sm md:text-base font-medium md:font-normal leading-loose md:leading-relaxed text-gray-600 space-y-4">
            <p>自然栽培の考えをベースに、品種が秘めた旨みと香りをまっすぐに届けるため、</p>
            <p>島の有機資源で土を磨き上げ、農薬に頼らず育てました。</p>
            <p>佐渡ヶ島の森里海とそこで暮らす様々な命が織りなす循環の一粒をご賞味ください。</p>
          </div>
        </div>
      </div>

      <div className="w-full bg-white py-8 md:py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <img
            src="/images/home/collections/rice_supplement_600.webp"
            srcSet="/images/home/collections/rice_supplement_600.webp 600w, /images/home/collections/rice_supplement.webp 2048w"
            sizes="(max-width: 768px) 280px, 512px"
            alt="お米補完画像"
            width={600}
            height={600}
            loading="lazy"
            decoding="async"
            className="w-full max-w-[280px] md:max-w-lg mx-auto h-auto object-contain rounded-lg"
          />
        </div>
      </div>

      <section className="py-6 md:py-10 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-block border-t border-b border-gray-200 pt-4 md:pt-6 pb-3 md:pb-4">
              <p className="text-xs md:text-sm text-gray-500 mb-3 tracking-wider">
                ギネス世界記録 <span className="font-bold text-base md:text-lg text-black">世界最高米®</span> (原料米) 認定
              </p>
              <p className="text-xs md:text-sm text-gray-500 mb-3 tracking-wider">第27回米・食味分析鑑定コンクール国際大会</p>
              <p className="text-sm md:text-base text-gray-600 mb-6">国際総合部門</p>
              <h3 className="text-xl md:text-3xl font-semibold text-gray-900 mb-4 md:mb-6 font-mincho">最高金賞受賞</h3>
            </div>
          </div>
        </div>
      </section>

      <Collections />
      <ParallaxSection />
      <ProductGrid />
      <Testimonials />
      <ContactSection />
    </div>
  );
}
