'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import OAuthButtons from './OAuthButtons'

export default function SignupForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (password.length < 6) {
      setError('パスワードは6文字以上にしてください')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      const messages: Record<string, string> = {
        'User already registered': 'すでに登録済みのメールアドレスです',
        'Signup requires a valid password': 'パスワードは6文字以上にしてください',
        'Too many requests': '試行回数が多すぎます。しばらくしてからお試しください',
      }
      setError(messages[error.message] || `登録エラー: ${error.message}`)
      setLoading(false)
      return
    }

    if (data.user && !data.session) {
      setSuccess(true)
      setLoading(false)
      return
    }

    if (data.session) {
      router.push('/')
      router.refresh()
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900">メールを確認してください</h2>
        <p className="text-gray-500 text-sm">
          <span className="font-medium text-gray-900">{email}</span> に確認メールを送信しました。
          メール内のリンクをクリックして登録を完了してください。
        </p>
        <Link href="/login" className="inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-500">
          ログインページへ戻る
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">新規登録</h1>
        <p className="mt-2 text-sm text-gray-400">無料で高速ホテル検索を利用しよう</p>
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

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">メールアドレス</label>
          <input
            id="email" type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">パスワード</label>
          <input
            id="password" type="password" required minLength={6} value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="6文字以上"
          />
        </div>

        <button
          type="submit" disabled={loading}
          className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? '登録中...' : '無料で始める'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-400">
        すでにアカウントをお持ちの方は{' '}
        <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">ログイン</Link>
      </p>
    </div>
  )
}
