import SignupForm from '@/components/auth/SignupForm'
import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: '新規登録 | RyokoAI',
  description: 'RyokoAIに登録して高速ホテル検索を利用',
}

export default function SignupPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center bg-white px-4">
      <Link href="/" className="mb-8 flex items-center gap-2 text-xl font-bold text-gray-900 tracking-tight">
        <Image src="/logo.png" alt="RyokoAI" width={32} height={32} className="h-8 w-8" />
        Ryoko<span className="text-indigo-500">AI</span>
      </Link>
      <SignupForm />
    </div>
  )
}
