import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProductByHandle } from '@/lib/supabase';
import { jsonLdProduct } from '@/lib/jsonld';
import { getBaseUrl } from '@/lib/site';
import ProductDetailView from './ProductDetailView';

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) return { title: '商品' };
  const title = product.title;
  const description =
    product.description?.replace(/\s+/g, ' ').slice(0, 160) ||
    `新潟県佐渡産の自然栽培米 ${product.title}。イケベジ公式オンラインショップ。`;
  const path = `/products/${product.handle}`;
  const url = `${getBaseUrl()}${path}`;
  const image = product.image?.startsWith('http') ? product.image : `${getBaseUrl()}${product.image || ''}`;
  return {
    title,
    description,
    openGraph: {
      title: `${title} | イケベジ`,
      description,
      url,
      images: image ? [{ url: image, width: 1200, height: 1200, alt: title }] : undefined,
    },
    alternates: { canonical: path },
  };
}

/** ISR: 60秒ごとに再検証 */
export const revalidate = 60;

export default async function ProductPage({ params }: Props) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) notFound();

  const path = `/products/${product.handle}`;
  const jsonLd = jsonLdProduct(product, path);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailView product={product} />
    </>
  );
}
