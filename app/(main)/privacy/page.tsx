'use client';

import { useEffect } from 'react';

export default function PrivacyPolicyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-28 pb-24 min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-serif tracking-widest text-primary mb-4">プライバシーポリシー</h1>
          <div className="w-12 h-px bg-primary" />
        </div>
        <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-8">
          <p className="text-sm md:text-base leading-relaxed">
            株式会社naco（以下、「当社」といいます。）は、当社が運営するオンラインショップ「イケベジ」（以下、「本サービス」といいます。）におけるお客様の個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下、「本ポリシー」といいます。）を定めます。
          </p>

          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-serif tracking-widest text-primary mt-12 mb-6">第1条（個人情報）</h2>
            <p className="text-sm md:text-base leading-relaxed">
              「個人情報」とは、個人情報保護法にいう「個人情報」を指すものとし、生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日、住所、電話番号、連絡先その他の記述等により特定の個人を識別できる情報を指します。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-serif tracking-widest text-primary mt-12 mb-6">第2条（個人情報の収集方法）</h2>
            <p className="text-sm md:text-base leading-relaxed">
              当社は、ユーザーが利用登録をする際や商品をご注文いただく際に、氏名、住所、電話番号、メールアドレス、お支払いに関する情報などをお尋ねすることがあります。なお、お支払いに関する情報（クレジットカード情報等）は、決済代行会社（Stripe）を通じて処理され、当社のサーバーにカード番号等が保存されることはありません。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-serif tracking-widest text-primary mt-12 mb-6">第3条（個人情報を収集・利用する目的）</h2>
            <ol className="list-decimal list-inside space-y-3 text-sm md:text-base leading-relaxed">
              <li>本サービスの提供・運営のため</li>
              <li>ご注文いただいた商品の発送、ご連絡、各種お問い合わせへの対応のため</li>
              <li>ユーザーからのお問い合わせに回答するため</li>
              <li>メンテナンス、重要なお知らせなど必要に応じたご連絡のため</li>
              <li>本サービスの改善、新サービスの開発、マーケティング活動のため</li>
              <li>上記の利用目的に付随する目的のため</li>
            </ol>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-serif tracking-widest text-primary mt-12 mb-6">第4条（アクセス解析ツール・広告について）</h2>
            <p className="text-sm md:text-base leading-relaxed">
              当社は、本サービスの利用状況を把握し、サービス向上に役立てるため、Googleが提供するアクセス解析ツール「Googleアナリティクス」を利用しています。Googleアナリティクスは、Cookieを利用してユーザーの利用情報を収集します。これらの情報は匿名で収集されており、個人を特定するものではありません。
            </p>
            <p className="text-sm md:text-base leading-relaxed">
              また、当社は「Googleシグナル」を有効にしており、Googleアカウントにログインし広告のカスタマイズに同意しているユーザーについて、年齢・性別・興味関心などのユーザー属性データを集計データとして取得する場合があります。あわせて、当社は <strong>Google広告のパーソナライゼーション（広告のカスタマイズ）機能</strong> を利用しており、ユーザーの興味関心に基づいた広告を配信することがあります。
            </p>
            <p className="text-sm md:text-base leading-relaxed">
              これらの機能により取得される情報は、ユーザーご自身で確認・管理・無効化することが可能です。
            </p>
            <ul className="list-disc list-inside space-y-3 text-sm md:text-base leading-relaxed">
              <li>
                Googleアナリティクスの利用規約・プライバシーポリシーについては、
                <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Googleのポリシーと規約</a>
                をご確認ください。
              </li>
              <li>
                広告のパーソナライズは、
                <a href="https://myadcenter.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google広告設定</a>
                からオフにできます。
              </li>
              <li>
                Googleアナリティクスによるデータ収集は、
                <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Googleアナリティクス オプトアウト アドオン</a>
                を利用して無効化できます。
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-serif tracking-widest text-primary mt-12 mb-6">第5条（個人情報の第三者提供）</h2>
            <p className="text-sm md:text-base leading-relaxed">
              当社は、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。ただし、個人情報保護法その他の法令で認められる場合を除きます。
            </p>
            <ol className="list-decimal list-inside space-y-3 text-sm md:text-base leading-relaxed">
              <li>法令に基づく場合</li>
              <li>人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき</li>
              <li>商品の発送、決済の処理など、利用目的の達成に必要な範囲で業務委託先に提供する場合</li>
            </ol>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-serif tracking-widest text-primary mt-12 mb-6">第6条（個人情報の開示・訂正・削除）</h2>
            <p className="text-sm md:text-base leading-relaxed">
              当社は、本人から個人情報の開示・訂正・追加・削除・利用停止を求められたときは、本人ご確認のうえ、法令に従い遅滞なく対応いたします。ご請求は、下記のお問い合わせ窓口までご連絡ください。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-serif tracking-widest text-primary mt-12 mb-6">第7条（プライバシーポリシーの変更）</h2>
            <p className="text-sm md:text-base leading-relaxed">
              本ポリシーの内容は、法令その他本ポリシーに別段の定めのある事項を除いて、ユーザーに通知することなく変更することができるものとします。当社が別途定める場合を除いて、変更後のプライバシーポリシーは、本ウェブサイトに掲載したときから効力を生じるものとします。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-serif tracking-widest text-primary mt-12 mb-6">第8条（お問い合わせ窓口）</h2>
            <p className="text-sm md:text-base leading-relaxed">
              本ポリシーに関するお問い合わせは、下記までお願いいたします。
            </p>
            <dl className="space-y-3 text-sm md:text-base leading-relaxed">
              <div className="flex flex-col md:flex-row">
                <dt className="font-medium text-gray-900 w-32 flex-shrink-0 mb-1 md:mb-0">会社名</dt>
                <dd className="text-gray-700">株式会社naco</dd>
              </div>
              <div className="flex flex-col md:flex-row">
                <dt className="font-medium text-gray-900 w-32 flex-shrink-0 mb-1 md:mb-0">所在地</dt>
                <dd className="text-gray-700">〒952-0317<br />新潟県佐渡市豊田560</dd>
              </div>
              <div className="flex flex-col md:flex-row">
                <dt className="font-medium text-gray-900 w-32 flex-shrink-0 mb-1 md:mb-0">連絡先</dt>
                <dd className="text-gray-700">
                  Mail: <a href="mailto:info@ikevege.com" className="text-primary hover:underline">info@ikevege.com</a>
                </dd>
              </div>
            </dl>
          </section>

          <p className="text-sm text-gray-500 pt-8">制定日：2026年6月18日</p>
        </div>
      </div>
    </div>
  );
}
