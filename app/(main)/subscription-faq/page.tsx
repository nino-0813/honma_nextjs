import Link from 'next/link';
import { SUBSCRIPTION_FAQ_ITEMS } from '@/lib/subscription-content';

export default function SubscriptionFaqPage() {
  return (
    <main className="min-h-screen bg-white pb-24 pt-32 md:pb-32 md:pt-40">
      <div className="mx-auto max-w-4xl px-6 md:px-12">
        <header className="mb-16 text-center md:mb-24">
          <h1 className="font-serif text-3xl tracking-[0.1em] text-primary md:text-5xl">
            よくある質問
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-loose text-gray-600 md:text-lg">
            イケベジ定期便について、よくいただくご質問をまとめました。
          </p>
        </header>

        <div className="border-t border-gray-200">
          {SUBSCRIPTION_FAQ_ITEMS.map((item) => (
            <details key={item.q} className="group border-b border-gray-200">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-7 md:py-9">
                <span className="flex gap-3 text-base font-medium leading-relaxed text-primary md:text-xl">
                  <span className="font-serif text-yuunagi-ink">Q.</span>
                  <span>{item.q}</span>
                </span>
                <span className="mt-1 text-xl text-gray-400 transition-transform group-open:rotate-45">＋</span>
              </summary>
              <div className="flex gap-3 pb-8 text-sm leading-[1.9] text-gray-700 md:pb-10 md:text-lg">
                <span className="font-serif font-medium text-yuunagi-ink">A.</span>
                <p className="whitespace-pre-line">{item.a}</p>
              </div>
            </details>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/contact" className="inline-flex items-center gap-3 border-b border-primary pb-1 text-sm text-primary md:text-base">
            解決しない場合はお問い合わせください →
          </Link>
        </div>
      </div>
    </main>
  );
}
