'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

function AuthModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setOauthLoading(provider);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { setOauthLoading(null); setMsg({ type: 'error', text: error.message }); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const m: Record<string, string> = {
        'Invalid login credentials': 'メールアドレスまたはパスワードが正しくありません',
        'Email not confirmed': 'メールアドレスが未確認です',
      };
      setMsg({ type: 'error', text: m[error.message] || error.message });
      setLoading(false);
    } else {
      onClose();
      router.refresh();
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (password.length < 6) { setMsg({ type: 'error', text: 'パスワードは6文字以上' }); return; }
    setLoading(true);
    const supabase = createClient();
    const { error, data } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      const m: Record<string, string> = {
        'User already registered': 'すでに登録済みのメールアドレスです',
      };
      setMsg({ type: 'error', text: m[error.message] || error.message });
      setLoading(false);
    } else if (data.user && !data.session) {
      setMsg({ type: 'success', text: '確認メールを送信しました。メール内のリンクをクリックしてください。' });
      setLoading(false);
    } else {
      onClose();
      router.refresh();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-start justify-center bg-black/45 pt-16 px-4 pb-10 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative bg-gray-50 rounded-2xl max-w-[440px] w-full p-7 shadow-2xl animate-[modalIn_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-4 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>

        {/* Social OAuth */}
        <div className="mb-5">
          <div className="grid grid-cols-2 gap-3 max-[420px]:grid-cols-1">
            <button
              onClick={() => handleOAuth('google')}
              disabled={oauthLoading !== null}
              className="flex items-center justify-center gap-2.5 min-h-[46px] px-3.5 rounded-xl border border-gray-200 bg-white text-gray-900 font-bold text-sm shadow-sm hover:shadow-md hover:-translate-y-px active:translate-y-0 transition-all disabled:opacity-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {oauthLoading === 'google' ? '接続中...' : 'Googleでログイン'}
            </button>
            <button
              onClick={() => handleOAuth('apple')}
              disabled={oauthLoading !== null}
              className="flex items-center justify-center gap-2.5 min-h-[46px] px-3.5 rounded-xl border border-gray-900 bg-gray-900 text-white font-bold text-sm shadow-sm hover:bg-black hover:-translate-y-px active:translate-y-0 transition-all disabled:opacity-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              {oauthLoading === 'apple' ? '接続中...' : 'Appleでログイン'}
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-gray-400 text-xs">またはメールで</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-200/60 rounded-lg p-1 mb-4">
          <button
            onClick={() => { setTab('login'); setMsg(null); }}
            className={`flex-1 py-2 rounded-md text-sm font-bold transition-colors ${tab === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >ログイン</button>
          <button
            onClick={() => { setTab('signup'); setMsg(null); }}
            className={`flex-1 py-2 rounded-md text-sm font-bold transition-colors ${tab === 'signup' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >新規登録</button>
        </div>

        {/* Forms */}
        <form onSubmit={tab === 'login' ? handleLogin : handleSignup} className="space-y-3">
          <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="メールアドレス"
              className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent"
            />
          </div>
          <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder={tab === 'signup' ? 'パスワード（6文字以上）' : 'パスワード'}
              className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent"
            />
          </div>

          {msg && (
            <div className={`rounded-xl px-4 py-2.5 text-sm ${msg.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              {msg.text}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-800 text-white text-sm font-bold hover:bg-blue-900 transition-colors disabled:opacity-50 shadow-sm"
          >
            {loading ? (tab === 'login' ? 'ログイン中...' : '登録中...') : (tab === 'login' ? 'ログイン' : '登録する')}
          </button>
        </form>
      </div>
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

  const closeModal = useCallback(() => setShowAuth(false), []);

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1 text-lg font-bold text-gray-900 tracking-tight">
            <img src="/logo.png" alt="RyokoAI" style={{ height: '0.8em', width: 'auto' }} />
            Ryoko<span className="text-blue-700">AI</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/guide" className="text-gray-900 hover:text-gray-700 transition-colors">
              説明
            </Link>
            {!loading && (
              user ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-200 flex items-center justify-center">
                    <span className="text-blue-800 text-xs font-bold">
                      {(user.email?.[0] || 'U').toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden sm:inline text-xs">ログアウト</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  className="px-4 py-1.5 rounded-full border-2 border-blue-700 bg-blue-100/50 text-blue-800 font-bold text-sm hover:bg-blue-200 active:translate-y-0 transition-all"
                >
                  登録 / ログイン
                </button>
              )
            )}
          </nav>
        </div>
      </header>
      {showAuth && <AuthModal onClose={closeModal} />}
    </>
  );
}
