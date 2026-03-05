import Card from '@/components/ui/Card';

const steps = [
  { icon: '💬', title: 'AIとチャット', desc: '行き先や日程を伝えるだけ' },
  { icon: '🔍', title: '価格を一括比較', desc: '100以上の予約サイトを瞬時に検索' },
  { icon: '💰', title: '最安値で予約', desc: 'いつでも一番安い価格で予約できる' },
];

const features = [
  { icon: '🌏', title: '100以上の予約サイト', desc: '主要OTAを横断比較' },
  { icon: '🤖', title: 'AIによる最適提案', desc: 'AIが最適な旅行プランを提案' },
  { icon: '🌐', title: '多言語対応', desc: '日本語・英語など、お好きな言語で' },
  { icon: '💸', title: '完全無料', desc: 'サブスクや隠れ費用なし' },
  { icon: '✈️', title: '航空券+ホテル', desc: '必要な全てが一箇所に' },
  { icon: '🔒', title: 'アカウント不要', desc: 'すぐに使い始められる' },
];

export default function Features() {
  return (
    <>
      {/* 使い方 */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
            使い方
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl mb-3">{step.icon}</div>
                <div className="text-white/30 text-xs mb-1">ステップ {i + 1}</div>
                <h3 className="text-white font-medium mb-1">{step.title}</h3>
                <p className="text-white/50 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 価格比較デモ */}
      <section className="py-16 px-4">
        <div className="max-w-lg mx-auto">
          <Card className="p-6 space-y-4">
            <div className="text-center">
              <h3 className="text-white font-medium">ヒルトン ハワイアンビレッジ — 5泊</h3>
              <p className="text-white/40 text-xs mt-1">価格比較の例</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                <span className="text-white/70 text-sm">Agoda</span>
                <div className="flex items-center gap-2">
                  <span className="text-green-400 font-bold text-sm">$189/泊</span>
                  <span className="text-green-400 text-xs px-1.5 py-0.5 bg-green-500/20 rounded">最安値!</span>
                </div>
              </div>
              <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-white/[0.02]">
                <span className="text-white/50 text-sm">Booking.com</span>
                <span className="text-white/40 text-sm">$210/泊</span>
              </div>
              <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-white/[0.02]">
                <span className="text-white/50 text-sm">Expedia</span>
                <span className="text-white/40 text-sm">$205/泊</span>
              </div>
            </div>
            <div className="text-center text-green-400 text-sm font-medium">
              RyokoAIで最大$105お得に!
            </div>
          </Card>
        </div>
      </section>

      {/* 特徴 */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
            特徴
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <Card key={i} className="flex items-start gap-3 p-4">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <h3 className="text-white text-sm font-medium">{f.title}</h3>
                  <p className="text-white/40 text-xs mt-0.5">{f.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
          次の旅行をもっとお得に。
        </h2>
        <a
          href="/chat"
          className="inline-flex items-center gap-2 bg-gold text-black font-medium px-8 py-3 rounded-xl hover:bg-gold/90 transition-colors"
        >
          無料で旅行を計画する →
        </a>
      </section>
    </>
  );
}
