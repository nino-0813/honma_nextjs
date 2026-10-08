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

const moreTopics = [
  { kicker: '佐渡について ｜ 02', title: '豊田集落の歴史', status: '準備中', items: [] },
  { kicker: 'イケベジについて', title: 'naco と、イケベジのあゆみ', status: '準備中', items: ['nacoの由来', 'スタッフ', '会社情報', 'イケベジ沿革'] },
  { kicker: '生産について', title: 'お米と原木しいたけ', status: '順次公開', items: ['3品種と栽培方法', 'お米の研ぎ方・保管から出荷まで', 'アワード', '原木しいたけと農漁業循環栽培', '島内資源の循環'] },
  { kicker: '体験について', title: '田んぼへの入り口', status: '準備中', items: ['田植え・稲刈り体験', 'TOKItoWA'] },
  { kicker: '取り組みについて', title: '次の世代へつなぐ', status: '順次公開', items: ['佐渡Kids生きもの調査隊', 'クラウドファンディング', '4,700人の定期便'] },
];

export default function AboutPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="page-top-offset w-full overflow-x-hidden bg-white text-[#1c1d1d]">
      <header className="px-6 pb-10 pt-8 text-center md:pb-14 md:pt-12">
        <p className="text-[13px] tracking-[0.16em]">イケベジとは</p>
      </header>

      <section className="mx-auto w-full max-w-[1120px] px-4 md:px-6">
        <div className="aspect-[16/10] overflow-hidden md:aspect-video">
          <img src="/images/about/hero/about_hero_taue_92.webp" alt="田んぼのそばで過ごす子どもたち" className="h-full w-full object-cover object-center" />
        </div>
      </section>

      <section className="px-6 py-24 text-center md:py-32">
        <FadeInSection className="mx-auto max-w-[680px]">
          <h1 className="text-[25px] font-medium leading-[1.9] tracking-[0.14em] md:text-[34px]">
            子どもたちが<br />「ここに生まれてよかった」と<br />思える社会を。
          </h1>
          <div className="mt-12 space-y-7 text-[13px] font-light leading-[2.3] tracking-[0.1em] text-gray-600 md:mt-14 md:text-sm">
            <p>自然界では、多様な命が、無理なく、<br />あるがままに響き合い、めぐり続けている。<br />その在り方を、私たちは“イケてる”と呼んでいます。</p>
            <p>お米を育てて届けること。<br />田んぼをひらき、体験や学びの場をつくること。</p>
            <p>イケベジは、農を起点に、<br />自然の在り方を社会へと伝える<br />「通訳」で在り続けます。</p>
          </div>
        </FadeInSection>
      </section>

      <section className="bg-[#f4f4f0] px-4 py-24 md:px-6 md:py-28">
        <FadeInSection className="mx-auto max-w-[1120px]">
          <h2 className="text-center text-[24px] font-medium tracking-[0.2em] md:text-[32px]">きょうも しぜんと いいときを。</h2>
          <div className="mx-auto mt-12 max-w-[680px] space-y-7 text-center text-[13px] font-light leading-[2.3] tracking-[0.09em] text-gray-600 md:text-sm">
            <p>炊きたてのごはんを囲む、家族の食卓。<br />食べる人の顔を思い浮かべながら、台所に立つ時間。<br />田植えや稲刈りで、泥だらけになって笑う子どもたち。<br />そして、田んぼで汗を流す作り手自身の時間。</p>
            <p className="font-medium text-[#1c1d1d]">そのどれもが、イケベジの届けたい「いいとき」です。</p>
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
            <span className="block text-[11px] tracking-[0.28em] text-gray-500">OUR 3 STANCES</span>
            <h2 className="mt-3 text-[25px] font-medium tracking-[0.16em] md:text-[34px]">3つの姿勢</h2>
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

      <section className="border-t border-[#e5e5e0] bg-[#fafaf6] px-6 py-24 md:py-28">
        <div className="mx-auto max-w-[1120px]">
          <FadeInSection className="text-center">
            <span className="block text-[11px] tracking-[0.3em] text-gray-500">KNOW MORE</span>
            <h2 className="mt-3 text-[24px] font-medium tracking-[0.2em] md:text-[30px]">イケベジを詳しく知る</h2>
            <p className="mt-5 text-[13px] font-light leading-[2.1] tracking-[0.08em] text-gray-600">新潟県・佐渡ヶ島の田んぼから。<br />イケベジが日々向き合っていることを、ここから詳しくお伝えします。</p>
          </FadeInSection>

          <nav aria-label="章の一覧" className="mt-12 flex flex-wrap justify-center gap-x-7 gap-y-2 border-y border-[#d9d9d2] py-4 text-[11px] tracking-[0.12em] text-gray-500 md:text-xs">
            <a href="#sado" className="text-[#1c1d1d]">佐渡について</a><span>イケベジについて</span><span>生産について</span><span>体験について</span><span>取り組みについて</span>
          </nav>

          <FadeInSection className="mt-14">
            <article id="sado" className="scroll-mt-32 border-t border-[#1c1d1d] pt-5">
              <span className="text-[10px] tracking-[0.24em] text-gray-500">佐渡について ｜ 01</span>
              <h3 className="mt-3 text-[22px] font-semibold leading-[1.65] tracking-[0.1em] md:text-[28px]">トキと暮らす島で、お米をつくるということ</h3>
              <p className="mt-3 border-b border-[#e5e5e0] pb-6 text-[13px] font-light leading-[2] tracking-[0.06em] text-gray-600 md:text-sm">一度は日本の空から姿を消したトキ。その最後の一羽がいたのが、佐渡ヶ島でした。いま佐渡の田んぼのお米は、トキの暮らしと切り離せないものになっています。</p>

              <div className="mt-7 columns-1 gap-12 lg:columns-2">
                <h4 className="mb-3 break-after-avoid text-sm font-semibold tracking-[0.1em]">田んぼでしか、エサをとれない鳥</h4>
                <p className="mb-5 text-justify text-[13px] font-light leading-[2.05] tracking-[0.05em]">トキは、川や海ではなく、田んぼや湿地でドジョウやカエルなどの小さな生きものを食べて暮らす鳥です。いま湿地と呼べる場所の多くは田んぼであり、トキは人の営みと共に生きなければ、暮らしていくことができません。</p>
                <p className="mb-5 text-justify text-[13px] font-light leading-[2.05] tracking-[0.05em]">明治時代からの乱獲に加え、農薬や化学肥料が広く使われるようになったことで、エサとなる生きものが田んぼから減り、トキは数を減らしていきました。</p>

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
                <p className="mb-5 text-justify text-[13px] font-light leading-[2.05] tracking-[0.05em]">トキを野生に定着させるには、まず田んぼに生きものが戻らなければなりません。そこで2008年に始まったのが「朱鷺と暮らす郷づくり認証制度」。イケベジでは通称「トキ認証」と呼んでいます。</p>

                <div className="mb-5 break-inside-avoid border border-[#deded8] bg-white px-5 py-4">
                  <strong className="block text-xs tracking-[0.14em]">トキ認証の主な要件</strong>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-[11px] font-light leading-[1.9] md:text-xs"><li>生きものを育む農法を行うこと</li><li>農薬・化学肥料を5割以上減らすこと（ネオニコチノイド系農薬は使用不可）</li><li>あぜに除草剤を使わず、草刈りで管理すること</li><li>年2回、田んぼの生きもの調査を行うこと</li></ul>
                </div>

                <p className="mb-5 text-justify text-[13px] font-light leading-[2.05] tracking-[0.05em]">「生きものを育む農法」とは、たとえば田んぼの水を抜いたあとも水生生物が逃げ込める「江」を設けることや、冬のあいだも田んぼに水を張る「冬みず田んぼ」など。稲の育ちには直接関わらなくても、生きものを育むことを同時に叶える工夫です。</p>
                <p className="mb-5 text-justify text-[13px] font-light leading-[2.05] tracking-[0.05em]">さらに認証米として販売するには、農産物検査で1等であること、味を大きく左右するタンパク質含有量が6.2％以下であることが求められます。安心と、おいしさ。その両方を満たしたお米だけが、トキ認証米として食卓に届きます。</p>
                <p className="mb-5 text-justify text-[13px] font-light leading-[2.05] tracking-[0.05em]">制度が始まって10年目に行われたアンケートでは、「これからも認証米の栽培を続けない」と答えた農家はゼロでした。新たに関心がある取り組みとして最も多く挙がったのは、農薬も肥料も使わない「自然栽培による米づくり」です。</p>
                <p className="mt-3 text-[10px] font-light leading-[1.8] tracking-[0.05em] text-gray-500">出典：佐渡市農業政策課／「朱鷺と暮らす郷づくり認証制度の評価レポート」新潟大学 豊田光世</p>
              </div>
            </article>
          </FadeInSection>

          <div className="mt-16">
            {moreTopics.map((topic) => (
              <FadeInSection key={topic.title} className="border-t border-[#1c1d1d] py-5">
                <div className="flex items-baseline justify-between gap-4"><div><span className="block text-[10px] tracking-[0.2em] text-gray-500">{topic.kicker}</span><h3 className="mt-2 text-[17px] font-semibold tracking-[0.1em] md:text-lg">{topic.title}</h3></div><span className="shrink-0 text-[10px] tracking-[0.1em] text-[#9b5e3c]">{topic.status}</span></div>
                {topic.items.length > 0 && <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-light tracking-[0.06em] text-gray-600 md:text-xs">{topic.items.map((item) => <li key={item}>{item}</li>)}</ul>}
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
