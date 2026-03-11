import SearchForm from '@/components/SearchForm';
import HowItWorks from '@/components/HowItWorks';

const FAQ = [
  {
    q: 'なぜ予約サイトによって価格が違うのか？',
    a: '予約サイトはそれぞれホテルと異なる契約を結んでいるため、同じ部屋でもサイトごとに価格が異なります。差額は数十ドルに及ぶこともあります。',
  },
  {
    q: 'どの予約サイトが安い？',
    a: 'ホテルや時期によって異なりますが、Agoda・Trip.comは比較的安い傾向があります。RyokoAIで複数の予約サイトの価格を一括比較して最安値を見つけましょう。',
  },
  {
    q: 'VPNを使うとさらに安くなる？',
    a: '一部の予約サイトはアクセス元の国によって価格が変わります。VPNで別の国から接続すると、さらに安くなる場合があります。RyokoAIのジオプライシング機能で国別の価格差を確認できます。',
  },
];

export default function HomePage() {
  return (
    <div className="space-y-20 pb-8">
      {/* Hero */}
      <section className="pt-16 pb-4 px-4 text-center space-y-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
          同じホテル、予約サイトで<br />
          <span className="text-blue-700">これだけ違う。</span>
        </h1>
        <p className="text-gray-500 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          同じ部屋なのに予約サイトによって数千円、数万円の差。<br />
          RyokoAIで最安価格を見つけよう。
        </p>
        <SearchForm />
      </section>

      {/* How it works */}
      <section className="px-4">
        <HowItWorks />
      </section>

      {/* FAQ */}
      <section className="px-4 max-w-2xl mx-auto space-y-6">
        <h2 className="text-gray-900 font-bold text-xl text-center">よくある質問</h2>
        <div className="space-y-3">
          {FAQ.map((item) => (
            <details key={item.q} open className="group bg-white border border-gray-200 rounded-xl shadow-sm">
              <summary className="px-5 py-4 text-sm text-gray-900 font-medium cursor-pointer list-none flex items-center justify-between">
                {item.q}
                <span className="text-gray-300 group-open:rotate-45 transition-transform text-lg">+</span>
              </summary>
              <div className="px-5 pb-4 text-gray-500 text-sm leading-relaxed">
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </section>
      {/* Footer / Disclaimer */}
      <footer className="px-4 max-w-2xl mx-auto pb-8">
        <p className="text-gray-400 text-xs leading-relaxed text-center">
          ※ 表示される価格は各予約サイトから取得した参考価格です。実際の価格は予約サイトにてご確認ください。RyokoAIは価格の正確性を保証するものではありません。
        </p>
      </footer>
    </div>
  );
}
