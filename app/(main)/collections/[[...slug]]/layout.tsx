import type { Metadata } from 'next';

type Props = { params: Promise<{ slug?: string[] }> };

/**
 * コレクション各ページの title / description / canonical を出し分ける。
 * これが無いと親レイアウトの canonical（/collections）を全カテゴリが継承し、
 * カテゴリページが検索結果に出なくなる。
 */
const PAGE_META: Record<string, { title: string; description: string }> = {
  '': {
    title: 'ALL ITEM｜商品一覧',
    description:
      '新潟県佐渡島のイケベジが育てた自然栽培米・無農薬玄米、焼き菓子などの商品一覧です。農薬・化学肥料に頼らず、島の有機資源だけで育てたお米をお届けします。',
  },
  rice: {
    title: '自然栽培米・無農薬玄米一覧｜佐渡島産',
    description:
      '佐渡島で農薬・化学肥料を使わずに育てた自然栽培米の一覧。コシヒカリ・亀の尾・にこまるを、白米／玄米、精米度合いを選んでお届けします。',
  },
  'rice/koshihikari': {
    title: '自然栽培コシヒカリ｜佐渡島産・無農薬',
    description:
      '佐渡島の自然栽培コシヒカリ。農薬・化学肥料不使用で、粘りと甘みのバランスに優れた定番品種を、白米・玄米からお選びいただけます。',
  },
  'rice/kamenoo': {
    title: '自然栽培 亀の尾｜佐渡島産・無農薬の希少品種',
    description:
      'コシヒカリの祖先にあたる希少品種「亀の尾」を佐渡島で自然栽培。すっきりとした後味と香りが特徴の、農薬・化学肥料不使用のお米です。',
  },
  'rice/nikomaru': {
    title: '自然栽培 にこまる｜佐渡島産・無農薬',
    description:
      '大粒でつやのある「にこまる」を佐渡島で自然栽培。冷めても美味しく、お弁当やおにぎりにも向く農薬・化学肥料不使用のお米です。',
  },
  'rice/yearly': {
    title: 'お米の定期便・年間契約｜自然栽培米を毎月お届け',
    description:
      '佐渡島の自然栽培米を毎月お届けする定期便・年間契約プラン。通常価格より10%OFF、精米度合いや配送間隔も選べます。無農薬のお米を切らさず続けたい方へ。',
  },
  crescent: {
    title: 'Crescentmoon｜佐渡島の焼き菓子',
    description:
      'イケベジの姉妹ブランド Crescentmoon の焼き菓子一覧。佐渡島の素材を活かした季節限定のクッキーなどをお届けします。',
  },
  other: {
    title: 'その他の商品一覧',
    description: 'イケベジのお米・焼き菓子以外の商品一覧です。',
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const key = (slug ?? []).join('/');
  const meta = PAGE_META[key];
  const path = key ? `/collections/${key}` : '/collections';

  // 定義されていない組み合わせ（想定外URL）は検索結果に出さない
  if (!meta) {
    return {
      title: 'COLLECTIONS',
      robots: { index: false, follow: true },
      alternates: { canonical: path },
    };
  }

  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: `${meta.title} | イケベジ`,
      description: meta.description,
      url: path,
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: meta.title }],
    },
    alternates: { canonical: path },
  };
}

export default function CollectionsSlugLayout({ children }: { children: React.ReactNode }) {
  return children;
}
