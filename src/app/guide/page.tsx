import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'VPN利用ガイド - RyokoAI',
  description: 'VPNを使ってホテル予約をさらにお得にする方法を解説します。',
};

const VPN_SERVICES = [
  { name: 'NordVPN', desc: '高速で安定。サーバー数が最多クラス。', url: 'https://nordvpn.com/' },
  { name: 'Surfshark', desc: 'コスパ最強。デバイス無制限。', url: 'https://surfshark.com/' },
  { name: 'ExpressVPN', desc: '速度と信頼性のバランスが良い。', url: 'https://www.expressvpn.com/' },
];

export default function GuidePage() {
  return (
    <div className="px-4 py-12 max-w-2xl mx-auto space-y-10">
      <div className="space-y-3">
        <h1 className="text-white font-bold text-2xl">VPN利用ガイド</h1>
        <p className="text-white/50 text-sm leading-relaxed">
          VPNを使うことで、各国のIPアドレスからOTAサイトにアクセスでき、
          RyokoAIで生成したリンク先の国別料金がそのまま適用されます。
        </p>
      </div>

      {/* Why */}
      <section className="space-y-3">
        <h2 className="text-white font-bold text-lg">なぜVPNで安くなるのか？</h2>
        <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5 space-y-3 text-white/60 text-sm leading-relaxed">
          <p>
            AgodaやBooking.comなどの予約サイトは、アクセス元のIPアドレスから国を判別し、
            その国向けの料金を表示します。
          </p>
          <p>
            RyokoAIのリンクはURL上で言語・通貨を指定しますが、一部のOTAはIPアドレスも考慮します。
            VPNを使って対象国のサーバーに接続すると、よりお得な料金が表示される可能性が高まります。
          </p>
          <p>
            特に<span className="text-emerald-400">インド、タイ、ベトナム</span>などのサーバーに接続すると
            大幅な割引が見られることがあります。
          </p>
        </div>
      </section>

      {/* Recommended */}
      <section className="space-y-3">
        <h2 className="text-white font-bold text-lg">おすすめVPNサービス</h2>
        <div className="space-y-2">
          {VPN_SERVICES.map((vpn) => (
            <a
              key={vpn.name}
              href={vpn.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-[#1E293B] border border-white/5 rounded-xl px-5 py-4 hover:border-white/15 transition-colors"
            >
              <p className="text-white text-sm font-medium">{vpn.name}</p>
              <p className="text-white/40 text-xs mt-1">{vpn.desc}</p>
            </a>
          ))}
        </div>
      </section>

      {/* How to use */}
      <section className="space-y-3">
        <h2 className="text-white font-bold text-lg">設定方法</h2>
        <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5 space-y-3 text-white/60 text-sm leading-relaxed">
          <ol className="list-decimal list-inside space-y-2">
            <li>上記のVPNサービスからアカウントを作成</li>
            <li>VPNアプリをインストール</li>
            <li>目的の国のサーバーに接続（例: インドのサーバー）</li>
            <li>RyokoAIで生成したリンクをクリック</li>
            <li>OTAサイトでその国の料金が表示される</li>
          </ol>
        </div>
      </section>

      <div className="text-center">
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
