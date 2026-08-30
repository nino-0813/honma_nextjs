/**
 * 商品詳細ページ下部の「詳しく見る」セクションの中身。
 *
 * 要件定義（2026-08-26 §7）の
 * 「下スクロールで詳細（戻し方・保管方法など写真付き）」に対応する。
 *
 * 現状これらの手順はDBに持っていないため、カテゴリごとの共通文としてここに置いている。
 * 商品ごとに変えたくなったら products テーブルに列を足す判断が必要（＝バックエンド変更）。
 *
 * ※ 写真と文面はいずれも仮。実際の手順・撮り下ろし写真に差し替える前提。
 */

export type GuideStep = {
  heading: string;
  body: string;
  image?: string;
  imageIsPlaceholder?: boolean;
};

export type Guide = {
  label: string;
  steps: GuideStep[];
};

/** お米向け */
const RICE_GUIDE: Guide = {
  label: 'おいしく食べるために',
  steps: [
    {
      heading: 'お米の研ぎ方',
      body: 'はじめの水はすぐに捨ててください。乾いたお米は最初の水をいちばん吸います。あとは指を立てて20回ほど、やさしくかき混ぜるだけで十分です。力を入れて研ぐ必要はありません。',
      image: '/images/usage-scene.jpg',
    },
    {
      heading: '水加減と浸水',
      body: '夏は30分、冬は1時間ほど浸してから炊いてください。自然栽培のお米は粒がしっかりしているので、浸水の時間で仕上がりが変わります。玄米の場合は6時間以上を目安に。',
      // 該当する写真が手持ちに無いため、撮り下ろし待ち
      image: undefined,
    },
    {
      heading: '保管方法',
      body: '直射日光を避け、冷蔵庫の野菜室で保管してください。お米は生鮮品です。精米後は2週間ほどで食べきっていただくのがいちばんおいしい状態です。',
      image: '/images/rice-keep-bag.jpg',
    },
  ],
};

/** 乾しいたけ向け */
const SHIITAKE_GUIDE: Guide = {
  label: 'おいしく食べるために',
  steps: [
    {
      heading: '戻し方',
      body: '冷水に浸して、冷蔵庫で一晩かけてゆっくり戻してください。急ぐときはぬるま湯でも戻せますが、低温でじっくり戻したほうが香りが立ちます。',
      image: undefined,
    },
    {
      heading: '戻し汁はだしに',
      body: '戻したあとの水は捨てないでください。旨みが溶け出しているので、そのまま煮物や味噌汁のだしとして使えます。',
      image: undefined,
    },
    {
      heading: '保管方法',
      body: '乾燥した状態のまま、密閉して冷暗所で保管してください。湿気を避ければ長く持ちます。開封後は冷蔵庫での保管がおすすめです。',
      image: undefined,
    },
  ],
};

/** 商品からガイドを選ぶ。該当が無ければ null（セクションごと非表示） */
export function getGuide(product: { category?: string; title?: string }): Guide | null {
  const title = product.title ?? '';
  if (title.includes('しいたけ') || title.includes('椎茸')) return SHIITAKE_GUIDE;
  if (product.category === 'お米') return RICE_GUIDE;
  return null;
}
