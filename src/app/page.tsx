import SearchForm from '@/components/SearchForm';
import HowItWorks from '@/components/HowItWorks';

const FAQ = [
  {
    q: 'なぜOTAによって価格が違うのか？',
    a: 'OTA（オンライン旅行代理店）はそれぞれホテルと異なる契約を結んでいるため、同じ部屋でもサイトごとに価格が異なります。差額は数十ドルに及ぶこともあります。',
  },
  {
    q: 'どのOTAが安い？',
    a: 'ホテルや時期によって異なりますが、Agoda・Trip.comは比較的安い傾向があります。RyokoAIで複数OTAの価格を一括比較して最安値を見つけましょう。',
  },
  {
    q: 'VPNは必要？',
    a: '一部のOTAはアクセス元の国によって価格が変わります。VPNで別の国から接続すると、さらに安くなる場合があります。',
  },
];

export default function HomePage() {
  return (
    <div className="space-y-20 pb-8">
      {/* Hero */}
      <section className="pt-16 pb-4 px-4 text-center space-y-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
          同じホテル、予約サイトで<br />
          <span className="text-indigo-500">これだけ違う。</span>
        </h1>
        <p className="text-gray-500 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Agoda・Booking.com・Trip.com・Expedia...<br />
          同じ部屋なのにOTAで数十ドルの差。<br />
          RyokoAIで最安を見つけよう。
        </p>
        <div className="px-4">
          <SearchForm />
        </div>
        <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-400">
          <span>対応OTA: Agoda / Booking.com / Trip.com / Expedia 他</span>
        </div>
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
            <details key={item.q} className="group bg-white border border-gray-200 rounded-xl shadow-sm">
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
    </div>
  );
}
