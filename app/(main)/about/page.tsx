'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';

type FadeInSectionProps = {
  children: React.ReactNode;
  className?: string;
};

const FadeInSection = ({ children, className = '' }: FadeInSectionProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add('opacity-100', 'translate-y-0');
          element.classList.remove('opacity-0', 'translate-y-8');
          observer.unobserve(element);
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -60px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`translate-y-8 opacity-0 transition-all duration-1000 ease-out ${className}`}>
      {children}
    </div>
  );
};

const goodTimes = [
  { src: '/images/renewal/lineup/rice.webp', alt: '炊きたてのごはん', label: '食卓のいいとき' },
  { src: '/images/about/stories/about_story_taue_123.webp', alt: '田植えをする人たち', label: '田んぼのいいとき' },
  { src: '/images/about/stories/P3A9707.webp', alt: '佐渡の田んぼと山並み', label: '島のいいとき' },
];

const timeline = [
  ['1970', '本州最後のトキ「能里」を石川県で捕獲し、佐渡へ移送'],
  ['1981', '佐渡に残っていた野生下最後の5羽をすべて捕獲'],
  ['1999', '中国から贈られたペア「友友・洋洋」による人工繁殖に初めて成功'],
  ['2003', '日本産最後のトキ「キン」が36歳で死亡'],
  ['2008', '佐渡で第1回の放鳥。野生復帰の取り組みが本格的に始まる'],
  ['2011', '「トキと共生する佐渡の里山」が、先進国で初めて世界農業遺産に認定'],
];

