import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';

export default function PlanDetailPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-24 px-4 max-w-4xl mx-auto w-full">
        <Card className="p-8 text-center">
          <p className="text-white/50">Plan details will appear here.</p>
        </Card>
      </main>
    </div>
  );
}
