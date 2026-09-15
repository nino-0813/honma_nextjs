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
    <div className="flex min-w-max justify-center gap-3 md:gap-4">
      {items.map((item) => {
        const active = item.key === activeKey;
        const className = `inline-flex min-h-11 items-center justify-center rounded-full border px-5 py-2.5 text-xs tracking-widest transition-colors ${
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
        <div className="mt-3 overflow-x-auto px-6 scrollbar-hide md:mt-4 md:px-12">
          <CategoryItems items={RICE_ITEMS} activeKey={riceActiveKey} />
        </div>
      )}
    </nav>
  );
}
