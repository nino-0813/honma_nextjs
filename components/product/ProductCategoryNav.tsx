import Link from 'next/link';

export type ProductCategoryKey = 'all' | 'rice' | 'subscription' | 'start-set' | 'koshihikari' | 'kamenoo' | 'nikomaru' | 'shiitake' | 'crescent' | 'ticket';

const ITEMS: { key: ProductCategoryKey; label: string; href: string }[] = [
  { key: 'all', label: 'すべての商品', href: '/collections' },
  { key: 'rice', label: 'お米', href: '/collections/rice' },
  { key: 'koshihikari', label: '従来コシヒカリ', href: '/collections/rice/koshihikari' },
  { key: 'kamenoo', label: '亀の尾', href: '/collections/rice/kamenoo' },
  { key: 'nikomaru', label: 'にこまる', href: '/collections/rice/nikomaru' },
  { key: 'shiitake', label: '原木しいたけ', href: '/collections/shiitake' },
  { key: 'crescent', label: 'クレセントムーン', href: '/collections/crescent' },
  { key: 'ticket', label: 'チケット', href: '/collections/ticket' },
];

export default function ProductCategoryNav({ current }: { current: ProductCategoryKey }) {
  return (
    <nav aria-label="商品カテゴリー" className="-mx-6 overflow-x-auto px-6 scrollbar-hide md:-mx-12 md:px-12">
      <div className="flex min-w-max justify-center gap-3 md:gap-4">
        {ITEMS.map((item) => {
          const active = item.key === current;
          return active ? (
            <span key={item.key} aria-current="page" className="rounded-full border border-black bg-black px-5 py-2.5 text-xs tracking-widest text-white">
              {item.label}
            </span>
          ) : (
            <Link key={item.key} href={item.href} className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-xs tracking-widest text-gray-600 transition-colors hover:border-gray-500 hover:text-primary">
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
