import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Link from 'next/link';

export default function PlansPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-24 px-4 max-w-4xl mx-auto w-full">
        <h1 className="text-2xl font-bold text-white mb-6">マイ旅行プラン</h1>
        <Card className="p-8 text-center">
          <p className="text-white/50 mb-4">保存済みのプランはまだありません。</p>
          <Link
            href="/chat"
            className="text-gold hover:underline text-sm"
          >
            チャットで最初のプランを作成する →
          </Link>
        </Card>
      </main>
    </div>
  );
}
