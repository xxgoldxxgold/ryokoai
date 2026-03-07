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
        <Image src="/logo.png" alt="RyokoAI" width={28} height={28} style={{ height: '1.15em', width: 'auto' }} />
        Ryoko<span className="text-indigo-500">AI</span>
      </Link>
      <LoginForm />
    </div>
  )
}
