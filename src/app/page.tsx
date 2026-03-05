import SearchForm from '@/components/SearchForm';
import HowItWorks from '@/components/HowItWorks';

const FAQ = [
  {
    q: 'なぜ国によって価格が違うのか？',
    a: 'OTA（オンライン旅行代理店）は、アクセス元のIPアドレスに基づいて国を判別し、その国の市場に合わせた価格を表示します。これは「ジオプライシング」と呼ばれ、同じホテルの同じ部屋でも最大25%の価格差が生じることがあります。',
  },
  {
    q: '違う国設定で予約して大丈夫？',
    a: 'はい、問題ありません。主要なOTA（Agoda, Booking.com等）はVPN利用を明示的に禁止していません。実際に多くの旅行者がこの方法で節約しています。ホテル予約は航空券と異なりキャンセルリスクも低いです。',
  },
  {
    q: 'VPNは必要？',
    a: 'OTAの価格差はIPアドレスで決まるため、国別リンクだけでは完全な価格差は反映されません。VPNを使って対象国のサーバーに接続すると、その国向けの価格が確実に表示されます。無料のProton VPNでも試せます。',
  },
  {
    q: 'どの国が安い？',
    a: '一般的に、ポーランド、日本、インド、ブラジルなどが安くなりやすい傾向があります。ただし、ホテルや時期によって最安の国は変わるため、複数の国で確認することをおすすめします。',
  },
];

export default function HomePage() {
  return (
    <div className="space-y-20 pb-8">
      {/* Hero */}
      <section className="pt-16 pb-4 px-4 text-center space-y-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
          同じホテル、国が変わるだけで<br />
          <span className="text-indigo-400">最大25%安くなる。</span>
        </h1>
        <p className="text-white/50 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Agoda $220、Booking.com $250 ── 同じ部屋なのにOTAで$30の差。<br />
          さらに、アクセスする国を変えるだけで追加割引も。<br />
          RyokoAIで最安を見つけよう。
        </p>
        <div className="px-4">
          <SearchForm />
        </div>
        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-4 text-xs text-white/30">
          <span>対応OTA: Agoda / Booking.com / Expedia / Hotels.com 他</span>
          <span>18カ国の価格を比較</span>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4">
        <HowItWorks />
      </section>

      {/* FAQ */}
      <section className="px-4 max-w-2xl mx-auto space-y-6">
        <h2 className="text-white font-bold text-xl text-center">よくある質問</h2>
        <div className="space-y-3">
          {FAQ.map((item) => (
            <details key={item.q} className="group bg-[#1E293B] border border-white/5 rounded-xl">
              <summary className="px-5 py-4 text-sm text-white font-medium cursor-pointer list-none flex items-center justify-between">
                {item.q}
                <span className="text-white/30 group-open:rotate-45 transition-transform text-lg">+</span>
              </summary>
              <div className="px-5 pb-4 text-white/50 text-sm leading-relaxed">
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
