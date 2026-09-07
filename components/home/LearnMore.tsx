import Image from 'next/image';
import Link from 'next/link';
import FadeIn from '@/components/FadeIn';

const ENTRIES = [
  {
    title: 'イケベジとは',
    body: '佐渡で米を育てる理由と、イケベジが大切にしていること。',
    image: '/images/about/hero/about_hero_taue_92.webp',
    href: '/about',
  },
  {
    title: '佐渡での活動',
    body: '田んぼを通じて、子どもや地域、企業とつくる取り組み。',
    image: '/images/joinus/sadokids-fieldwork.jpg',
    href: '/join-us',
  },
  {
    title: '日々の発信',
    body: '農作業や佐渡での暮らしを、日々の言葉と写真でお届けします。',
    image: '/images/home/parallax/sunset_riceplanting_7_800.webp',
    href: '/blog',
  },
];

/** 深く知りたい人のための情報を、迷わない3つの入口に整理する。 */
export default function LearnMore() {
  return (
    <section className="relative overflow-hidden bg-white py-20 text-primary md:py-28">
      <div className="mx-auto max-w-[1240px] px-6 md:px-14">
        <FadeIn>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-hekishoku">Feature</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold tracking-[0.14em] md:text-5xl">もっと知る</h2>
          </div>
        </FadeIn>
        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-7 lg:gap-10">
          {ENTRIES.map((entry, index) => (
            <FadeIn key={entry.href} delay={index * 100}>
              <Link
                href={entry.href}
                className="group block text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hekishoku focus-visible:ring-offset-4"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-[8px] bg-dim">
                  <Image
                    src={entry.image}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover transition duration-500 group-hover:brightness-75"
                  />
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-black/5 to-transparent p-6 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-visible:opacity-100">
                    <p className="text-sm leading-relaxed text-white">{entry.body}</p>
                  </div>
                </div>
                <div className="flex min-h-20 items-center justify-between py-4">
                  <h3 className="font-serif text-lg font-semibold tracking-wider text-primary">{entry.title}</h3>
                  <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 transition group-hover:translate-x-1 group-hover:border-primary">→</span>
                </div>
              </Link>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
