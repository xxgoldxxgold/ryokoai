import Link from 'next/link';

export default function Header() {
  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-gray-900 tracking-tight">
          Ryoko<span className="text-indigo-500">AI</span>
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link href="/guide" className="text-gray-400 hover:text-gray-700 transition-colors">
            VPNガイド
          </Link>
        </nav>
      </div>
    </header>
  );
}
