'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

function AuthDropdown({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setLoading(provider);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      console.error(error);
      setLoading(null);
    }
  };

  return (
    <div ref={ref} className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-200 p-5 space-y-3 animate-[fadeIn_0.15s_ease-out]">
      <p className="text-gray-900 font-bold text-sm text-center">ログイン / 新規登録</p>
      <p className="text-gray-400 text-xs text-center">無料で高速検索を利用できます</p>

      <button
        onClick={() => handleOAuth('google')}
        disabled={loading !== null}
        className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
      >
        <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        {loading === 'google' ? '接続中...' : 'Googleで続ける'}
      </button>

      <button
        onClick={() => handleOAuth('apple')}
        disabled={loading !== null}
        className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
      >
        <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
        </svg>
        {loading === 'apple' ? '接続中...' : 'Appleで続ける'}
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
        <div className="relative flex justify-center"><span className="bg-white px-2 text-[10px] text-gray-300">または</span></div>
      </div>

      <Link
        href="/login"
        onClick={onClose}
        className="block text-center text-xs text-gray-400 hover:text-indigo-500 transition-colors"
      >
        メールアドレスでログイン
      </Link>
    </div>
  );
}

export default function Header() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(false);

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
            <div className="relative">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-600 text-xs font-bold">
                      {(user.email?.[0] || 'U').toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden sm:inline text-xs">ログアウト</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setShowAuth(!showAuth)}
                    className="bg-indigo-600 text-white px-3.5 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                  >
                    ログイン
                  </button>
                  {showAuth && <AuthDropdown onClose={() => setShowAuth(false)} />}
                </>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