const editorialArticles = [
  {
    kicker: '佐渡について ｜ 02',
    title: '山の水と、三十六人の手',
    lead: 'イケベジが田んぼをつくる豊田集落は、山と海にはさまれた小さな農村です。田んぼの多くは江戸時代に拓かれ、それからずっと、山の水を引く水路を集落のみんなで守ってきました。',
    image: '/images/about/stories/P3A9707.webp',
    imageAlt: '海と山を望む豊田集落の田んぼ',
    sections: [
      ['山から海まで、ひとつの集落', '豊田集落は、佐渡ヶ島の小佐渡の山あいにあります。海と里と山が、およそ2キロの範囲に収まり、山で生まれた水が田んぼを通って海へ出ていくまでを、ひとつの集落の中で見渡せる場所です。水の流れ、生きものの移動、季節ごとの人の仕事が、ひと続きの風景として残っています。'],
      ['江戸時代から続く、細かな田んぼ', '集落の田んぼの約9割は江戸時代に拓かれたとされます。平らな土地だけでなく、斜面の地形に沿って小さな田んぼが重なり、およそ3分の1は急なあぜに囲まれています。機械で一気に整えることが難しい形だからこそ、人の手で守られてきた土地の記憶が、そのまま今の風景になっています。'],
      ['山の水を、みんなで引く', '田んぼを潤すのは、山の中を通る長い用水路です。春には泥をさらい、落ち葉を取り除き、大雨のあとは崩れた場所がないかを見て回る。水は自然に届くのではなく、毎年繰り返される手入れによって初めて田んぼへ届きます。イケベジの米づくりも、この共同作業の上に成り立っています。'],
      ['田んぼの隣の、能舞台', '集落の諏訪神社には能舞台があります。古い記録には1863年の奉納能が残り、現在の舞台につながる営みも長く受け継がれてきました。田んぼを守ってきた人たちは、能や鬼太鼓といった集落の文化も同じように守ってきました。農業は食べものをつくる仕事であると同時に、土地の時間を引き受ける仕事でもあります。'],
      ['三十六人の現在地', '豊田集落には約48ヘクタール、約300枚の田んぼがあり、それを支える農家は36人です。その多くが長く田んぼを守ってきた世代で、担い手の減少はすぐ先の課題です。必要なのは、ひとりの農家が抱える面積を増やすことだけではなく、水路や草刈りを一緒に担う人を増やすことだと考えています。'],
      ['大きくしない、という選択', 'イケベジは田んぼを集めて大きくするのではなく、兼業で関わる人、体験から通い始める人、お米を食べて支える人を増やすことで、この集落の風景を次へ渡したいと考えています。食べる人も、水路を守る人も、次の農家になり得る。豊田の小さな田んぼを残すことは、多様な関わり方を残すことでもあります。'],
    ],
    stats: [['約48ha', '豊田集落の田んぼ'], ['約300枚', '大小さまざまな田んぼ'], ['36人', '田んぼを守る農家']],
  },
  {
    kicker: 'イケベジについて',
    title: '駒沢の八百屋から、ふるさとの田んぼへ',
    lead: 'イケベジは、株式会社nacoの農業の仕事です。自然と社会のあいだに立つ「通訳」でありたい。その思いを胸に、佐渡の兼業農家に生まれた一人が、東京の八百屋を経て、ふるさとの田んぼへ戻りました。',
    image: '/images/about/stories/P3A0011.jpg',
    imageAlt: '田んぼに立つイケベジの作り手',
    sections: [
      ['島を出て、見えたもの', '18歳まで佐渡の野山を走り回って育ちました。大学で島を出て東京で暮らし、初めて自分が育った場所を考えるようになります。自然の在り方や豊かさを、社会に伝わる言葉に訳す会社をつくりたい。nacoは、その思いから始まりました。'],
      ['説明いらずの「安心」', '駒沢の八百屋で佐渡のお米を並べると、お客さまから「佐渡のお米って、安心安全だよね」と言われました。その安心は、トキのために田んぼを変えてきた島の人たちが、長い時間をかけて積み上げてきたものです。'],
      ['専業の理由は、田んぼの景色', '兼業農家の息子だった代表が専業農家になった理由は、豊田の田んぼの景色を子どもたちの代に残したいと思ったから。収量よりも、その年の田んぼが育てた味を大切にしています。'],
      ['作り手が楽しむ', '資源や環境と同じように、人もまた持続可能であること。作り手が自分らしく楽しめているかどうかは、その何よりの指標だと考えています。'],
    ],
    stats: [['1992', '佐渡・豊田集落に生まれる'], ['2021', '佐渡で米づくりを始める'], ['2025', '原木しいたけの栽培を始める']],
  },
  {
    kicker: '生産について',
    title: 'おいしさの、その手前',
    lead: 'おいしいことは大前提。そのうえで、そこへ至る道のりまで胸を張れるものでありたい。農薬や除草剤、化学肥料に頼らず、土づくりはできる限り島の資源で行います。',
    image: '/images/renewal/about/delicious.webp',
    imageAlt: '実りを迎えた稲穂',
    sections: [
      ['三つの品種と栽培方法', '従来コシヒカリは自然栽培、亀の尾は竹チップの堆肥、にこまるは酒粕と牡蠣殻を土へ返して育てています。それぞれの品種と田んぼに合う方法を選びます。'],
      ['その年の味を、そのままに', '肥料を入れない田んぼでは、天気や水の具合がそのまま味に出ます。今年の田んぼがつくった今年の味。その違いも含めて楽しんでもらいたいと考えています。'],
      ['精米は、注文のあとで', '収穫したお米は一年中5℃以下で保管し、1.9ミリ以上の大きな粒だけを選びます。注文を受けてから精米し、できたてのお米を届けます。'],
      ['島の資源をめぐらせる', '酒蔵から出る酒粕、加茂湖の牡蠣殻、手入れされなくなった竹林の竹、役目を終えたしいたけの原木。島の中で捨てられてきたものを、田んぼの土へ戻します。'],
    ],
    stats: [['コシヒカリ', '自然栽培'], ['亀の尾', '竹堆肥'], ['にこまる', '牡蠣殻・酒粕']],
  },
  {
    kicker: '体験について',
    title: '断らない田んぼ',
    lead: '農業や自然が、特別なものではなく、すぐそばにあるものであってほしい。「何かあったら、まずイケベジに相談してみよう」。そう思ってもらえる田んぼであり続けます。',
    image: '/images/about/hero/about_hero_taue_92.webp',
    imageAlt: '田植えを体験する人たち',
    sections: [
      ['依頼はまず断らない', '田植えや稲刈りは、農家にとって忙しい時期です。同時に、体験する人にとっては忘れられない時間でもあります。だからイケベジでは、繁忙期でも依頼に応えられる体制を整えてきました。'],
      ['入口は、相手の目線で', '保育園の食育、中学生の職場体験、島外企業の研修、親子リトリートまで。相手の目的に合わせ、佐渡の山と海のつながりを体験できる入口を用意しています。'],
      ['田んぼへの入り口', '受け入れる相手は、島の子どもから旅行者、企業までさまざまです。その人の目線で「楽しい」「面白い」と思える体験をつくります。'],
      ['学びが続いていく場所', '一度の体験で終わらず、また田んぼへ来たくなる関係を育てること。それがイケベジの体験づくりです。'],
    ],
    stats: [['約700人', '1年間に田んぼを訪れる人'], ['40人', '佐渡Kids生きもの調査隊'], ['10種類以上', '体験の入り口']],
  },
  {
    kicker: '取り組みについて',
    title: '食べる人が、農家を生む',
    lead: '子どもたちが「ここに生まれてよかった」と思える島を、次の世代へ。そのためにイケベジが続けている、三つの取り組みです。',
    image: '/images/renewal/brand/access-1.webp',
    imageAlt: '稲刈りに参加する人たち',
    sections: [
      ['佐渡Kids生きもの調査隊', '2008年から続く、島の小学生による田んぼの生きもの調査です。調査隊の卒業生は、いまコーチとして次の子どもたちを田んぼへ連れています。'],
      ['受け取ったバトンを、両隣へ', 'クラウドファンディングでは149人から支援をいただきました。支えてもらった人が、次は隣の誰かへ渡していく。そういう循環を育てます。'],
      ['集めるより、関わる人を', '田んぼを集めて大きくするのではなく、兼業で田んぼに関わる人を増やす。その入口として、お米を届ける定期便や田んぼの体験を続けています。'],
      ['次の世代へつなぐ', 'トキのために変わってきた田んぼに、島の資源をめぐらせる工夫を重ねていく。まずは豊田の田んぼから、毎日のごはんを届け続けます。'],
    ],
    stats: [['40人', '生きもの調査隊の小学生'], ['149人', '支援してくれた人'], ['4,700人', '目指す定期便利用者']],
  },
];

