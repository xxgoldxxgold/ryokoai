'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useState } from 'react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })

    if (error) {
      setError('エラーが発生しました。もう一度お試しください。')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900">メールを送信しました</h2>
          <p className="text-gray-600">
            <span className="font-medium">{email}</span> にパスワード設定用のリンクを送信しました。
          </p>
          <Link href="/login" className="inline-block text-sm font-semibold text-blue-800 hover:text-blue-700">
            ログインページへ戻る
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            パスワードリセット
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            登録済みのメールアドレスを入力してください
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
              placeholder="you@example.com"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-800 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-900 disabled:opacity-50"
          >
            {loading ? '送信中...' : 'リセットメールを送信'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400">
          <Link href="/login" className="font-semibold text-blue-800 hover:text-blue-700">
            ログインページへ戻る
          </Link>
        </p>
      </div>
    </div>
  )
}
