import ProductFeatures from './ProductFeatures';

/** 商品固有の説明だけを表示する。食べ方・保管方法はFAQへ集約する。 */
export default function ProductGuide({
  product,
}: {
  product: { description?: string };
}) {
  const description = (product.description ?? '').trim();

  if (!description) return null;

  return (
    <div id="product-detail" className="mt-20 md:mt-28">
      <ProductFeatures rows={[{ label: '商品の説明', body: description }]} />
    </div>
  );
}
