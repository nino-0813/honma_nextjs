import Link from 'next/link';
import SectionHeading from './SectionHeading';
import PlaceholderBadge from './PlaceholderBadge';
import { LEARN_MORE_CARDS } from './placeholders';

/**
 * もっと知る（ベースフード構成の5番目）。
 * ブランドブック・記事など、深掘りしたい人向けの入口をまとめる。
 */
export default function LearnMore() {
  return (
    <section className="py-14 md:py-20 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="More"
          title="もっと知る"
          description="佐渡のこと、イケベジのこと。もう少し深く知りたい方へ。"
        />

        <ul className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {LEARN_MORE_CARDS.map((c) => (
            <li key={c.title}>
              <Link
                href={c.href}
                className="relative group flex flex-col gap-2 h-full bg-white rounded-lg p-6 md:p-7 hover:shadow-sm transition-shadow"
              >
                {c.isPlaceholder && <PlaceholderBadge />}
                <h3 className="text-base font-serif tracking-wider text-primary group-hover:text-gray-600 transition-colors">
                  {c.title}
                </h3>
                <p className="text-xs md:text-sm text-gray-600 leading-loose">{c.body}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
