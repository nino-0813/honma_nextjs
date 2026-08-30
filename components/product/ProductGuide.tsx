import { getGuide } from './guides';
import { SHOW_PLACEHOLDER_BADGE } from '@/components/home/placeholders';

/**
 * 商品詳細ページの下部に置く「詳しく見る」セクション。
 *
 * 要件定義 §7 の「下スクロールで詳細（戻し方・保管方法など写真付き）」に対応。
 * 内容は商品カテゴリによって出し分ける（お米＝炊き方 / 乾しいたけ＝戻し方）。
 */
export default function ProductGuide({
  product,
}: {
  product: { category?: string; title?: string; description?: string };
}) {
  const guide = getGuide(product);
  const description = (product.description ?? '').trim();

  if (!guide && !description) return null;

  return (
    <section id="product-detail" className="mt-24 md:mt-32 border-t border-gray-100 pt-16 md:pt-20">
      {/* 商品説明の全文 */}
      {description && (
        <div className="max-w-3xl mx-auto mb-16 md:mb-24">
          <h2 className="flex items-center gap-2 text-[13px] font-medium text-primary mb-5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500" aria-hidden="true" />
            この商品について
          </h2>
          <div className="text-[13px] md:text-sm leading-loose text-gray-600 whitespace-pre-wrap">
            {description}
          </div>
        </div>
      )}

      {/* 手順（写真つき） */}
      {guide && (
        <div className="max-w-5xl mx-auto">
          <h2 className="flex items-center gap-2 text-[13px] font-medium text-primary mb-8 md:mb-10">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500" aria-hidden="true" />
            {guide.label}
          </h2>

          <ol className="flex flex-col gap-12 md:gap-16">
            {guide.steps.map((step, i) => (
              <li
                key={step.heading}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-center"
              >
                <div className={`relative aspect-[4/3] overflow-hidden ${i % 2 === 1 ? 'md:order-2' : ''} ${step.image ? 'bg-dim' : 'bg-secondary/30 border border-dashed border-gray-300'}`}>
                  {step.imageIsPlaceholder && SHOW_PLACEHOLDER_BADGE && (
                    <span className="absolute top-2 left-2 z-10 rounded-sm bg-amber-700/90 px-1.5 py-0.5 text-[9px] tracking-wider text-white">
                      仮素材
                    </span>
                  )}
                  {step.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={step.image}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    // 該当する写真が無い工程は、空白にせず何が必要かを出しておく
                    <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-gray-400">
                      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                        <rect x="3" y="5" width="18" height="14" rx="1.5" />
                        <circle cx="8.5" cy="10" r="1.5" />
                        <path d="M21 16l-5-5-6 6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-[11px] tracking-wider">写真待ち</span>
                      <span className="text-[10px]">{step.heading}</span>
                    </span>
                  )}
                </div>

                <div className={i % 2 === 1 ? 'md:order-1' : ''}>
                  <p className="text-[11px] tabular-nums tracking-[0.2em] text-amber-700 mb-2">
                    {String(i + 1).padStart(2, '0')}
                  </p>
                  <h3 className="text-lg md:text-xl font-serif tracking-wider text-primary mb-3">
                    {step.heading}
                  </h3>
                  <p className="text-[13px] md:text-sm leading-loose text-gray-600">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
