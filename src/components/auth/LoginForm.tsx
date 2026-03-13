'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import OAuthButtons from './OAuthButtons'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showResetHint, setShowResetHint] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setShowResetHint(false)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      const messages: Record<string, string> = {
        'Invalid login credentials': 'メールアドレスまたはパスワードが正しくありません',
        'Email not confirmed': 'メールアドレスが未確認です。受信メールの確認リンクを開いてください',
        'Too many requests': '試行回数が多すぎます。しばらくしてからお試しください',
      }
      if (error.message.includes('Invalid login')) {
        setShowResetHint(true)
      }
      setError(messages[error.message] || `認証エラー: ${error.message}`)
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">ログイン</h1>
        <p className="mt-2 text-sm text-gray-400">RyokoAIにログインして高速検索を利用</p>
      </div>

      <OAuthButtons />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-400">または</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}
        {showResetHint && (
          <p className="text-sm text-gray-500">
            Googleで登録した方は
            <Link href="/forgot-password" className="text-blue-800 font-semibold ml-1">
              こちらからパスワードを設定
            </Link>
            してください。
          </p>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">メールアドレス</label>
          <input
            id="email" type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">パスワード</label>
          <input
            id="password" type="password" required value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
            placeholder="パスワード"
          />
        </div>

        <button
          type="submit" disabled={loading}
          className="w-full rounded-xl bg-blue-800 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-900 disabled:opacity-50"
        >
          {loading ? 'ログイン中...' : 'ログイン'}
        </button>

        <div className="text-center">
          <Link href="/forgot-password" className="text-sm text-gray-400 underline hover:text-gray-600">
            パスワードを忘れた方・パスワード設定
          </Link>
        </div>
      </form>

      <p className="text-center text-sm text-gray-400">
        アカウントをお持ちでない方は{' '}
        <Link href="/signup" className="font-semibold text-blue-800 hover:text-blue-700">新規登録</Link>
      </p>
    </div>
  )
}
