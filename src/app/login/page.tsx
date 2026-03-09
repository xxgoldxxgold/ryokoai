import LoginForm from '@/components/auth/LoginForm'
import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'ログイン | RyokoAI',
  description: 'RyokoAIにログイン',
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center bg-white px-4">
      <Link href="/" className="mb-8 flex items-center gap-1 text-xl font-bold text-gray-900 tracking-tight">
        <img src="/logo.png" alt="RyokoAI" style={{ height: '0.8em', width: 'auto' }} />
        Ryoko<span className="text-blue-700">AI</span>
      </Link>
      <LoginForm />
    </div>
  )
}
