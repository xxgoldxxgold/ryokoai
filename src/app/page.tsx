import SearchForm from '@/components/SearchForm';
import HowItWorks from '@/components/HowItWorks';

const FAQ = [
  {
    q: 'なぜ国によって価格が違うのか？',
    a: 'AgodaやBooking.comなどのOTA（オンライン旅行代理店）は、アクセス元の国や設定言語・通貨によって異なる料金を表示します。これは各市場向けの価格戦略によるものです。',
  },
  {
    q: '違う国設定で予約して大丈夫？',
    a: 'はい、問題ありません。OTAの利用規約上、どの国設定から予約しても有効です。実際に多くの旅行者がこの方法で節約しています。',
  },
  {
    q: 'VPNは必要？',
    a: 'リンクをクリックするだけでも各国設定のページが開きますが、OTAがIPアドレスに基づいて価格を変更する場合があります。VPNを使うと、その国からアクセスしているように見せることができ、さらにお得な価格が表示される場合があります。',
  },
];

export default function HomePage() {
  return (
    <div className="space-y-20 pb-8">
      {/* Hero */}
      <section className="pt-16 pb-4 px-4 text-center space-y-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
          同じホテル、国が変わるだけで<br />
          <span className="text-indigo-400">料金が変わる。</span>
        </h1>
        <p className="text-white/50 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
          RyokoAIは、各国設定の予約リンクを一覧生成。<br />
          最安の国を見つけて予約しよう。
        </p>
        <div className="px-4">
          <SearchForm />
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