export default function AboutPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="page-top-offset w-full overflow-x-hidden bg-white text-[#1c1d1d]">
      <header className="px-6 pb-14 pt-16 text-center md:pb-20 md:pt-24">
        <p className="text-[11px] tracking-[0.24em] text-gray-500">自然の“イケてる”を、暮らしのそばへ。</p>
        <h1 className="mt-5 font-serif text-[26px] font-medium leading-[1.8] tracking-[0.13em] md:text-[38px]">農を通じて、<br className="md:hidden" />人と自然のいい関係をつくる。</h1>
        <p className="mx-auto mt-6 max-w-[620px] text-[12px] leading-[2.1] tracking-[0.08em] text-gray-600 md:text-sm">イケベジは佐渡の田んぼから、おいしい作物と、自然に触れる体験を届けるチームです。</p>
      </header>

      <section className="mx-auto w-full max-w-[1120px] px-4 md:px-6">
        <div className="aspect-[16/10] overflow-hidden md:aspect-video">
          <img src="/images/about/hero/about_hero_taue_92.webp" alt="田んぼのそばで過ごす子どもたち" className="h-full w-full object-cover object-center" />
        </div>
      </section>

      <section className="px-6 py-20 text-center md:py-28">
        <FadeInSection className="mx-auto max-w-[680px]">
          <h2 className="text-[25px] font-medium leading-[1.9] tracking-[0.14em] md:text-[34px]">
            子どもたちが<br />「ここに生まれてよかった」と<br />思える社会を。
          </h2>
          <div className="mt-10 space-y-5 text-[13px] font-light leading-[2.15] tracking-[0.08em] text-gray-600 md:mt-12 md:text-sm">
            <p>自然界では、多様な命が、無理なく、<br />あるがままに響き合い、めぐり続けている。<br />その在り方を、私たちは“イケてる”と呼んでいます。</p>
            <p>お米を育てて届けること。<br />田んぼをひらき、体験や学びの場をつくること。</p>
            <p>イケベジは、農を起点に、<br />自然の在り方を社会へと伝える<br />「通訳」で在り続けます。</p>
          </div>
        </FadeInSection>
      </section>

      <section className="bg-[#f7f6f0] px-4 py-24 md:px-6 md:py-28">
        <FadeInSection className="mx-auto max-w-[1120px]">
          <h2 className="text-center text-[24px] font-medium tracking-[0.2em] md:text-[32px]">きょうも しぜんと いいときを。</h2>
          <div className="mx-auto mt-12 max-w-[720px] space-y-7 text-center text-[13px] font-light leading-[2.3] tracking-[0.09em] text-gray-600 md:text-sm">
            <p>「しぜんと」には、自然と向き合うことと、気負わず自然体でいること。<br />ふたつの意味を込めています。</p>
            <p>炊きたてのごはんを囲む食卓も、泥だらけになって笑う田植えも、田んぼで汗を流す作り手の時間も。自然がそばにあると、何気ない一日が少しだけ豊かになる。</p>
            <p className="font-medium text-[#1c1d1d]">そんな時間を増やすことが、イケベジの届けたい「いいとき」です。</p>
          </div>

          <div className="mt-14 grid grid-cols-2 gap-3 md:mt-16 md:grid-cols-3">
            {goodTimes.map((item, index) => (
              <figure key={item.label} className={index === 2 ? 'col-span-2 md:col-span-1' : ''}>
                <div className={`${index === 2 ? 'aspect-video md:aspect-[4/5]' : 'aspect-[4/5]'} overflow-hidden bg-[#e2e3db]`}>
                  <img src={item.src} alt={item.alt} className="h-full w-full object-cover" />
                </div>
                <figcaption className="mt-3 text-center text-[11px] tracking-[0.14em] text-gray-500">{item.label}</figcaption>
              </figure>
            ))}
          </div>

          <div className="mx-auto mt-14 max-w-[680px] space-y-7 text-center text-[13px] font-light leading-[2.3] tracking-[0.09em] text-gray-600 md:mt-16 md:text-sm">
            <p>ひと粒のお米の向こうには、<br />山から流れてくる水や、田んぼに集う生きもの、<br />トキが舞う空と、長い年月をかけて受け継がれてきた田んぼがあります。</p>
            <p>人の「いいとき」は、自然が重ねてきた長い時間とつながっている。<br />無理なく、ありのままに。<br />きょうも、しぜんと。</p>
          </div>
        </FadeInSection>
      </section>

      <section className="px-6 py-24 md:py-28">
        <div className="mx-auto max-w-[1120px]">
          <FadeInSection className="mb-4 text-center md:mb-8">
            <h2 className="text-[25px] font-medium tracking-[0.16em] md:text-[34px]">3つの姿勢</h2>
          </FadeInSection>

          <FadeInSection className="grid items-center gap-8 py-12 md:grid-cols-2 md:gap-16 md:py-16">
            <div className="aspect-[4/3] overflow-hidden"><img src="/images/renewal/brand/access-1.webp" alt="稲刈りを体験する人たち" className="h-full w-full object-cover" /></div>
            <div>
              <h3 className="text-[21px] font-medium leading-relaxed tracking-[0.13em] md:text-[26px]">農へのアクセスを良好にする</h3>
              <div className="mt-7 space-y-5 text-[13px] font-light leading-[2.1] tracking-[0.06em] text-gray-600 md:text-sm">
                <p>農業や自然が、特別なものではなく、すぐそばにあるものであってほしい。兼業農家の家に生まれ、手伝いのなかで自然と田んぼに触れてきた原体験が、その思いの出発点です。</p>
                <p>近年、農家の減少により、島の子どもたちですら、自然が「身近にはあるものの、生活とは切り離された存在」となりつつあります。</p>
                <p>そこで、稲刈りや田植えなど体験価値の高い繁忙期にも依頼に応える体制を整え、保育園の食育から中学生の職場体験、企業の研修まで受け入れてきました。</p>
                <p>「何かあったら、まずイケベジに相談してみよう」。そう思ってもらえる体験と学びの窓口で在り続けることが、農家だからこそできる社会への貢献だと考えています。</p>
              </div>
            </div>
          </FadeInSection>

          <FadeInSection className="grid items-center gap-8 py-12 md:grid-cols-2 md:gap-16 md:py-16">
            <div className="md:order-2"><div className="aspect-[4/3] overflow-hidden"><img src="/images/about/stories/IMG_8832.webp" alt="苗を見守る作り手" className="h-full w-full object-cover" /></div></div>
            <div className="md:order-1">
              <h3 className="text-[21px] font-medium leading-relaxed tracking-[0.13em] md:text-[26px]">道のりまで、おいしく</h3>
              <div className="mt-7 space-y-5 text-[13px] font-light leading-[2.1] tracking-[0.06em] text-gray-600 md:text-sm">
                <p>おいしいことは、大前提。そのうえで、そこへ至る道のりまで、胸を張れるものでありたいと考えています。</p>
                <p>農薬や除草剤、化学肥料に頼らず、土づくりはできる限り島の資源で。酒蔵から出る酒粕、牡蠣の養殖で出る殻、手入れされなくなった竹林の竹。これまで捨てられてきたものが、田んぼの土へと還っていきます。</p>
                <p>正解のない取り組みだからこそ、毎年が実験です。うまくいかない年も含めて、挑戦を重ねてきた道のりが、次のおいしさをつくっています。</p>
              </div>
            </div>
          </FadeInSection>

          <FadeInSection className="grid items-center gap-8 py-12 md:grid-cols-2 md:gap-16 md:py-16">
            <div className="aspect-[4/3] overflow-hidden"><img src="/images/about/stories/P3A0011.jpg" alt="田んぼで笑うイケベジの作り手" className="h-full w-full object-cover object-center" /></div>
            <div>
              <h3 className="text-[21px] font-medium leading-relaxed tracking-[0.13em] md:text-[26px]">作り手が楽しむ</h3>
              <div className="mt-7 space-y-5 text-[13px] font-light leading-[2.1] tracking-[0.06em] text-gray-600 md:text-sm">
                <p>イケベジの田んぼでは、いつもスタッフのルカの大きな歌声が響いています。</p>
                <p>作物は、作り手の状態を鏡のように映し出すもの。だからこそ、田んぼではまず「自分らしく楽しむこと」を第一に心がけています。</p>
                <p>資源や環境と同じように、人もまた持続可能であること。作り手が楽しめているかどうかは、その何よりの指標だと考えています。</p>
                <p>「農家になりたい」ではなく、「イケベジのようにありたい」。そう思う大人や子どもが、一人でも増えていくことを願っています。</p>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      <section className="px-6 pb-24 pt-6 text-center md:pb-28">
        <FadeInSection>
          <p className="text-[19px] leading-relaxed tracking-[0.07em] md:text-[26px]">毎日のごはんに、佐渡の田んぼをひとつ。</p>
          <Link href="/collections" className="mt-7 inline-block border-b border-[#1c1d1d] pb-1 text-[13px] tracking-[0.1em] transition-opacity hover:opacity-60">商品一覧を見る　→</Link>
        </FadeInSection>
      </section>

      <section className="border-t border-[#d8d8d2] bg-[#f1f1ed] px-6 py-24 md:py-28">
        <div className="mx-auto max-w-[1120px]">
          <FadeInSection className="text-center">
            <h2 className="text-[24px] font-medium tracking-[0.2em] md:text-[30px]">イケベジを詳しく知る</h2>
            <p className="mt-5 text-[13px] font-light leading-[2.1] tracking-[0.08em] text-gray-600">新潟県・佐渡ヶ島の田んぼから。<br />イケベジが日々向き合っていることを、ここから詳しくお伝えします。</p>
          </FadeInSection>

          <nav aria-label="章の一覧" className="mt-12 flex flex-wrap justify-center gap-x-7 gap-y-2 border-y border-[#d9d9d2] py-4 text-[11px] tracking-[0.12em] text-gray-500 md:text-xs">
            <a href="#sado" className="transition-colors hover:text-[#1c1d1d]">佐渡について</a><a href="#ikevege" className="transition-colors hover:text-[#1c1d1d]">イケベジについて</a><a href="#production" className="transition-colors hover:text-[#1c1d1d]">生産について</a><a href="#experience" className="transition-colors hover:text-[#1c1d1d]">体験について</a><a href="#initiatives" className="transition-colors hover:text-[#1c1d1d]">取り組みについて</a>
          </nav>

          <FadeInSection className="mt-14">
            <article id="sado" className="scroll-mt-32 border-t border-[#1c1d1d] pt-5">
              <span className="text-[10px] tracking-[0.24em] text-gray-500">佐渡について ｜ 01</span>
              <h3 className="mt-3 text-[22px] font-semibold leading-[1.65] tracking-[0.1em] md:text-[28px]">トキと暮らす島で、お米をつくるということ</h3>
              <p className="mt-3 border-b border-[#e5e5e0] pb-6 text-[13px] font-light leading-[2] tracking-[0.06em] text-gray-600 md:text-sm">一度は日本の空から姿を消したトキ。その最後の一羽がいたのが、佐渡ヶ島でした。いま佐渡の田んぼのお米は、トキの暮らしと切り離せないものになっています。</p>

              <div className="mt-7 columns-1 gap-12 lg:columns-2">
                <h4 className="mb-3 break-after-avoid text-sm font-semibold tracking-[0.1em]">田んぼでしか、エサをとれない鳥</h4>
                <p className="mb-5 text-[13px] font-light leading-[2.05] tracking-[0.05em]">トキは、川や海ではなく、田んぼや湿地でドジョウやカエルなどの小さな生きものを食べて暮らす鳥です。いま湿地と呼べる場所の多くは田んぼであり、トキは人の営みと共に生きなければ、暮らしていくことができません。</p>
                <p className="mb-5 text-[13px] font-light leading-[2.05] tracking-[0.05em]">明治時代からの乱獲に加え、農薬や化学肥料が広く使われるようになったことで、エサとなる生きものが田んぼから減り、トキは数を減らしていきました。</p>

                <figure className="mb-5 break-inside-avoid">
                  <div className="aspect-[3/2] overflow-hidden"><img src="/images/about/stories/P3A9707.webp" alt="佐渡の田んぼと山並み" className="h-full w-full object-cover" /></div>
                  <figcaption className="mt-2 text-[10px] leading-relaxed tracking-[0.08em] text-gray-500">人と自然の営みが重なる、佐渡の田んぼ</figcaption>
                </figure>

                <dl className="mb-6 break-inside-avoid border-t border-[#1c1d1d]">
                  {timeline.map(([year, text]) => (
                    <div key={year} className="grid grid-cols-[3.7rem_1fr] gap-3 border-b border-[#e5e5e0] py-2 text-[11px] font-light leading-[1.8] md:text-xs"><dt className="font-semibold tracking-[0.04em]">{year}</dt><dd>{text}</dd></div>
                  ))}
                </dl>

                <h4 className="mb-3 break-after-avoid text-sm font-semibold tracking-[0.1em]">朱鷺と暮らす郷づくり認証制度</h4>
                <p className="mb-5 text-[13px] font-light leading-[2.05] tracking-[0.05em]">トキを野生に定着させるには、まず田んぼに生きものが戻らなければなりません。そこで2008年に始まったのが「朱鷺と暮らす郷づくり認証制度」。イケベジでは通称「トキ認証」と呼んでいます。</p>

                <div className="mb-5 break-inside-avoid border border-[#deded8] bg-white px-5 py-4">
                  <strong className="block text-xs tracking-[0.14em]">トキ認証の主な要件</strong>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-[11px] font-light leading-[1.9] md:text-xs"><li>生きものを育む農法を行うこと</li><li>農薬・化学肥料を5割以上減らすこと（ネオニコチノイド系農薬は使用不可）</li><li>あぜに除草剤を使わず、草刈りで管理すること</li><li>年2回、田んぼの生きもの調査を行うこと</li></ul>
                </div>

                <p className="mb-5 text-[13px] font-light leading-[2.05] tracking-[0.05em]">「生きものを育む農法」とは、たとえば田んぼの水を抜いたあとも水生生物が逃げ込める「江」を設けることや、冬のあいだも田んぼに水を張る「冬みず田んぼ」など。稲の育ちには直接関わらなくても、生きものを育むことを同時に叶える工夫です。</p>
                <p className="mb-5 text-[13px] font-light leading-[2.05] tracking-[0.05em]">さらに認証米として販売するには、農産物検査で1等であること、味を大きく左右するタンパク質含有量が6.2％以下であることが求められます。安心と、おいしさ。その両方を満たしたお米だけが、トキ認証米として食卓に届きます。</p>
                <p className="mb-5 text-[13px] font-light leading-[2.05] tracking-[0.05em]">制度が始まって10年目に行われたアンケートでは、「これからも認証米の栽培を続けない」と答えた農家はゼロでした。新たに関心がある取り組みとして最も多く挙がったのは、農薬も肥料も使わない「自然栽培による米づくり」です。</p>
                <p className="mt-3 text-[10px] font-light leading-[1.8] tracking-[0.05em] text-gray-500">出典：佐渡市農業政策課／「朱鷺と暮らす郷づくり認証制度の評価レポート」新潟大学 豊田光世</p>
              </div>
            </article>
          </FadeInSection>

          <div className="mt-20 space-y-20 md:mt-24 md:space-y-28">
            {editorialArticles.map((article, index) => (
              <FadeInSection key={article.title}>
                <article id={index === 1 ? 'ikevege' : index === 2 ? 'production' : index === 3 ? 'experience' : index === 4 ? 'initiatives' : undefined} className="scroll-mt-32 border-t border-[#1c1d1d] pt-5">
                  <span className="text-[10px] tracking-[0.24em] text-gray-500">{article.kicker}</span>
                  <h3 className="mt-3 text-[22px] font-semibold leading-[1.65] tracking-[0.1em] md:text-[28px]">{article.title}</h3>
                  <p className="mt-3 border-b border-[#e5e5e0] pb-6 text-[13px] font-light leading-[2] tracking-[0.06em] text-gray-600 md:text-sm">{article.lead}</p>

                  {index === 0 && (
                    <div className="mt-8">
                      <div className="grid border-y border-[#b9b9b1] sm:grid-cols-5">
                        {['山と森', '山の用水路', '斜面の田んぼ', '豊田集落', '海'].map((label, stage) => (
                          <div key={label} className="relative border-b border-[#d8d8d1] px-3 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
                            <span className="text-[9px] tracking-[0.18em] text-gray-400">0{stage + 1}</span>
                            <p className="mt-1 text-xs font-medium tracking-[0.12em]">{label}</p>
                          </div>
                        ))}
                      </div>
                      <p className="mt-3 text-right text-[10px] tracking-[0.08em] text-gray-500">山で生まれた水が、田んぼと暮らしを通って海へ向かう</p>

                      <div className="mt-9 grid gap-x-12 gap-y-8 md:grid-cols-12">
                        <div className="md:col-span-7">
                          {article.sections.slice(0, 3).map(([heading, body], sectionIndex) => (
                            <section key={heading} className={`pb-7 ${sectionIndex > 0 ? 'border-t border-[#deded8] pt-7' : ''}`}>
                              <h4 className="text-sm font-semibold tracking-[0.1em]">{heading}</h4>
                              <p className="mt-3 text-[13px] font-light leading-[2.15] tracking-[0.05em]">{body}</p>
                            </section>
                          ))}
                          <figure className="mt-1">
                            <div className="aspect-[16/10] overflow-hidden"><img src={article.image} alt={article.imageAlt} loading="lazy" className="h-full w-full object-cover" /></div>
                            <figcaption className="mt-2 text-[10px] tracking-[0.08em] text-gray-500">山、田んぼ、集落、海が近い距離でつながる豊田の風景</figcaption>
                          </figure>
                        </div>
                        <div className="md:col-span-5 md:pt-16">
                          <blockquote className="border-l border-[#1c1d1d] pl-5 font-serif text-[19px] leading-[1.9] tracking-[0.08em]">田んぼの広さではなく、<br />関わる人の数で<br />風景を守っていく。</blockquote>
                          <div className="mt-10">
                            {article.sections.slice(3).map(([heading, body]) => (
                              <section key={heading} className="border-t border-[#deded8] py-6 first:border-[#1c1d1d]">
                                <h4 className="text-sm font-semibold tracking-[0.1em]">{heading}</h4>
                                <p className="mt-3 text-[13px] font-light leading-[2.15] tracking-[0.05em]">{body}</p>
                              </section>
                            ))}
                          </div>
                        </div>
                      </div>
                      <dl className="mt-10 grid border-y border-[#1c1d1d] sm:grid-cols-3">
                        {article.stats.map(([value, label]) => (
                          <div key={value} className="border-b border-[#deded8] px-5 py-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
                            <dt className="font-serif text-[26px] tracking-[0.04em]">{value}</dt><dd className="mt-1 text-[10px] tracking-[0.08em] text-gray-500">{label}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}

                  {index === 1 && (
                    <div className="mt-9 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
                      <div>
                        <figure className="relative">
                          <div className="aspect-[4/5] overflow-hidden"><img src={article.image} alt={article.imageAlt} loading="lazy" className="h-full w-full object-cover" /></div>
                          <blockquote className="-mt-16 ml-5 mr-5 bg-[#f1f1ed] px-6 py-7 font-serif text-[19px] leading-[1.8] tracking-[0.08em] md:ml-10 md:mr-0">自然と社会のあいだに立つ、<br />「通訳」でありたい。</blockquote>
                        </figure>
                        <div className="mt-10 grid gap-7 sm:grid-cols-2">
                          {article.sections.slice(0, 2).map(([heading, body]) => <section key={heading}><h4 className="text-sm font-semibold tracking-[0.1em]">{heading}</h4><p className="mt-3 text-[13px] font-light leading-[2.1] tracking-[0.05em]">{body}</p></section>)}
                        </div>
                      </div>
                      <div>
                        <h4 className="border-b border-[#1c1d1d] pb-3 text-xs tracking-[0.18em]">歩み</h4>
                        <dl>
                          {article.stats.map(([value, label]) => <div key={value} className="grid grid-cols-[4.5rem_1fr] gap-4 border-b border-[#deded8] py-5"><dt className="font-serif text-[18px]">{value}</dt><dd className="text-[12px] font-light leading-[1.9] tracking-[0.05em]">{label}</dd></div>)}
                        </dl>
                        <div className="mt-10 space-y-8">
                          {article.sections.slice(2).map(([heading, body]) => <section key={heading}><h4 className="text-sm font-semibold tracking-[0.1em]">{heading}</h4><p className="mt-3 text-[13px] font-light leading-[2.15] tracking-[0.05em]">{body}</p></section>)}
                        </div>
                      </div>
                    </div>
                  )}

                  {index === 2 && (
                    <div className="mt-9">
                      <div className="grid border-y border-[#1c1d1d] md:grid-cols-3">
                        {article.stats.map(([value, label], varietyIndex) => (
                          <div key={value} className="border-b border-[#deded8] px-5 py-6 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
                            <span className="text-[9px] tracking-[0.2em] text-gray-400">品種 0{varietyIndex + 1}</span><h4 className="mt-2 font-serif text-[21px] tracking-[0.1em]">{value}</h4><p className="mt-2 text-[11px] tracking-[0.08em] text-gray-500">{label}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-10 grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:gap-12">
                        <figure><div className="aspect-[16/10] overflow-hidden"><img src={article.image} alt={article.imageAlt} loading="lazy" className="h-full w-full object-cover" /></div></figure>
                        <div className="space-y-8">{article.sections.slice(0, 2).map(([heading, body]) => <section key={heading}><h4 className="text-sm font-semibold tracking-[0.1em]">{heading}</h4><p className="mt-3 text-[13px] font-light leading-[2.1] tracking-[0.05em]">{body}</p></section>)}</div>
                      </div>
                      <div className="mt-10 grid gap-8 border-t border-[#deded8] pt-8 md:grid-cols-2 md:gap-14">
                        {article.sections.slice(2).map(([heading, body], productionIndex) => <section key={heading} className={productionIndex === 1 ? 'md:border-l md:border-[#deded8] md:pl-14' : ''}><span className="text-[9px] tracking-[0.2em] text-gray-400">工程 0{productionIndex + 1}</span><h4 className="mt-2 text-sm font-semibold tracking-[0.1em]">{heading}</h4><p className="mt-3 text-[13px] font-light leading-[2.15] tracking-[0.05em]">{body}</p></section>)}
                      </div>
                    </div>
                  )}

                  {index === 3 && (
                    <div className="mt-9">
                      <figure className="-mx-6 md:mx-0"><div className="aspect-[16/10] overflow-hidden md:aspect-[21/9]"><img src={article.image} alt={article.imageAlt} loading="lazy" className="h-full w-full object-cover" /></div></figure>
                      <div className="mx-auto mt-10 max-w-[720px]">
                        <blockquote className="text-center font-serif text-[20px] leading-[1.9] tracking-[0.1em] md:text-[24px]">「何かあったら、まず相談してみよう」<br />そう思ってもらえる田んぼへ。</blockquote>
                        <div className="mt-10 space-y-8">{article.sections.map(([heading, body]) => <section key={heading} className="grid gap-3 border-t border-[#deded8] pt-7 md:grid-cols-[12rem_1fr] md:gap-8"><h4 className="text-sm font-semibold tracking-[0.1em]">{heading}</h4><p className="text-[13px] font-light leading-[2.15] tracking-[0.05em]">{body}</p></section>)}</div>
                      </div>
                      <dl className="mt-12 grid gap-px bg-[#d8d8d2] border-y border-[#d8d8d2] sm:grid-cols-3">{article.stats.map(([value, label]) => <div key={value} className="bg-[#f1f1ed] px-5 py-6 text-center"><dt className="font-serif text-[28px]">{value}</dt><dd className="mt-2 text-[10px] tracking-[0.08em] text-gray-500">{label}</dd></div>)}</dl>
                    </div>
                  )}

                  {index === 4 && (
                    <div className="mt-9">
                      <figure className="grid gap-7 md:grid-cols-[0.7fr_1.3fr] md:items-end"><div className="aspect-[4/5] overflow-hidden"><img src={article.image} alt={article.imageAlt} loading="lazy" className="h-full w-full object-cover" /></div><blockquote className="border-y border-[#1c1d1d] py-8 font-serif text-[21px] leading-[1.9] tracking-[0.09em] md:text-[27px]">支えてもらった人が、<br />次は隣の誰かへ渡していく。<br />その循環を、田んぼから。</blockquote></figure>
                      <div className="mt-12">
                        {article.stats.map(([value, label], chapterIndex) => {
                          const section = article.sections[chapterIndex];
                          return <section key={value} className="grid gap-5 border-t border-[#1c1d1d] py-8 md:grid-cols-[10rem_14rem_1fr] md:gap-8"><div><span className="text-[9px] tracking-[0.2em] text-gray-400">章 0{chapterIndex + 1}</span><p className="mt-1 font-serif text-[30px]">{value}</p><p className="text-[10px] tracking-[0.08em] text-gray-500">{label}</p></div><h4 className="text-[17px] font-semibold leading-[1.7] tracking-[0.1em]">{section[0]}</h4><p className="text-[13px] font-light leading-[2.15] tracking-[0.05em]">{section[1]}</p></section>;
                        })}
                        <section className="grid gap-5 border-y border-[#1c1d1d] py-8 md:grid-cols-[10rem_14rem_1fr] md:gap-8"><div className="text-[9px] tracking-[0.2em] text-gray-400">結び</div><h4 className="text-[17px] font-semibold leading-[1.7] tracking-[0.1em]">{article.sections[3][0]}</h4><p className="text-[13px] font-light leading-[2.15] tracking-[0.05em]">{article.sections[3][1]}</p></section>
                      </div>
                    </div>
                  )}
                </article>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
