import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'VPNでホテルを安く予約する方法 | 国別価格差ガイド | RyokoAI',
  description: 'ホテル予約サイトは国によって価格が最大25%違います。VPNを使って安い国の価格で予約する方法をステップバイステップで解説。',
};

const CHEAP_COUNTRIES = [
  { rank: 1, flag: '🇵🇱', name: 'ポーランド', note: '欧州で最も安くなりやすい' },
  { rank: 2, flag: '🇯🇵', name: '日本', note: '国内ホテルは日本IPが最安のことも' },
  { rank: 3, flag: '🇮🇳', name: 'インド', note: '東南アジアのホテルで大幅割引' },
  { rank: 4, flag: '🇧🇷', name: 'ブラジル', note: '通貨安による割引効果' },
];

export default function GuidePage() {
  return (
    <div className="px-4 py-12 max-w-2xl mx-auto space-y-10">
      <div className="space-y-3">
        <h1 className="text-white font-bold text-2xl">VPNでホテルを安く予約する方法</h1>
        <p className="text-white/50 text-sm leading-relaxed">
          同じホテル、同じ日程でも、アクセスする国によって価格が大きく異なります。
          この仕組みを理解して、VPNで最安値を手に入れましょう。
        </p>
      </div>

      {/* Why prices differ */}
      <section className="space-y-3">
        <h2 className="text-white font-bold text-lg">なぜ国によって価格が違うのか？</h2>
        <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5 space-y-3 text-white/60 text-sm leading-relaxed">
          <p>
            AgodaやBooking.comなどのOTA（オンライン旅行代理店）は
            <strong className="text-white/80">「ダイナミックプライシング」</strong>を採用しています。
            アクセス元のIPアドレスから国を判別し、その国の市場に合わせた価格を表示します。
          </p>
          <p>
            これは「ジオプライシング」とも呼ばれ、
            一般的に<strong className="text-white/80">購買力の低い国からのアクセスには安い価格</strong>が表示される傾向があります。
          </p>
        </div>
      </section>

      {/* Real example */}
      <section className="space-y-3">
        <h2 className="text-white font-bold text-lg">実際の価格差の例</h2>
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-5 space-y-3">
          <p className="text-white/80 text-sm font-medium">Hyatt Regency Waikiki（2泊・2名）</p>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-white/50">Agoda（最安OTA）</span>
              <span className="text-emerald-400 font-semibold">$220/泊</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Booking.com</span>
              <span className="text-white/70">$250/泊</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Hotels.com</span>
              <span className="text-white/70">$255/泊</span>
            </div>
            <div className="h-px bg-white/10 my-2" />
            <div className="flex justify-between">
              <span className="text-white/50">OTA間の最大差額</span>
              <span className="text-amber-400 font-semibold">$35 (14%)</span>
            </div>
          </div>
          <p className="text-white/30 text-xs">
            ※ さらにVPNで国を変えると、同じOTA内でも追加の価格差が発生する場合があります
          </p>
        </div>
      </section>

      {/* Step by step */}
      <section className="space-y-3">
        <h2 className="text-white font-bold text-lg">VPNで安くする手順</h2>
        <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5 space-y-4 text-white/60 text-sm leading-relaxed">
          <div className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0">1</span>
            <p>VPNアプリをインストール（下記のおすすめから選択）</p>
          </div>
          <div className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0">2</span>
            <p>安くなりやすい国のサーバーに接続（ポーランド、インド、ブラジル等）</p>
          </div>
          <div className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0">3</span>
            <p>RyokoAIでホテルを検索し、リンクをクリック</p>
          </div>
          <div className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0">4</span>
            <p>OTAサイトでVPN接続国の価格が表示される</p>
          </div>
          <div className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">5</span>
            <p><strong className="text-white/80">最安のOTA × 最安の国</strong>の組み合わせで予約！</p>
          </div>
        </div>
      </section>

      {/* Cheap countries ranking */}
      <section className="space-y-3">
        <h2 className="text-white font-bold text-lg">安くなりやすい国ランキング</h2>
        <div className="space-y-2">
          {CHEAP_COUNTRIES.map((c) => (
            <div key={c.rank} className="bg-[#1E293B] border border-white/5 rounded-xl px-5 py-3 flex items-center gap-4">
              <span className="text-indigo-400 font-bold text-sm w-6">#{c.rank}</span>
              <span className="text-xl">{c.flag}</span>
              <div>
                <p className="text-white text-sm font-medium">{c.name}</p>
                <p className="text-white/40 text-xs">{c.note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Free VPN */}
      <section className="space-y-3">
        <h2 className="text-white font-bold text-lg">おすすめVPN</h2>

        <div className="space-y-3">
          <p className="text-xs text-emerald-400 font-medium">無料で試せる</p>
          <a
            href="https://protonvpn.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-5 py-4 hover:border-emerald-500/40 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">Proton VPN</p>
                <p className="text-white/40 text-xs mt-1">無料プランあり。米国・日本・オランダのサーバーが使える。まずはこれで試すのがおすすめ。</p>
              </div>
              <span className="text-emerald-400 text-xs font-medium shrink-0 ml-3">無料</span>
            </div>
          </a>

          <p className="text-xs text-white/40 font-medium pt-2">有料（より多くの国が使える）</p>
          <a
            href="https://nordvpn.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-[#1E293B] border border-white/5 rounded-xl px-5 py-4 hover:border-white/15 transition-colors"
          >
            <p className="text-white text-sm font-medium">NordVPN</p>
            <p className="text-white/40 text-xs mt-1">60カ国以上のサーバー。高速で安定。サーバー数最多クラス。</p>
          </a>
          <a
            href="https://surfshark.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-[#1E293B] border border-white/5 rounded-xl px-5 py-4 hover:border-white/15 transition-colors"
          >
            <p className="text-white text-sm font-medium">Surfshark</p>
            <p className="text-white/40 text-xs mt-1">コスパ最強。デバイス無制限。100カ国のサーバー。</p>
          </a>
        </div>
      </section>

      {/* Cautions */}
      <section className="space-y-3">
        <h2 className="text-white font-bold text-lg">注意事項</h2>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 space-y-3 text-sm leading-relaxed">
          <div className="flex gap-2">
            <span className="text-emerald-400 shrink-0">✅</span>
            <p className="text-white/60"><strong className="text-white/80">ホテル予約は問題なし</strong> — 主要OTAはVPN使用を明示的に禁止していません</p>
          </div>
          <div className="flex gap-2">
            <span className="text-amber-400 shrink-0">⚠️</span>
            <p className="text-white/60"><strong className="text-white/80">航空券は注意が必要</strong> — 予約キャンセルやアカウントBANのリスクあり。RyokoAIはホテルに特化しています</p>
          </div>
          <div className="flex gap-2">
            <span className="text-blue-400 shrink-0">💳</span>
            <p className="text-white/60"><strong className="text-white/80">クレジットカード</strong> — 海外通貨での決済になる場合、カード会社の海外利用設定が必要なことがあります</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-6 text-center space-y-3">
        <p className="text-white text-sm font-medium">
          RyokoAIなら、どの国が安いか一覧で確認できます
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition-colors"
        >
          ホテルを検索する
        </Link>
      </div>
    </div>
  );
}
