'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Header from '@/components/layout/Header';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      if (!supabase) { setError('Auth not configured yet.'); setLoading(false); return; }
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
      } else {
        setSuccess(true);
      }
    } catch {
      setError('登録に失敗しました。もう一度お試しください。');
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
            <h1 className="text-xl font-bold text-gold">アカウント作成</h1>
            <p className="text-white/40 text-sm mt-1">AIで旅行計画を始めましょう</p>
          </div>

          {success ? (
            <div className="text-center text-green-400 text-sm">
              確認メールを送信しました。メールを確認してアカウントを有効化してください。
            </div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
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
                  placeholder="6文字以上"
                  minLength={6}
                  required
                />
              </div>

              {error && <div className="text-red-400 text-xs">{error}</div>}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? '作成中...' : 'アカウント作成'}
              </Button>
            </form>
          )}

          <div className="text-center text-sm text-white/40">
            既にアカウントをお持ちの方は{' '}
            <Link href="/auth/login" className="text-gold hover:underline">
              ログイン
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
