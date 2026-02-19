'use client';

import { useEffect } from 'react';

export default function TermsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-28 pb-24 min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-serif tracking-widest text-primary mb-4">利用規約</h1>
          <div className="w-12 h-px bg-primary" />
        </div>
        <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-8">
          <p className="text-sm md:text-base leading-relaxed">
            この利用規約（以下、「本規約」といいます。）は、株式会社naco（以下、「当社」といいます。）がこのウェブサイト上で提供するオンラインショップ（以下、「本サービス」といいます。）の利用条件を定めるものです。登録ユーザーの皆さま（以下、「ユーザー」といいます。）には、本規約に従って、本サービスをご利用いただきます。
          </p>
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-serif tracking-widest text-primary mt-12 mb-6">第1条（適用）</h2>
            <ol className="list-decimal list-inside space-y-3 text-sm md:text-base leading-relaxed">
              <li>本規約は、ユーザーと当社との間の本サービスの利用に関わる一切の関係に適用されるものとします。</li>
              <li>当社は本サービスに関し、本規約のほか、ご利用にあたってのルール等、各種の定め（以下、「個別規定」といいます。）をすることがあります。これら個別規定はその名称のいかんに関わらず、本規約の一部を構成するものとします。</li>
              <li>本規約の定めが前項の個別規定の定めと矛盾する場合には、個別規定において特段の定めなき限り、個別規定の定めが優先されるものとします。</li>
            </ol>
          </section>
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-serif tracking-widest text-primary mt-12 mb-6">第2条（利用登録）</h2>
            <ol className="list-decimal list-inside space-y-3 text-sm md:text-base leading-relaxed">
              <li>本サービスにおいては、登録希望者が本規約に同意の上、当社の定める方法によって利用登録を申請し、当社がこれに対する承認を登録希望者に通知することによって、利用登録が完了するものとします。</li>
              <li>当社は、利用登録の申請者に以下の事由があると判断した場合、利用登録の申請を承認しないことがあり、その理由については一切の開示義務を負わないものとします。
                <ol className="list-decimal list-inside ml-6 mt-2 space-y-2">
                  <li>利用登録の申請に際して虚偽の事項を届け出た場合</li>
                  <li>本規約に違反したことがある者からの申請である場合</li>
                  <li>その他、当社が利用登録を相当でないと判断した場合</li>
                </ol>
              </li>
            </ol>
          </section>
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-serif tracking-widest text-primary mt-12 mb-6">第3条（ユーザーIDおよびパスワードの管理）</h2>
            <ol className="list-decimal list-inside space-y-3 text-sm md:text-base leading-relaxed">
              <li>ユーザーは、自己の責任において、本サービスのユーザーIDおよびパスワードを管理するものとします。</li>
              <li>ユーザーは、いかなる場合にも、ユーザーIDおよびパスワードを第三者に譲渡または貸与し、もしくは第三者と共用することはできません。</li>
              <li>ユーザーID及びパスワードが第三者に使用されたことによって生じた損害は、当社に故意又は重大な過失がある場合を除き、当社は一切の責任を負わないものとします。</li>
            </ol>
          </section>
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-serif tracking-widest text-primary mt-12 mb-6">第4条（売買契約）</h2>
            <ol className="list-decimal list-inside space-y-3 text-sm md:text-base leading-relaxed">
              <li>本サービスにおいては、ユーザーが当社に対して購入の申し込みをし、これに対して当社が当該申し込みを承諾した旨の通知をすることによって売買契約が成立するものとします。</li>
              <li>当社は、ユーザーが本規約に違反した場合等、当該ユーザーに事前に通知することなく売買契約を解除することができるものとします。</li>
              <li>本サービスに関する決済方法、配送方法、購入の申し込みのキャンセル方法、または返品方法等については、別途当社が定める方法によります。</li>
            </ol>
          </section>
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-serif tracking-widest text-primary mt-12 mb-6">第5条（知的財産権）</h2>
            <p className="text-sm md:text-base leading-relaxed">
              本サービスによって提供される商品写真その他のコンテンツの著作権又はその他の知的所有権は、当社及び正当な権利者に帰属し、ユーザーは、これらを無断で複製、転載、改変、その他の二次利用をすることはできません。
            </p>
          </section>
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-serif tracking-widest text-primary mt-12 mb-6">第6条（禁止事項）</h2>
            <p className="text-sm md:text-base leading-relaxed mb-4">ユーザーは、本サービスの利用にあたり、以下の行為をしてはならないものとします。</p>
            <ol className="list-decimal list-inside space-y-2 text-sm md:text-base leading-relaxed ml-4">
              <li>法令または公序良俗に違反する行為</li>
              <li>犯罪行為に関連する行為</li>
              <li>当社のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
              <li>その他、当社が不適切と判断する行為</li>
            </ol>
          </section>
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-serif tracking-widest text-primary mt-12 mb-6">第7条（本サービスの提供の停止等）</h2>
            <p className="text-sm md:text-base leading-relaxed">
              当社は、必要に応じユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。当社は、これによってユーザーまたは第三者が被ったいかなる不利益または損害についても、一切の責任を負わないものとします。
            </p>
          </section>
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-serif tracking-widest text-primary mt-12 mb-6">第8条（利用制限および登録抹消）</h2>
            <p className="text-sm md:text-base leading-relaxed">
              当社は、ユーザーが本規約に違反した場合等、事前の通知なく、本サービスの全部もしくは一部の利用を制限し、またはユーザーとしての登録を抹消することができるものとします。
            </p>
          </section>
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-serif tracking-widest text-primary mt-12 mb-6">第9条（退会）</h2>
            <p className="text-sm md:text-base leading-relaxed">ユーザーは、所定の退会手続により、本サービスから退会できるものとします。</p>
          </section>
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-serif tracking-widest text-primary mt-12 mb-6">第10条（保証の否認および免責事項）</h2>
            <p className="text-sm md:text-base leading-relaxed">
              当社は、本サービスに事実上または法律上の瑕疵がないことを保証するものではありません。当社は、本サービスによってユーザーに生じたあらゆる損害について、法律で認められる範囲で一切の責任を負いません。
            </p>
          </section>
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-serif tracking-widest text-primary mt-12 mb-6">第11条（サービス内容の変更等）</h2>
            <p className="text-sm md:text-base leading-relaxed">
              当社は、ユーザーに通知することなく、本サービスの内容を変更しまたは本サービスの提供を中止することができるものとし、これによってユーザーに生じた損害について一切の責任を負いません。
            </p>
          </section>
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-serif tracking-widest text-primary mt-12 mb-6">第12条（利用規約の変更）</h2>
            <p className="text-sm md:text-base leading-relaxed">
              当社は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。本規約の変更後、本サービスの利用を開始した場合には、当該ユーザーは変更後の規約に同意したものとみなします。
            </p>
          </section>
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-serif tracking-widest text-primary mt-12 mb-6">第13条（個人情報の取扱い）</h2>
            <p className="text-sm md:text-base leading-relaxed">
              当社は、本サービスの利用によって取得する個人情報については、当社「プライバシーポリシー」に従い適切に取り扱うものとします。
            </p>
          </section>
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-serif tracking-widest text-primary mt-12 mb-6">第14条（通知または連絡）</h2>
            <p className="text-sm md:text-base leading-relaxed">
              ユーザーと当社との間の通知または連絡は、当社の定める方法によって行うものとします。
            </p>
          </section>
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-serif tracking-widest text-primary mt-12 mb-6">第15条（権利義務の譲渡の禁止）</h2>
            <p className="text-sm md:text-base leading-relaxed">
              ユーザーは、当社の書面による事前の承諾なく、利用契約上の地位または本規約に基づく権利もしくは義務を第三者に譲渡し、または担保に供することはできません。
            </p>
          </section>
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-serif tracking-widest text-primary mt-12 mb-6">第16条（準拠法・裁判管轄）</h2>
            <ol className="list-decimal list-inside space-y-3 text-sm md:text-base leading-relaxed">
              <li>本規約の解釈にあたっては、日本法を準拠法とします。</li>
              <li>本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄裁判所とします。</li>
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
