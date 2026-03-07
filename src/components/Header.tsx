'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-gray-900 tracking-tight">
          Ryoko<span className="text-indigo-500">AI</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/guide" className="text-gray-400 hover:text-gray-700 transition-colors">
            VPNガイド
          </Link>
          {!loading && (
            user ? (
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-gray-700 transition-colors"
              >
                ログアウト
              </button>
            ) : (
              <Link
                href="/login"
                className="bg-indigo-600 text-white px-3.5 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                ログイン
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
