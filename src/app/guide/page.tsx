import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '予約サイト比較でホテルを安く予約する方法 | RyokoAI',
  description: '予約サイトによって同じ部屋でも価格が大きく異なります。RyokoAIで複数の予約サイトの価格を一括比較して最安値で予約する方法を解説。',
};

export default function GuidePage() {
  return (
    <div className="px-4 py-12 max-w-2xl mx-auto space-y-10">
      <div className="space-y-3">
        <h1 className="text-gray-900 font-bold text-2xl">予約サイト比較でホテルを安く予約する方法</h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          同じホテル、同じ日程でも、予約サイトによって価格が大きく異なります。
          この仕組みを理解して、最安値を手に入れましょう。
        </p>
      </div>

      {/* Why prices differ */}
      <section className="space-y-3">
        <h2 className="text-gray-900 font-bold text-lg">なぜ予約サイトによって価格が違うのか？</h2>
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 text-gray-600 text-sm leading-relaxed shadow-sm">
          <p>
            AgodaやBooking.comなどの予約サイトは
            それぞれホテルと<strong className="text-gray-900">異なる契約条件</strong>を結んでいます。
            仕入れ価格、手数料率、販促キャンペーンが異なるため、同じ部屋でもサイトごとに価格が変わります。
          </p>
          <p>
            差額は<strong className="text-gray-900">数十ドル（数千円）</strong>に及ぶことも珍しくありません。
            比較せずに予約するのは、お金を捨てているようなものです。
          </p>
        </div>
      </section>

      {/* Real example */}
      <section className="space-y-3">
        <h2 className="text-gray-900 font-bold text-lg">実際の価格差の例</h2>
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 space-y-3">
          <p className="text-gray-900 text-sm font-medium">Hyatt Regency Waikiki（1泊・2名）</p>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Agoda</span>
              <span className="text-emerald-600 font-semibold">$251</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Trip.com</span>
              <span className="text-gray-700">$256</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Booking.com</span>
              <span className="text-gray-700">$336</span>
            </div>
            <div className="h-px bg-gray-200 my-2" />
            <div className="flex justify-between">
              <span className="text-gray-500">予約サイト間の最大差額</span>
              <span className="text-amber-600 font-semibold">$85 (25%)</span>
            </div>
          </div>
          <p className="text-gray-400 text-xs">
            ※ 2026年3月時点のXotelo API取得データ
          </p>
        </div>
      </section>

      {/* Step by step */}
      <section className="space-y-3">
        <h2 className="text-gray-900 font-bold text-lg">使い方</h2>
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 text-gray-600 text-sm leading-relaxed shadow-sm">
          <div className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center text-xs font-bold shrink-0">1</span>
            <p>RyokoAIでホテル名を入力して検索</p>
          </div>
          <div className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center text-xs font-bold shrink-0">2</span>
            <p>複数の予約サイトの価格がランキング表示される</p>
          </div>
          <div className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center text-xs font-bold shrink-0">3</span>
            <p>最安の予約サイトのリンクをクリック</p>
          </div>
          <div className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center text-xs font-bold shrink-0">4</span>
            <p><strong className="text-gray-900">そのまま予約して完了！</strong></p>
          </div>
        </div>
      </section>

      {/* VPN tip */}
      <section className="space-y-3">
        <h2 className="text-gray-900 font-bold text-lg">さらに安くするには（VPN）</h2>
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 text-gray-600 text-sm leading-relaxed shadow-sm">
          <p>
            一部の予約サイトはアクセス元の国によっても価格を変えています。
            VPNで別の国から接続すると、さらに安い価格が表示される場合があります。
          </p>
          <p className="text-gray-400 text-xs">
            おすすめ: <a href="https://protonvpn.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">Proton VPN</a>（無料プランあり）
          </p>
        </div>
      </section>

      {/* Cautions */}
      <section className="space-y-3">
        <h2 className="text-gray-900 font-bold text-lg">注意事項</h2>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 space-y-3 text-sm leading-relaxed">
          <div className="flex gap-2">
            <span className="shrink-0">&#x2705;</span>
            <p className="text-gray-600"><strong className="text-gray-900">ホテル予約は問題なし</strong> &#8212; 主要予約サイトはVPN使用を明示的に禁止していません</p>
          </div>
          <div className="flex gap-2">
            <span className="shrink-0">&#x26A0;&#xFE0F;</span>
            <p className="text-gray-600"><strong className="text-gray-900">航空券は注意が必要</strong> &#8212; 予約キャンセルやアカウントBANのリスクあり</p>
          </div>
          <div className="flex gap-2">
            <span className="shrink-0">&#x1F4B3;</span>
            <p className="text-gray-600"><strong className="text-gray-900">クレジットカード</strong> &#8212; 海外通貨での決済になる場合、カード会社の海外利用設定が必要なことがあります</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 text-center space-y-3">
        <p className="text-gray-900 text-sm font-medium">
          RyokoAIで予約サイトの最安値を見つけよう
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors shadow-md shadow-indigo-500/20"
        >
          ホテルを検索する
        </Link>
      </div>
    </div>
  );
}
