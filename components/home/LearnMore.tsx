import Link from 'next/link';
import SectionHeading from './SectionHeading';
import CircleButton from './CircleButton';
import PlaceholderBadge from './PlaceholderBadge';
import { LEARN_MORE_CARDS } from './placeholders';
import FadeIn from '@/components/FadeIn';

/**
 * もっと知る。
 * ベースフードと同じく、左に正方形サムネイル・右に本文の2カラムリスト。
 * 罫線で区切る。
 */
export default function LearnMore() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-[1500px] mx-auto px-5 md:px-10">
        <FadeIn>
          <SectionHeading ja="もっと知る" />
        </FadeIn>

        <ul className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-x-12">
          {LEARN_MORE_CARDS.map((c, i) => (
            <li key={c.title} className="border-t border-gray-200">
              <FadeIn delay={Math.min(i, 3) * 70}>
              <Link href={c.href} className="group flex items-start gap-4 md:gap-5 py-5 md:py-6">
                <div className="relative shrink-0 w-[72px] h-[72px] md:w-[88px] md:h-[88px] overflow-hidden bg-dim">
                  {c.isPlaceholder && <PlaceholderBadge />}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.image}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  <h3 className="text-sm md:text-[15px] font-medium text-primary group-hover:text-gray-600 transition-colors">
                    {c.title}
                  </h3>
                  <p className="text-[12px] md:text-[13px] text-gray-600 leading-relaxed">{c.body}</p>
                  <span className="mt-1">
                    <CircleButton icon="external" variant="dark" size="sm" />
                  </span>
                </div>
              </Link>
              </FadeIn>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
