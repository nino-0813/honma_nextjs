export type Testimonial = {
  id: string;
  name: string;
  role?: string; // 「年間契約のお客様」など（バッジ表示用）
  comment: string;
  rating: number;
  date: string;
  productName: string; // 購入商品名（例: "約5kg"）
  images?: string[]; // 投稿画像
};

// TODO: 後で Supabase のデータに差し替え予定
export const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'フーヒン',
    role: '3回目の注文',
    comment:
      '遅くなりすみません。無事届きました。美味しくいただいています。冷めても美味しいのでお弁当にも最適です。',
    rating: 4.5,
    date: '2024-12-02',
    productName: '約10kg',
    images: ['/images/about/stories/IMG_8832.webp'], // ダミー画像として既存のものを使用
  },
  {
    id: '2',
    name: 'さとし',
    role: '年間契約のお客様',
    comment:
      'いつも美味しいお米をありがとうございます。今回は贈答用にお願いしましたが、先方からも大変喜ばれました。',
    rating: 5.0,
    date: '2024-11-28',
    productName: '約5kg',
  },
  {
    id: '3',
    name: 'みゆき',
    role: '初めての注文',
    comment:
      'ササニシキは体に良いと聞いて初めて注文しました。あっさりしていて食べやすく、胃もたれしない気がします。またリピートします！',
    rating: 5.0,
    date: '2024-11-15',
    productName: '約5kg',
    images: ['/images/about/stories/P3A9707.webp'], // ダミー画像
  },
  {
    id: '4',
    name: 'K.T',
    role: '',
    comment:
      '梱包も丁寧で、生産者さんの愛情を感じます。玄米でいただいていますが、プチプチとした食感がたまりません。',
    rating: 4.8,
    date: '2024-10-30',
    productName: '約2kg',
  },
];
