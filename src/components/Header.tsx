import Link from 'next/link';

export default function Header() {
  return (
    <header className="fixed top-0 w-full z-50 bg-[#0F172A]/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-white tracking-tight">
          Ryoko<span className="text-indigo-400">AI</span>
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link href="/guide" className="text-white/50 hover:text-white transition-colors">
            VPNガイド
          </Link>
        </nav>
      </div>
    </header>
  );
}
