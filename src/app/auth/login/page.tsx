'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Header from '@/components/layout/Header';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      if (!supabase) { setError('Auth not configured yet.'); setLoading(false); return; }
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
      } else {
        window.location.href = '/chat';
      }
    } catch {
      setError('ログインに失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center px-4 pt-16">
        <Card className="w-full max-w-sm p-6 space-y-6">
          <div className="text-center">
            <h1 className="text-xl font-bold text-gold">RyokoAIにログイン</h1>
            <p className="text-white/40 text-sm mt-1">旅行プランと履歴を保存できます</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-white/50 mb-1">メールアドレス</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">パスワード</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワード"
                required
              />
            </div>

            {error && <div className="text-red-400 text-xs">{error}</div>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'ログイン中...' : 'ログイン'}
            </Button>
          </form>

          <div className="text-center text-sm text-white/40">
            アカウントをお持ちでない方は{' '}
            <Link href="/auth/signup" className="text-gold hover:underline">
              新規登録
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
