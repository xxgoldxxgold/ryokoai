import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#0a0a0f] border-t border-white/[0.06] py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-white/40 text-sm">
            RyokoAI &copy; {new Date().getFullYear()}
          </div>
          <nav className="flex items-center gap-6 text-sm text-white/40">
            <Link href="/about" className="hover:text-white/70 transition-colors">RyokoAIについて</Link>
            <Link href="/privacy" className="hover:text-white/70 transition-colors">プライバシー</Link>
            <Link href="/terms" className="hover:text-white/70 transition-colors">利用規約</Link>
          </nav>
        </div>
        <div className="mt-4 text-center text-xs text-white/20">
          Powered by Travelpayouts. RyokoAIはリンク経由の予約でコミッションを受け取ります。価格は直接予約と同じです。追加料金は一切かかりません。
        </div>
      </div>
    </footer>
  );
}
