import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-gold/5 via-transparent to-transparent" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-blue-500/5 rounded-full blur-[100px]" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
          Find the best travel deals{' '}
          <span className="text-gold">with AI</span>
        </h1>
        <p className="mt-4 text-base md:text-lg text-white/50 max-w-2xl mx-auto leading-relaxed">
          Compare prices across Agoda, Booking.com, Expedia and more — all in one chat.
          <br />
          <span className="text-white/30">Agoda, Booking.com, Expedia等を一括比較 — チャットで簡単予約</span>
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/chat">
            <Button size="lg" className="text-base">
              Start Planning →
            </Button>
          </Link>
          <span className="text-white/30 text-sm">Free, no account required</span>
        </div>
      </div>
    </section>
  );
}
