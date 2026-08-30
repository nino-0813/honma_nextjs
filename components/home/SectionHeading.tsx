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
}: {
  en?: string;
  ja: string;
  description?: string;
  size?: 'lg' | 'sm';
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {en && size === 'lg' && (
        <p className="text-[28px] md:text-[34px] font-sans font-bold tracking-tight text-primary leading-none">
          {en}
        </p>
      )}
      <p className="flex items-center gap-2 text-[13px] md:text-sm font-medium text-primary">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" aria-hidden="true" />
        {ja}
      </p>
      {description && (
        <p className="mt-2 text-xs md:text-[13px] text-gray-500 leading-relaxed max-w-xs">{description}</p>
      )}
    </div>
  );
}
