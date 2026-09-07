import Image from 'next/image';
import Link from 'next/link';
import FadeIn from '@/components/FadeIn';

export default function HomeJoin() {
  return (
    <section className="bg-white pb-0 pt-20 md:pt-32">
      <FadeIn>
        <div className="mx-auto mb-10 flex max-w-[1180px] flex-col items-center justify-between gap-6 px-6 text-center md:flex-row md:text-left">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-hekishoku">Join us</p>
            <h2 className="mt-3 font-serif text-2xl font-semibold tracking-[0.12em] text-primary md:text-4xl">一緒に、佐渡の風景をつくりませんか。</h2>
          </div>
          <Link href="/join-us" className="inline-flex min-h-12 items-center gap-3 rounded-full border border-primary px-7 py-3 text-xs transition-colors hover:bg-primary hover:text-white">
            取り組みを見る <span aria-hidden="true">→</span>
          </Link>
        </div>
        <Link href="/join-us" className="group relative block h-[280px] overflow-hidden md:h-[430px]">
          <Image src="/images/about/stories/about_story_taue_123.webp" alt="佐渡の田んぼで活動するイケベジの仲間たち" fill sizes="100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
          <span className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </Link>
      </FadeIn>
    </section>
  );
}
