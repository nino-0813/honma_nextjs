/**
 * セクション見出し。ベースフードの型に合わせている。
 *   Topics          … 大きめの英語（太字ゴシック）
 *   ● トピックス     … ドット + 日本語ラベル
 *   説明文           … 任意
 */
export default function SectionHeading({
  en,
  ja,
  description,
  size = 'lg',
  tone = 'dark',
}: {
  en?: string;
  ja: string;
  description?: string;
  size?: 'lg' | 'sm';
  /** 碧色など濃い面の上に置くときは light */
  tone?: 'dark' | 'light';
}) {
  const enColor = tone === 'light' ? 'text-white' : 'text-yuunagi';
  const jaColor = tone === 'light' ? 'text-white' : 'text-primary';
  const descColor = tone === 'light' ? 'text-white/70' : 'text-gray-500';
  return (
    <div className="flex flex-col gap-1.5">
      {en && size === 'lg' && (
        <p className={`text-[32px] md:text-[46px] lg:text-[54px] font-sans font-bold tracking-tight leading-none ${enColor}`}>
          {en}
        </p>
      )}
      <p className={`flex items-center gap-2.5 text-sm md:text-base font-medium ${jaColor}`}>
        <span className="inline-block w-3 h-3 rounded-full bg-hekishoku shrink-0" aria-hidden="true" />
        {ja}
      </p>
      {description && (
        <p className={`mt-3 text-[13px] md:text-sm leading-relaxed max-w-xs ${descColor}`}>{description}</p>
      )}
    </div>
  );
}
