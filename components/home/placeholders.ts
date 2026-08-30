/**
 * トップページ刷新（ベースフード構成の再現）で使っている仮データ。
 *
 * 本番素材が届いていない箇所をここにまとめてある。
 * 差し替えるときはこのファイルだけを見れば済むようにしている。
 *
 * 実データが入っている箇所（商品・記事）はこのファイルを使わず、
 * 件数が足りないときだけ不足分を埋める用途で使う。
 */

/** 仮データにバッジを出すか。素材が揃ったら false にする */
export const SHOW_PLACEHOLDER_BADGE = true;

export type TopicCard = {
  title: string;
  label: string;
  image: string;
  href: string;
  date?: string;
  isPlaceholder?: boolean;
};

/** トピックス：記事が足りないときに埋める仮カード */
export const PLACEHOLDER_TOPICS: TopicCard[] = [
  {
    title: '令和8年産の新米、予約受付をはじめました',
    label: 'お知らせ',
    image: '/images/home/parallax/sunset_riceplanting_7_800.webp',
    href: '/collections/rice',
    date: '2026-08-20',
    isPlaceholder: true,
  },
  {
    title: '3品種を食べ比べできるスタートセット',
    label: 'キャンペーン',
    image: '/images/home/collections/collection_koshihikari_800.webp',
    href: '/collections/rice',
    date: '2026-08-01',
    isPlaceholder: true,
  },
  {
    title: '佐渡Kids生きもの調査隊、今年も開催します',
    label: '取り組み',
    image: '/images/joinus/sadokids-fieldwork.jpg',
    href: '/join-us',
    date: '2026-07-30',
    isPlaceholder: true,
  },
  {
    title: '田植えのシーズンがはじまりました',
    label: '田んぼだより',
    image: '/images/about/stories/about_story_taue_123.webp',
    href: '/blog',
    date: '2026-05-18',
    isPlaceholder: true,
  },
];

/** もっと知る：ブランドブック等。PDF・note の URL が決まったら差し替える */
export const LEARN_MORE_CARDS: {
  title: string;
  body: string;
  href: string;
  image: string;
  isPlaceholder?: boolean;
}[] = [
  {
    title: 'ブランドブック',
    body: '佐渡でなぜこの育て方を選んだのか。イケベジの考えと、これから目指すことをまとめています。',
    href: '#',
    image: '/images/about/stories/P3A0011.jpg',
    isPlaceholder: true,
  },
  {
    title: '島の循環のはなし',
    body: '島の有機資源だけで土をつくる。農薬に頼らない米づくりの裏側を紹介します。',
    href: '/about',
    image: '/images/about/stories/about_story_taue_123.webp',
  },
  {
    title: '佐渡Kids生きもの調査隊',
    body: '19年目を迎える環境学習プログラム。子どもたちと一緒に田んぼの生きものを数えています。',
    href: '/join-us',
    image: '/images/joinus/sadokids-fieldwork.jpg',
  },
  {
    title: 'イケてるパートナーズ',
    body: '1年を通して佐渡の田んぼとつながる、企業向けのオーナー制度です。',
    href: '/join-us',
    image: '/images/joinus/crowdfunding-1052.webp',
  },
];

/** ニュース：記事が足りないときに埋める仮の行 */
export const PLACEHOLDER_NEWS = [
  { date: '2026-08-20', title: '令和8年産 新米の予約受付を開始しました', href: '/collections/rice', isPlaceholder: true },
  { date: '2026-07-30', title: '佐渡Kids生きもの調査隊 第19期の参加者を募集します', href: '/join-us', isPlaceholder: true },
  { date: '2026-06-15', title: 'スマート農機導入のクラウドファンディングが目標を達成しました', href: '/join-us', isPlaceholder: true },
];
