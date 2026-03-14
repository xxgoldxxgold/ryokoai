'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('パスワードは6文字以上にしてください')
      return
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError('パスワードの更新に失敗しました。リンクの有効期限が切れている可能性があります。')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => {
      router.push('/')
      router.refresh()
    }, 2000)
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">パスワードを更新しました</h2>
          <p className="text-gray-500 text-sm">トップページに移動します...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            新しいパスワードを設定
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            新しいパスワードを入力してください
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              新しいパスワード
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
              placeholder="6文字以上"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              パスワード確認
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
              placeholder="もう一度入力"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-800 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-900 disabled:opacity-50"
          >
            {loading ? '更新中...' : 'パスワードを更新'}
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
