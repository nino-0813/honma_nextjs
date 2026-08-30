/** 写真タイルやカードの隅に置く円形ボタン（→ ＋ ↗ の見た目だけ。実際の遷移は親のリンクが担う） */
export default function CircleButton({
  icon = 'arrow',
  variant = 'light',
  size = 'md',
}: {
  icon?: 'arrow' | 'plus' | 'external';
  variant?: 'light' | 'dark';
  size?: 'md' | 'sm';
}) {
  const box = size === 'sm' ? 'w-7 h-7' : 'w-9 h-9 md:w-10 md:h-10';
  const tone =
    variant === 'light'
      ? 'border-white/80 text-white group-hover:bg-white group-hover:text-primary'
      : 'border-gray-300 text-gray-500 group-hover:border-primary group-hover:text-primary';

  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center justify-center rounded-full border ${box} ${tone} transition-colors`}
    >
      <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
        {icon === 'arrow' && <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />}
        {icon === 'plus' && <path d="M8 3v10M3 8h10" strokeLinecap="round" />}
        {icon === 'external' && <path d="M5 11L11 5M6 5h5v5" strokeLinecap="round" strokeLinejoin="round" />}
      </svg>
    </span>
  );
}
