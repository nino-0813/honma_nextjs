import Link from 'next/link';
import { SUBSCRIPTION_GUIDE_ITEMS } from '@/lib/subscription-content';

export default function SubscriptionGuidePage() {
  return (
    <main className="min-h-screen bg-white pb-24 pt-32 md:pb-32 md:pt-40">
      <div className="mx-auto max-w-4xl px-6 md:px-12">
        <header className="mb-16 text-center md:mb-24">
          <h1 className="font-serif text-3xl tracking-[0.1em] text-primary md:text-5xl">
            定期便のご利用について
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-loose text-gray-600 md:text-lg">
            お届けから変更・スキップ、解約、保存方法まで、安心して続けていただくためのご案内です。
          </p>
        </header>

        <div className="border-t border-gray-200">
          {SUBSCRIPTION_GUIDE_ITEMS.map((item) => (
            <section key={item.number} className="grid gap-5 border-b border-gray-200 py-10 md:grid-cols-[7rem_1fr] md:gap-10 md:py-14">
              <p className="font-serif text-lg tracking-[0.2em] text-yuunagi-ink md:text-2xl">
                {item.number}
              </p>
              <div>
                <h2 className="font-serif text-2xl font-semibold tracking-[0.05em] text-primary md:text-3xl">
                  {item.title}
                </h2>
                <p className="mt-6 text-base font-medium leading-[1.9] text-gray-800 md:text-xl">
                  {item.body}
                </p>
                <ul className="mt-6 space-y-2">
                  {item.notes.map((note) => (
                    <li key={note} className="text-sm leading-[1.8] text-gray-600 md:text-base">
                      ※{note}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/collections/rice/yearly?view=lp" className="inline-flex items-center gap-3 border-b border-primary pb-1 text-sm text-primary md:text-base">
            ← 定期便の商品を見る
          </Link>
        </div>
      </div>
    </main>
  );
}
