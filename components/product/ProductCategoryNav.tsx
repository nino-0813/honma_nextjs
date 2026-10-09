import Link from 'next/link';

export type ProductCategoryKey = 'all' | 'rice' | 'subscription' | 'start-set' | 'koshihikari' | 'kamenoo' | 'nikomaru' | 'shiitake' | 'crescent' | 'ticket';

type CategoryItem = { key: ProductCategoryKey; label: string; href: string };

const MAIN_ITEMS: CategoryItem[] = [
  { key: 'all', label: 'すべての商品', href: '/collections' },
  { key: 'rice', label: 'お米', href: '/collections/rice' },
  { key: 'shiitake', label: '原木しいたけ', href: '/collections/shiitake' },
  { key: 'crescent', label: 'クレセントムーン', href: '/collections/crescent' },
  { key: 'ticket', label: 'チケット', href: '/collections/ticket' },
];

const RICE_ITEMS: CategoryItem[] = [
  { key: 'koshihikari', label: '従来コシヒカリ', href: '/collections/rice/koshihikari' },
  { key: 'kamenoo', label: '亀の尾', href: '/collections/rice/kamenoo' },
  { key: 'nikomaru', label: 'にこまる', href: '/collections/rice/nikomaru' },
];

const RICE_KEYS: ProductCategoryKey[] = ['rice', 'subscription', 'koshihikari', 'kamenoo', 'nikomaru'];

function CategoryItems({ items, activeKey }: { items: CategoryItem[]; activeKey?: ProductCategoryKey }) {
  return (
    <div className="flex min-w-max justify-center gap-2 md:gap-3">
      {items.map((item) => {
        const active = item.key === activeKey;
        const className = `inline-flex min-h-9 items-center justify-center rounded-full border px-4 py-2 text-[11px] tracking-[0.08em] transition-colors md:px-5 ${
          active
            ? 'border-black bg-black text-white'
            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-500 hover:text-primary'
        }`;

        return active ? (
          <span key={item.key} aria-current="page" className={className}>
            {item.label}
          </span>
        ) : (
          <Link key={item.key} href={item.href} className={className}>
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export default function ProductCategoryNav({ current }: { current: ProductCategoryKey }) {
  const isRiceCategory = RICE_KEYS.includes(current);
  const mainActiveKey: ProductCategoryKey = isRiceCategory ? 'rice' : current;
  const riceActiveKey = current === 'rice' || current === 'subscription' ? undefined : current;

  return (
    <nav aria-label="商品カテゴリー" className="-mx-6 md:-mx-12">
      <div className="overflow-x-auto px-6 scrollbar-hide md:px-12">
        <CategoryItems items={MAIN_ITEMS} activeKey={mainActiveKey} />
      </div>
      {isRiceCategory && (
        <div className="mt-4 overflow-x-auto px-6 scrollbar-hide md:px-12">
          <div className="flex min-w-max items-center justify-center gap-5 text-[11px] tracking-[0.08em] text-gray-500">
            <span className="text-[10px] text-gray-400">お米の品種</span>
            <span className="h-3 w-px bg-gray-300" aria-hidden="true" />
            {RICE_ITEMS.map((item) => {
              const active = item.key === riceActiveKey;
              return active ? (
                <span key={item.key} aria-current="page" className="border-b border-primary pb-1 font-semibold text-primary">{item.label}</span>
              ) : (
                <Link key={item.key} href={item.href} className="pb-1 transition-colors hover:text-primary">{item.label}</Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
