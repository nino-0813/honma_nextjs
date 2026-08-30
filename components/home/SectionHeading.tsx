/**
 * トップページ各セクションの見出し。
 * ベースフードと同じく「英語ラベル → 日本語見出し → 補足文」の3段構成。
 */
export default function SectionHeading({
  label,
  title,
  description,
  align = 'left',
}: {
  label: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
}) {
  const alignClass = align === 'center' ? 'items-center text-center' : 'items-start text-left';
  return (
    <div className={`flex flex-col gap-2 ${alignClass}`}>
      <p className="text-[11px] tracking-[0.22em] uppercase text-amber-700 font-medium">{label}</p>
      <h2 className="text-xl md:text-2xl font-serif tracking-[0.1em] text-primary">{title}</h2>
      {description && (
        <p className="text-xs md:text-sm text-gray-500 leading-relaxed max-w-2xl">{description}</p>
      )}
    </div>
  );
}
