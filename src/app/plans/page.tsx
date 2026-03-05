import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Link from 'next/link';

export default function PlansPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-24 px-4 max-w-4xl mx-auto w-full">
        <h1 className="text-2xl font-bold text-white mb-6">My Travel Plans</h1>
        <Card className="p-8 text-center">
          <p className="text-white/50 mb-4">No saved plans yet.</p>
          <Link
            href="/chat"
            className="text-gold hover:underline text-sm"
          >
            Start chatting to create your first plan →
          </Link>
        </Card>
      </main>
    </div>
  );
}
