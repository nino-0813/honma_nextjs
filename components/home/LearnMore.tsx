import Image from 'next/image';
import Link from 'next/link';
import SectionHeading from './SectionHeading';
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
    <section className="bg-white py-24 md:py-36">
      <div className="mx-auto max-w-[1200px] px-10 md:px-16">
        <FadeIn>
          <SectionHeading ja="もっと知る" />
        </FadeIn>
        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6 lg:gap-10">
          {ENTRIES.map((entry, index) => (
            <FadeIn key={entry.href} delay={index * 100}>
              <Link
                href={entry.href}
                className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hekishoku focus-visible:ring-offset-4"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-dim">
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
                <div className="mt-5 flex items-center justify-between border-b border-gray-200 pb-5">
                  <h3 className="font-serif text-lg tracking-wider text-primary">{entry.title}</h3>
                  <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </Link>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
